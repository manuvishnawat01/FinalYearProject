from typing import List, Dict, Any, Optional
import datetime
from sqlalchemy.orm import Session
from app.models.document import MedicalDocument
from app.models.verification import PrescriptionVerification
from app.schemas.intelligence_modules import PrescriptionVerifyResult, FieldDiscrepancyItem

class PrescriptionVerifierService:
    DISCLAIMER = (
        "Notice: This tool compares OCR text candidates from prescriptions and packaging labels to highlight clerical discrepancies. "
        "It does NOT verify physical drug authenticity, chemical purity, or tamper-resistance. Always consult your dispensing pharmacist if any label detail is unexpected."
    )

    @staticmethod
    def verify_documents(
        db: Session,
        patient_id: int,
        prescription_doc_id: int,
        package_doc_id: int,
        custom_rx_data: Optional[Dict[str, Any]] = None,
        custom_pkg_data: Optional[Dict[str, Any]] = None
    ) -> PrescriptionVerifyResult:
        rx_doc = db.query(MedicalDocument).filter(
            MedicalDocument.id == prescription_doc_id,
            MedicalDocument.patient_id == patient_id
        ).first()

        pkg_doc = db.query(MedicalDocument).filter(
            MedicalDocument.id == package_doc_id,
            MedicalDocument.patient_id == patient_id
        ).first()

        if not rx_doc or not pkg_doc:
            raise ValueError("One or both documents could not be found.")

        # Candidate extraction (defaults to metadata_info or OCR simulation)
        rx_data = custom_rx_data or rx_doc.metadata_info or {
            "medicine_name": "Glucophage",
            "active_ingredient": "Metformin Hydrochloride",
            "strength": "500 mg",
            "dosage_form": "Tablet",
            "prescribed_dosage": "1 tablet twice daily",
            "prescriber": "Dr. Sarah Rao, MD"
        }

        pkg_data = custom_pkg_data or pkg_doc.metadata_info or {
            "product_name": "Glucophage",
            "active_ingredient": "Metformin Hydrochloride",
            "strength": "500 mg",
            "dosage_form": "Tablet",
            "manufacturer": "Merck Healthcare",
            "batch_number": "B72910A",
            "expiry_date": "2027-12"
        }

        discrepancies: List[FieldDiscrepancyItem] = []

        # 1. Active Ingredient Comparison (Most critical)
        rx_ing = str(rx_data.get("active_ingredient", "")).strip().lower()
        pkg_ing = str(pkg_data.get("active_ingredient", "")).strip().lower()
        if not rx_ing and not pkg_ing:
            status = "missing_on_one_side"
            exp = "Active ingredient missing on both documents."
        elif not rx_ing or not pkg_ing:
            status = "missing_on_one_side"
            exp = f"Active ingredient present on one document but missing on the other."
        elif rx_ing == pkg_ing:
            status = "match"
            exp = f"Active pharmaceutical ingredient matches exactly: '{rx_data.get('active_ingredient')}'."
        else:
            status = "potential_discrepancy"
            exp = f"Ingredient mismatch: Prescription specifies '{rx_data.get('active_ingredient')}', but package label displays '{pkg_data.get('active_ingredient')}'."

        discrepancies.append(FieldDiscrepancyItem(
            field_name="Active Ingredient (Salt)",
            prescription_value=str(rx_data.get("active_ingredient", "N/A")),
            packaging_value=str(pkg_data.get("active_ingredient", "N/A")),
            status=status,
            explanation=exp
        ))

        # 2. Strength Comparison
        rx_str = str(rx_data.get("strength", "")).strip().lower()
        pkg_str = str(pkg_data.get("strength", "")).strip().lower()
        if not rx_str or not pkg_str:
            status = "missing_on_one_side"
            exp = "Strength specification missing on one of the items."
        elif rx_str == pkg_str:
            status = "match"
            exp = f"Strengths match: {rx_data.get('strength')}."
        else:
            status = "potential_discrepancy"
            exp = f"Strength discrepancy detected: Prescription states '{rx_data.get('strength')}', while package displays '{pkg_data.get('strength')}'. Risk of under/over-dosage."

        discrepancies.append(FieldDiscrepancyItem(
            field_name="Strength / Concentration",
            prescription_value=str(rx_data.get("strength", "N/A")),
            packaging_value=str(pkg_data.get("strength", "N/A")),
            status=status,
            explanation=exp
        ))

        # 3. Dosage Form Comparison
        rx_form = str(rx_data.get("dosage_form", "")).strip().lower()
        pkg_form = str(pkg_data.get("dosage_form", "")).strip().lower()
        if rx_form == pkg_form and rx_form != "":
            status = "match"
            exp = f"Dosage forms match: {rx_data.get('dosage_form')}."
        elif not rx_form or not pkg_form:
            status = "uncertain"
            exp = "Dosage form could not be verified on both documents."
        else:
            status = "potential_discrepancy"
            exp = f"Dosage form discrepancy: '{rx_data.get('dosage_form')}' vs '{pkg_data.get('dosage_form')}'."

        discrepancies.append(FieldDiscrepancyItem(
            field_name="Dosage Form",
            prescription_value=str(rx_data.get("dosage_form", "N/A")),
            packaging_value=str(pkg_data.get("dosage_form", "N/A")),
            status=status,
            explanation=exp
        ))

        # 4. Brand Name / Product Name Comparison
        rx_name = str(rx_data.get("medicine_name", "")).strip().lower()
        pkg_name = str(pkg_data.get("product_name", "")).strip().lower()
        if rx_name == pkg_name and rx_name != "":
            status = "match"
            exp = f"Product names match: {rx_data.get('medicine_name')}."
        elif rx_name in pkg_name or pkg_name in rx_name:
            status = "match"
            exp = "Brand names align with minor packaging variations."
        else:
            status = "potential_discrepancy"
            exp = f"Brand name divergence: Rx specifies '{rx_data.get('medicine_name')}' vs packaging '{pkg_data.get('product_name')}'. May be a generic substitution."

        discrepancies.append(FieldDiscrepancyItem(
            field_name="Product Brand Name",
            prescription_value=str(rx_data.get("medicine_name", "N/A")),
            packaging_value=str(pkg_data.get("product_name", "N/A")),
            status=status,
            explanation=exp
        ))

        # Overall Status
        has_disc = any(d.status == "potential_discrepancy" for d in discrepancies)
        overall = "discrepancy_detected" if has_disc else "verified"

        # Persist audit record
        verification_record = PrescriptionVerification(
            patient_id=patient_id,
            prescription_doc_id=prescription_doc_id,
            package_doc_id=package_doc_id,
            rx_extracted_data=rx_data,
            pkg_extracted_data=pkg_data,
            field_comparisons=[d.dict() for d in discrepancies],
            overall_status=overall,
            disclaimer=PrescriptionVerifierService.DISCLAIMER,
            created_at=datetime.datetime.utcnow()
        )
        db.add(verification_record)
        db.commit()
        db.refresh(verification_record)

        return PrescriptionVerifyResult(
            id=verification_record.id,
            overall_status=overall,
            discrepancy_count=sum(1 for d in discrepancies if d.status == "potential_discrepancy"),
            discrepancies=discrepancies,
            disclaimer=PrescriptionVerifierService.DISCLAIMER,
            created_at=verification_record.created_at
        )
