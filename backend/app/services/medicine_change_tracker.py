from typing import List, Dict, Any, Optional
import datetime
from sqlalchemy.orm import Session
from app.models.medication import Medication, MedicineHistoryEvent
from app.models.health_reading import DailyHealthReading
from app.models.document import MedicalObservation
from app.schemas.intelligence_modules import MedicineChangeReportOut

class MedicineChangeTrackerService:
    @staticmethod
    def record_change(
        db: Session,
        patient_id: int,
        medication_id: int,
        event_type: str, # stopped, changed, corrected
        event_date: str,
        new_instructions: Optional[str] = None,
        new_dosage: Optional[str] = None,
        recorded_reason: Optional[str] = None
    ) -> MedicineHistoryEvent:
        med = db.query(Medication).filter(
            Medication.id == medication_id,
            Medication.patient_id == patient_id
        ).first()

        if not med:
            raise ValueError("Medication record not found.")

        # Capture snapshot of previous state
        previous_snapshot = {
            "brand_name": med.brand_name,
            "generic_name": med.generic_name,
            "prescribed_dosage": med.prescribed_dosage,
            "timing_instructions": med.timing_instructions,
            "frequency": med.frequency,
            "status": med.status,
            "end_date": med.end_date
        }

        # Apply update
        if event_type == "stopped":
            med.status = "stopped"
            med.end_date = event_date
        elif event_type in ["changed", "corrected"]:
            if new_dosage:
                med.prescribed_dosage = new_dosage
            if new_instructions:
                med.timing_instructions = new_instructions
            med.status = "active"

        new_snapshot = {
            "brand_name": med.brand_name,
            "generic_name": med.generic_name,
            "prescribed_dosage": med.prescribed_dosage,
            "timing_instructions": med.timing_instructions,
            "frequency": med.frequency,
            "status": med.status,
            "end_date": med.end_date
        }

        hist_event = MedicineHistoryEvent(
            patient_id=patient_id,
            medication_id=med.id,
            event_type=event_type,
            event_date=event_date,
            previous_data=previous_snapshot,
            new_data=new_snapshot,
            recorded_reason=recorded_reason or f"Medication regimen {event_type}",
            source="manual_entry",
            verification_status="confirmed_by_user"
        )
        db.add(hist_event)
        db.commit()
        db.refresh(hist_event)
        return hist_event

    @staticmethod
    def generate_impact_comparison(
        db: Session,
        patient_id: int,
        medication_id: int,
        change_date: str,
        window_days: int = 30
    ) -> MedicineChangeReportOut:
        med = db.query(Medication).filter(Medication.id == medication_id, Medication.patient_id == patient_id).first()
        if not med:
            raise ValueError("Medication not found.")

        try:
            target_dt = datetime.datetime.strptime(change_date[:10], "%Y-%m-%d").date()
        except Exception:
            target_dt = datetime.date.today()

        pre_start = target_dt - datetime.timedelta(days=window_days)
        post_end = target_dt + datetime.timedelta(days=window_days)

        # Pull readings before and after
        all_readings = db.query(DailyHealthReading).filter(
            DailyHealthReading.patient_id == patient_id
        ).all()

        pre_readings = []
        post_readings = []

        for r in all_readings:
            try:
                rd_dt = datetime.datetime.strptime(r.reading_date[:10], "%Y-%m-%d").date()
                if pre_start <= rd_dt < target_dt:
                    pre_readings.append({
                        "date": r.reading_date,
                        "type": r.reading_type,
                        "systolic": r.systolic,
                        "diastolic": r.diastolic,
                        "glucose": r.glucose_value,
                        "context": r.glucose_context
                    })
                elif target_dt <= rd_dt <= post_end:
                    post_readings.append({
                        "date": r.reading_date,
                        "type": r.reading_type,
                        "systolic": r.systolic,
                        "diastolic": r.diastolic,
                        "glucose": r.glucose_value,
                        "context": r.glucose_context
                    })
            except Exception:
                pass

        # Pull lab observations before and after
        all_labs = db.query(MedicalObservation).filter(
            MedicalObservation.patient_id == patient_id
        ).all()

        pre_labs = []
        post_labs = []

        for o in all_labs:
            try:
                ob_dt = datetime.datetime.strptime(o.observation_date[:10], "%Y-%m-%d").date()
                entry = {
                    "date": o.observation_date,
                    "test_name": o.observation_name,
                    "value": o.numeric_value or o.string_value,
                    "unit": o.unit,
                    "range": o.reference_range_text
                }
                if pre_start <= ob_dt < target_dt:
                    pre_labs.append(entry)
                elif target_dt <= ob_dt <= post_end:
                    post_labs.append(entry)
            except Exception:
                pass

        summary_text = (
            f"Review window for '{med.brand_name}': {window_days} days before ({pre_start}) to {window_days} days after ({post_end}) the change on {change_date}. "
            f"Identified {len(pre_readings)} baseline readings and {len(post_readings)} post-change readings, alongside {len(pre_labs)} pre-change and {len(post_labs)} post-change lab results. "
            f"Note: Temporal variations do not independently demonstrate drug efficacy or adverse impact; changes must be reviewed clinically by the prescriber."
        )

        questions = [
            f"How do my post-change readings compare to the targeted therapeutic goal for {med.brand_name}?",
            f"Do any of the laboratory observations in the {window_days}-day window warrant a repeat panel?",
            "Are the current dosage instructions and administration timing optimal?"
        ]

        return MedicineChangeReportOut(
            medication_name=med.brand_name,
            change_event={
                "medication_id": med.id,
                "brand_name": med.brand_name,
                "current_status": med.status,
                "change_date": change_date
            },
            window_days=window_days,
            pre_change_readings=pre_readings,
            post_change_readings=post_readings,
            pre_change_labs=pre_labs,
            post_change_labs=post_labs,
            summary_text=summary_text,
            clinical_discussion_prompts=questions
        )
