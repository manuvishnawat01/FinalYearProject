import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.health_event import HealthEvent
from app.models.document import MedicalObservation, MedicalDocument
from app.models.health_reading import DailyHealthReading
from app.models.medication import Medication
from app.models.supplement import Supplement
from app.models.symptom import Symptom
from app.schemas.core_health import HealthEventOut
from app.schemas.intelligence_modules import (
    ObservationCompareResult,
    ObservationComparisonItem
)

class TimelineService:
    @staticmethod
    def get_unified_timeline(
        db: Session,
        patient_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        event_category: Optional[str] = None,
        source_type: Optional[str] = None,
        verification_status: Optional[str] = None
    ) -> List[HealthEventOut]:
        """
        Returns chronological unified health events for the authenticated patient.
        Combines HealthEvent records with real-time provenance links.
        """
        query = db.query(HealthEvent).filter(HealthEvent.patient_id == patient_id)
        
        if start_date:
            query = query.filter(HealthEvent.event_date >= start_date)
        if end_date:
            query = query.filter(HealthEvent.event_date <= end_date)
        if event_category:
            query = query.filter(HealthEvent.event_category == event_category)
        if source_type:
            query = query.filter(HealthEvent.source_type == source_type)
        if verification_status:
            query = query.filter(HealthEvent.verification_status == verification_status)
            
        events = query.order_by(HealthEvent.event_date.desc(), HealthEvent.id.desc()).all()
        return events

    @staticmethod
    def record_event(
        db: Session,
        patient_id: int,
        event_date: str,
        event_category: str,
        title: str,
        description: str,
        source_type: str,
        source_id: Optional[int] = None,
        verification_status: str = "patient_entered",
        metadata: Optional[Dict[str, Any]] = None
    ) -> HealthEvent:
        event = HealthEvent(
            patient_id=patient_id,
            event_date=event_date,
            event_category=event_category,
            title=title,
            description=description,
            source_type=source_type,
            source_id=source_id,
            verification_status=verification_status,
            metadata_payload=metadata or {}
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def compare_observations(db: Session, patient_id: int, observation_ids: List[int]) -> ObservationCompareResult:
        """
        Historical comparison of 2 or more laboratory observations.
        Validates measurement compatibility, unit consistency, and calculates absolute & percentage changes.
        """
        if len(observation_ids) < 2:
            return ObservationCompareResult(
                test_name="Insufficient Observations",
                is_compatible=False,
                compatibility_reason="Please select at least two observations to perform a historical comparison.",
                items=[]
            )

        observations = db.query(MedicalObservation).filter(
            MedicalObservation.id.in_(observation_ids),
            MedicalObservation.patient_id == patient_id
        ).order_by(MedicalObservation.observation_date.asc()).all()

        if len(observations) < 2:
            return ObservationCompareResult(
                test_name="Unknown",
                is_compatible=False,
                compatibility_reason="One or more selected observation records could not be found for this patient.",
                items=[]
            )

        # Check name and unit compatibility
        base = observations[0]
        test_name = base.observation_name
        base_unit = (base.unit or "").strip().lower()
        
        items = []
        is_compatible = True
        compatibility_reason = "Observations are compatible and share identical measurement methodology."

        for obs in observations:
            doc_name = None
            if obs.document:
                doc_name = obs.document.file_name
            items.append(ObservationComparisonItem(
                observation_id=obs.id,
                observation_name=obs.observation_name,
                date=obs.observation_date,
                value=obs.numeric_value,
                string_value=obs.string_value,
                unit=obs.unit,
                reference_range_text=obs.reference_range_text,
                source_document=doc_name,
                verification_status=obs.verification_status
            ))
            
            # Check unit compatibility
            curr_unit = (obs.unit or "").strip().lower()
            if curr_unit != base_unit:
                is_compatible = False
                compatibility_reason = f"Incompatible measurement units: cannot compare '{base.unit}' with '{obs.unit}' without validated clinical conversion."

        abs_change = None
        pct_change = None
        calc_explanation = None

        if is_compatible:
            first_val = observations[0].numeric_value
            last_val = observations[-1].numeric_value
            
            if first_val is not None and last_val is not None:
                abs_change = round(last_val - first_val, 2)
                if first_val == 0:
                    pct_change = None
                    calc_explanation = f"Absolute change is {abs_change:+} {base.unit}. Percentage change cannot be calculated because the baseline value is zero."
                else:
                    pct_change = round(((last_val - first_val) / abs(first_val)) * 100, 2)
                    calc_explanation = f"Baseline: {first_val} {base.unit} on {observations[0].observation_date} -> Final: {last_val} {base.unit} on {observations[-1].observation_date}. Change: {abs_change:+} ({pct_change:+}%)."
            else:
                calc_explanation = "One or more observations lack numerical values (non-numeric test result)."
        else:
            calc_explanation = compatibility_reason

        return ObservationCompareResult(
            test_name=test_name,
            is_compatible=is_compatible,
            compatibility_reason=compatibility_reason,
            items=items,
            absolute_change=abs_change,
            percentage_change=pct_change,
            calculation_explanation=calc_explanation
        )

class SearchService:
    @staticmethod
    def safe_search_patient_history(db: Session, patient_id: int, query_text: str) -> Dict[str, Any]:
        """
        Translates natural language questions or structured queries into constrained,
        validated SQLAlchemy filters over the authenticated patient's records.
        NEVER executes raw generated SQL.
        """
        cleaned_query = query_text.strip().lower()
        results: Dict[str, Any] = {
            "query": query_text,
            "observations": [],
            "documents": [],
            "readings": [],
            "medications": [],
            "total_matches": 0,
            "message": ""
        }

        # 1. Search Observations
        # Extract potential test keywords (e.g. hba1c, creatinine, glucose, cholesterol, hemoglobin, platelet)
        obs_query = db.query(MedicalObservation).filter(MedicalObservation.patient_id == patient_id)
        
        # Substring / keyword filtering
        terms = [t for t in re.split(r'\W+', cleaned_query) if len(t) > 2]
        if not terms:
            results["message"] = "Query is too short or empty."
            return results

        # Match observations
        obs_matches = []
        for term in terms:
            found = obs_query.filter(
                or_(
                    MedicalObservation.observation_name.ilike(f"%{term}%"),
                    MedicalObservation.normalized_name.ilike(f"%{term}%")
                )
            ).all()
            for item in found:
                if item not in obs_matches:
                    obs_matches.append(item)

        # 2. Search Medical Documents
        doc_matches = []
        for term in terms:
            docs = db.query(MedicalDocument).filter(
                MedicalDocument.patient_id == patient_id,
                or_(
                    MedicalDocument.file_name.ilike(f"%{term}%"),
                    MedicalDocument.category.ilike(f"%{term}%"),
                    MedicalDocument.ocr_raw_text.ilike(f"%{term}%")
                )
            ).all()
            for d in docs:
                if d not in doc_matches:
                    doc_matches.append(d)

        # 3. Search Readings (e.g. BP, glucose)
        reading_matches = []
        if any(w in cleaned_query for w in ["bp", "blood pressure", "systolic", "diastolic", "pressure"]):
            bp_readings = db.query(DailyHealthReading).filter(
                DailyHealthReading.patient_id == patient_id,
                DailyHealthReading.reading_type == "blood_pressure"
            ).order_by(DailyHealthReading.reading_date.desc()).limit(10).all()
            reading_matches.extend(bp_readings)

        if any(w in cleaned_query for w in ["glucose", "sugar", "fasting", "post-meal", "breakfast"]):
            glucose_query = db.query(DailyHealthReading).filter(
                DailyHealthReading.patient_id == patient_id,
                DailyHealthReading.reading_type == "blood_glucose"
            )
            if "breakfast" in cleaned_query or "post_meal" in cleaned_query:
                glucose_query = glucose_query.filter(DailyHealthReading.glucose_context.in_(["post_meal", "pre_meal"]))
            if "fasting" in cleaned_query:
                glucose_query = glucose_query.filter(DailyHealthReading.glucose_context == "fasting")
            reading_matches.extend(glucose_query.order_by(DailyHealthReading.reading_date.desc()).limit(10).all())

        # 4. Search Medications
        med_matches = []
        for term in terms:
            meds = db.query(Medication).filter(
                Medication.patient_id == patient_id,
                or_(
                    Medication.brand_name.ilike(f"%{term}%"),
                    Medication.generic_name.ilike(f"%{term}%"),
                    Medication.reason_for_use.ilike(f"%{term}%")
                )
            ).all()
            for m in meds:
                if m not in med_matches:
                    med_matches.append(m)

        # Format output
        results["observations"] = [
            {
                "id": o.id,
                "name": o.observation_name,
                "value": o.numeric_value or o.string_value,
                "unit": o.unit,
                "reference_range": o.reference_range_text,
                "date": o.observation_date,
                "interpretation": o.interpretation,
                "verification_status": o.verification_status,
                "source_provenance": o.source_provenance
            } for o in obs_matches
        ]
        results["documents"] = [
            {
                "id": d.id,
                "file_name": d.file_name,
                "category": d.category,
                "date": d.document_date or str(d.upload_date.date()),
                "status": d.status
            } for d in doc_matches
        ]
        results["readings"] = [
            {
                "id": r.id,
                "type": r.reading_type,
                "date": r.reading_date,
                "systolic": r.systolic,
                "diastolic": r.diastolic,
                "glucose_value": r.glucose_value,
                "glucose_context": r.glucose_context,
                "pulse": r.pulse,
                "weight_kg": r.weight_kg
            } for r in reading_matches
        ]
        results["medications"] = [
            {
                "id": m.id,
                "brand_name": m.brand_name,
                "generic_name": m.generic_name,
                "prescribed_dosage": m.prescribed_dosage,
                "status": m.status,
                "start_date": m.start_date,
                "end_date": m.end_date
            } for m in med_matches
        ]

        results["total_matches"] = len(results["observations"]) + len(results["documents"]) + len(results["readings"]) + len(results["medications"])
        if results["total_matches"] == 0:
            results["message"] = f"No records matching '{query_text}' were found in your available medical history."
        else:
            results["message"] = f"Found {results['total_matches']} matching record(s) in your history."

        return results
