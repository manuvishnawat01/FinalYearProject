from typing import List, Dict, Any, Optional
import datetime
from sqlalchemy.orm import Session
from app.models.symptom import Symptom, AdverseEffectReference
from app.models.medication import Medication, MedicineHistoryEvent
from app.models.health_reading import DailyHealthReading
from app.schemas.intelligence_modules import SymptomCreate, SymptomCorrelationResult, SymptomOut

class SymptomCorrelatorService:
    # Deterministic Emergency Red-Flag Escalation Rules (AHA / NICE Emergency Medicine)
    RED_FLAG_SYMPTOMS = [
        {
            "trigger": ["chest pain", "angina", "crushing chest pressure", "heart attack"],
            "severity_min": 5,
            "title": "URGENT RED FLAG: Potential Cardiac Emergency",
            "action": "Call emergency medical services (e.g., 911 / 112 / 102) immediately. Do not drive yourself to the emergency department."
        },
        {
            "trigger": ["shortness of breath", "dyspnea", "struggling to breathe", "severe breathlessness"],
            "severity_min": 6,
            "title": "URGENT RED FLAG: Acute Respiratory Distress",
            "action": "Immediate emergency care required. Sit upright and contact emergency dispatch right away."
        },
        {
            "trigger": ["facial drooping", "arm weakness", "slurred speech", "stroke", "numbness on one side"],
            "severity_min": 4,
            "title": "URGENT RED FLAG: FAST Stroke Symptoms",
            "action": "Act F.A.S.T. Call emergency medical assistance immediately; acute ischemic stroke requires intervention within minutes."
        },
        {
            "trigger": ["anaphylaxis", "throat swelling", "swollen tongue", "hives with breathing difficulty"],
            "severity_min": 5,
            "title": "URGENT RED FLAG: Severe Anaphylactic Reaction",
            "action": "Administer intramuscular epinephrine auto-injector if prescribed, and call emergency services immediately."
        }
    ]

    KNOWN_SIDE_EFFECTS_MAP = {
        "lisinopril": [
            {"effect": "dry cough", "frequency": "10-15%", "evidence": "FDA Package Insert", "severity": "mild_to_moderate"},
            {"effect": "dizziness", "frequency": "5-10%", "evidence": "DailyMed", "severity": "mild"}
        ],
        "metformin": [
            {"effect": "diarrhea", "frequency": "15-20%", "evidence": "ADA/FDA Guidelines", "severity": "mild"},
            {"effect": "nausea", "frequency": "10-15%", "evidence": "Lexicomp", "severity": "mild"},
            {"effect": "abdominal bloating", "frequency": "10%", "evidence": "FDA Monograph", "severity": "mild"}
        ],
        "atorvastatin": [
            {"effect": "muscle ache", "frequency": "5-8%", "evidence": "AHA Statin Safety Statement", "severity": "moderate"},
            {"effect": "myalgia", "frequency": "5-8%", "evidence": "AHA Statin Safety Statement", "severity": "moderate"},
            {"effect": "elevated liver enzymes", "frequency": "1-2%", "evidence": "FDA Drug Label", "severity": "moderate"}
        ],
        "amlodipine": [
            {"effect": "peripheral edema", "frequency": "10-15%", "evidence": "FDA Label", "severity": "mild"},
            {"effect": "ankle swelling", "frequency": "10-15%", "evidence": "FDA Label", "severity": "mild"},
            {"effect": "flushing", "frequency": "3-5%", "evidence": "EMA Assessment", "severity": "mild"}
        ]
    }

    @staticmethod
    def record_symptom(db: Session, patient_id: int, s_in: SymptomCreate) -> Symptom:
        sym = Symptom(
            patient_id=patient_id,
            symptom_name=s_in.symptom_name.strip(),
            description=s_in.description,
            onset_date=s_in.onset_date,
            onset_time=s_in.onset_time,
            end_date=s_in.end_date,
            end_time=s_in.end_time,
            is_ongoing=s_in.is_ongoing or False,
            severity=s_in.severity,
            duration_hours=s_in.duration_hours,
            frequency=s_in.frequency,
            associated_measurement_type=s_in.associated_measurement_type,
            associated_measurement_value=s_in.associated_measurement_value,
            notes=s_in.notes,
            source_provenance="patient_entered",
            verification_status="confirmed_by_user"
        )
        db.add(sym)
        db.commit()
        db.refresh(sym)
        return sym

    @staticmethod
    def correlate_symptom(db: Session, patient_id: int, symptom_id: int) -> SymptomCorrelationResult:
        sym = db.query(Symptom).filter(Symptom.id == symptom_id, Symptom.patient_id == patient_id).first()
        if not sym:
            raise ValueError("Symptom record not found.")

        # 1. Deterministic Red Flag Escalation Check
        red_flag = None
        symptom_lower = (sym.symptom_name + " " + (sym.description or "")).lower()
        for rule in SymptomCorrelatorService.RED_FLAG_SYMPTOMS:
            for trig in rule["trigger"]:
                if trig in symptom_lower and sym.severity >= rule["severity_min"]:
                    red_flag = {
                        "is_critical": True,
                        "title": rule["title"],
                        "emergency_action": rule["action"],
                        "detected_trigger": trig,
                        "severity_level": sym.severity
                    }
                    break
            if red_flag:
                break

        # 2. Temporal correlation with medication events (start dates, changes within +/- 30 days of onset)
        med_events = []
        meds = db.query(Medication).filter(Medication.patient_id == patient_id).all()
        
        try:
            onset_dt = datetime.datetime.strptime(sym.onset_date[:10], "%Y-%m-%d").date()
        except Exception:
            onset_dt = datetime.date.today()

        known_effects_found = []

        for m in meds:
            # Check med start date
            try:
                start_dt = datetime.datetime.strptime(m.start_date[:10], "%Y-%m-%d").date()
                diff_days = (onset_dt - start_dt).days
                if -14 <= diff_days <= 60:
                    med_events.append({
                        "event_type": "medication_started",
                        "medication_name": m.brand_name,
                        "generic_name": m.generic_name,
                        "date": m.start_date,
                        "days_from_symptom": diff_days,
                        "relationship_text": f"Started {abs(diff_days)} day(s) before symptom onset" if diff_days >= 0 else f"Started {abs(diff_days)} day(s) after symptom onset"
                    })
            except Exception:
                pass

            # Check known side-effects reference
            generic_key = (m.generic_name or m.brand_name).lower()
            for k, effects in SymptomCorrelatorService.KNOWN_SIDE_EFFECTS_MAP.items():
                if k in generic_key:
                    for eff in effects:
                        if eff["effect"] in symptom_lower:
                            known_effects_found.append({
                                "medication": m.brand_name,
                                "generic": m.generic_name,
                                "reported_adverse_effect": eff["effect"],
                                "frequency": eff["frequency"],
                                "evidence_source": eff["evidence"],
                                "severity": eff["severity"]
                            })

        # 3. Non-causal explanation
        if med_events or known_effects_found:
            explanation = (
                f"Symptom '{sym.symptom_name}' recorded on {sym.onset_date} is temporally proximate to {len(med_events)} medication event(s). "
                f"Temporal closeness suggests an association to discuss during your clinical consultation, but does NOT establish that the medication caused the symptom. "
                f"Only a qualified physician can evaluate causation, treatment response, and diagnostic alternatives."
            )
        else:
            explanation = (
                f"Symptom '{sym.symptom_name}' recorded on {sym.onset_date} has no direct temporal correlation with recent medication changes in your file. "
                f"Log ongoing severity to provide a comprehensive timeline for your doctor."
            )

        return SymptomCorrelationResult(
            symptom=SymptomOut.from_orm(sym),
            temporal_events=med_events,
            known_side_effects=known_effects_found,
            non_causal_explanation=explanation,
            red_flag_alert=red_flag
        )
