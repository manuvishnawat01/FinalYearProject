import os
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User
from app.models.medication import Medication
from app.models.supplement import Supplement
from app.models.health_reading import DailyHealthReading
from app.models.document import MedicalObservation, MedicalDocument
from app.models.symptom import Symptom
from app.models.visit_summary import DoctorVisitSummary
from app.schemas.intelligence_modules import DoctorVisitGenerateRequest, DoctorVisitSummaryOut

# ReportLab imports for generating genuine PDFs
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class DoctorVisitGeneratorService:
    @staticmethod
    def generate_summary(
        db: Session,
        patient_id: int,
        req: DoctorVisitGenerateRequest
    ) -> DoctorVisitSummaryOut:
        patient = db.query(User).filter(User.id == patient_id).first()
        if not patient:
            raise ValueError("Patient not found.")

        profile = patient.profile

        summary_data: Dict[str, Any] = {
            "patient_name": patient.full_name,
            "patient_email": patient.email,
            "dob": profile.date_of_birth if profile else "Not recorded",
            "blood_group": profile.blood_group if profile else "Not recorded",
            "allergies": profile.allergies if (profile and req.include_allergies) else [],
            "current_medications": [],
            "active_supplements": [],
            "recent_readings": [],
            "recent_labs": [],
            "recent_symptoms": [],
            "custom_questions": req.custom_questions or []
        }

        # 1. Medications
        if req.include_medications:
            meds = db.query(Medication).filter(
                Medication.patient_id == patient_id,
                Medication.status == "active"
            ).all()
            for m in meds:
                ings = ", ".join([f"{i.ingredient_name} ({i.strength or ''}{i.strength_unit or ''})" for i in m.ingredients])
                summary_data["current_medications"].append({
                    "brand_name": m.brand_name,
                    "ingredients": ings or m.generic_name or "N/A",
                    "dosage": m.prescribed_dosage or "As prescribed",
                    "frequency": m.frequency or "Daily",
                    "timing": m.timing_instructions or "Routine",
                    "verification": m.verification_status
                })

        # 2. Supplements
        if req.include_supplements:
            supps = db.query(Supplement).filter(
                Supplement.patient_id == patient_id,
                Supplement.status == "active"
            ).all()
            for s in supps:
                summary_data["active_supplements"].append({
                    "product": s.product_name,
                    "serving": s.serving_size or "Standard",
                    "frequency": s.recorded_frequency or "Daily"
                })

        # 3. Readings
        if req.include_readings:
            readings = db.query(DailyHealthReading).filter(
                DailyHealthReading.patient_id == patient_id,
                DailyHealthReading.reading_date >= req.date_range_start,
                DailyHealthReading.reading_date <= req.date_range_end
            ).order_by(DailyHealthReading.reading_date.desc()).limit(15).all()
            for r in readings:
                val_str = ""
                if r.reading_type == "blood_pressure":
                    val_str = f"{r.systolic}/{r.diastolic} mmHg"
                elif r.reading_type == "blood_glucose":
                    val_str = f"{r.glucose_value} mg/dL ({r.glucose_context or 'random'})"
                elif r.pulse:
                    val_str = f"Pulse: {r.pulse} bpm"
                elif r.weight_kg:
                    val_str = f"Weight: {r.weight_kg} kg"
                summary_data["recent_readings"].append({
                    "date": r.reading_date,
                    "type": r.reading_type.replace("_", " ").title(),
                    "value": val_str
                })

        # 4. Lab Observations
        if req.include_labs:
            labs = db.query(MedicalObservation).filter(
                MedicalObservation.patient_id == patient_id,
                MedicalObservation.observation_date >= req.date_range_start,
                MedicalObservation.observation_date <= req.date_range_end
            ).order_by(MedicalObservation.observation_date.desc()).limit(15).all()
            for l in labs:
                summary_data["recent_labs"].append({
                    "date": l.observation_date,
                    "test_name": l.observation_name,
                    "value": f"{l.numeric_value or l.string_value} {l.unit or ''}".strip(),
                    "reference_range": l.reference_range_text or "N/A",
                    "status": l.interpretation
                })

        # 5. Symptoms
        if req.include_symptoms:
            syms = db.query(Symptom).filter(
                Symptom.patient_id == patient_id,
                Symptom.onset_date >= req.date_range_start,
                Symptom.onset_date <= req.date_range_end
            ).order_by(Symptom.onset_date.desc()).limit(10).all()
            for s in syms:
                summary_data["recent_symptoms"].append({
                    "date": s.onset_date,
                    "symptom": s.symptom_name,
                    "severity": f"{s.severity}/10",
                    "ongoing": "Yes" if s.is_ongoing else "Resolved"
                })

        # Generate Genuine PDF
        timestamp_str = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        pdf_filename = f"Doctor_Visit_Prep_Patient_{patient_id}_{timestamp_str}.pdf"
        pdf_path = os.path.join(settings.EXPORT_DIR, pdf_filename)

        DoctorVisitGeneratorService._create_pdf(pdf_path, summary_data, req)

        # Store in database
        visit_record = DoctorVisitSummary(
            patient_id=patient_id,
            appointment_date=req.appointment_date,
            date_range_start=req.date_range_start,
            date_range_end=req.date_range_end,
            clinician_name=req.clinician_name,
            specialty=req.specialty,
            selected_sections=["allergies", "medications", "supplements", "readings", "labs", "symptoms"],
            custom_questions=req.custom_questions or [],
            summary_content=summary_data,
            pdf_filename=pdf_filename,
            pdf_path=pdf_path,
            created_at=datetime.datetime.utcnow()
        )
        db.add(visit_record)
        db.commit()
        db.refresh(visit_record)

        return DoctorVisitSummaryOut(
            id=visit_record.id,
            appointment_date=visit_record.appointment_date,
            date_range=f"{visit_record.date_range_start} to {visit_record.date_range_end}",
            clinician_name=visit_record.clinician_name,
            specialty=visit_record.specialty,
            summary_content=visit_record.summary_content,
            custom_questions=visit_record.custom_questions or [],
            pdf_download_url=f"/api/v1/doctor-visit/download-pdf/{visit_record.id}",
            created_at=visit_record.created_at
        )

    @staticmethod
    def _create_pdf(file_path: str, data: Dict[str, Any], req: DoctorVisitGenerateRequest):
        doc = SimpleDocTemplate(file_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor("#1e3a8a"),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'DocSub',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor("#4b5563"),
            spaceAfter=12
        )
        h2_style = ParagraphStyle(
            'H2',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor("#1e40af"),
            spaceBefore=10,
            spaceAfter=4
        )
        body_style = styles['Normal']

        # Header
        story.append(Paragraph("MediChronicle AI — Clinical Appointment Summary", title_style))
        appt_info = f"Patient: <b>{data['patient_name']}</b> (DOB: {data['dob']}, Blood Group: {data['blood_group']}) | Scope: {req.date_range_start} to {req.date_range_end}"
        if req.clinician_name:
            appt_info += f"<br/>Prepared for: <b>Dr. {req.clinician_name}</b> ({req.specialty or 'General Practice'})"
        story.append(Paragraph(appt_info, subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=10))

        # 1. Allergies
        if data.get("allergies"):
            story.append(Paragraph("Documented Allergies & Sensitivities", h2_style))
            allergy_text = ", ".join(data["allergies"])
            story.append(Paragraph(f"<font color='red'><b>Known Allergies:</b> {allergy_text}</font>", body_style))
            story.append(Spacer(1, 8))

        # 2. Current Medications
        story.append(Paragraph("Current Active Medications & Verification Status", h2_style))
        if data.get("current_medications"):
            med_table_data = [["Medicine Brand", "Active Salt / Ingredients", "Prescribed Dosage", "Timing / Frequency", "Status"]]
            for m in data["current_medications"]:
                med_table_data.append([m["brand_name"], m["ingredients"], m["dosage"], f"{m['frequency']} ({m['timing']})", m["verification"]])
            t = Table(med_table_data, colWidths=[110, 150, 110, 100, 70])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
                ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#0f172a")),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            story.append(t)
        else:
            story.append(Paragraph("No active medications recorded for this period.", body_style))
        story.append(Spacer(1, 10))

        # 3. Active Supplements
        if data.get("active_supplements"):
            story.append(Paragraph("Active Supplements & Nutrients", h2_style))
            supp_table = [["Supplement Product", "Serving Size", "Reported Frequency"]]
            for s in data["active_supplements"]:
                supp_table.append([s["product"], s["serving"], s["frequency"]])
            st = Table(supp_table, colWidths=[200, 170, 170])
            st.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ]))
            story.append(st)
            story.append(Spacer(1, 10))

        # 4. Recent Health Readings (BP / Glucose)
        if data.get("recent_readings"):
            story.append(Paragraph("Recent In-Home Vital & Metabolic Readings", h2_style))
            rd_table = [["Date", "Reading Metric", "Measurement & Context"]]
            for r in data["recent_readings"][:10]:
                rd_table.append([r["date"], r["type"], r["value"]])
            rt = Table(rd_table, colWidths=[100, 180, 260])
            rt.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ]))
            story.append(rt)
            story.append(Spacer(1, 10))

        # 5. Laboratory Findings
        if data.get("recent_labs"):
            story.append(Paragraph("Laboratory Observations & Ranges", h2_style))
            lab_table = [["Date", "Test Investigation", "Observed Value", "Reported Reference Range", "Status"]]
            for l in data["recent_labs"][:10]:
                lab_table.append([l["date"], l["test_name"], l["value"], l["reference_range"], l["status"].title()])
            lt = Table(lab_table, colWidths=[80, 170, 110, 110, 70])
            lt.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ]))
            story.append(lt)
            story.append(Spacer(1, 10))

        # 6. Symptoms
        if data.get("recent_symptoms"):
            story.append(Paragraph("Reported Symptoms & Onset", h2_style))
            sym_table = [["Date", "Symptom", "Severity (1-10)", "Ongoing Status"]]
            for s in data["recent_symptoms"]:
                sym_table.append([s["date"], s["symptom"], s["severity"], s["ongoing"]])
            syt = Table(sym_table, colWidths=[90, 200, 120, 130])
            syt.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ]))
            story.append(syt)
            story.append(Spacer(1, 10))

        # 7. Clinician Discussion Prompts
        if data.get("custom_questions"):
            story.append(Paragraph("Patient Questions for the Consultation", h2_style))
            for idx, q in enumerate(data["custom_questions"], 1):
                story.append(Paragraph(f"{idx}. {q}", body_style))
            story.append(Spacer(1, 10))

        # Footer
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=15, spaceAfter=6))
        story.append(Paragraph(
            "<font size=7 color='#64748b'>Generated automatically by MediChronicle AI Clinical Module. Traceable to authenticated electronic patient records. Not a substitute for clinical judgment.</font>",
            body_style
        ))

        doc.build(story)
