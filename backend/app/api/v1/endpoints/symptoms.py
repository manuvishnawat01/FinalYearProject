from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.symptom import Symptom
from app.schemas.intelligence_modules import SymptomCreate, SymptomOut, SymptomCorrelationResult
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.symptom_correlator_service import SymptomCorrelatorService
from app.services.timeline_service import TimelineService

router = APIRouter()

@router.post("/", response_model=SymptomOut, status_code=status.HTTP_201_CREATED)
def record_symptom(
    sym_in: SymptomCreate,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_edit", resource_type="symptom")

    sym = SymptomCorrelatorService.record_symptom(db=db, patient_id=target_patient_id, s_in=sym_in)

    # Timeline event
    TimelineService.record_event(
        db=db,
        patient_id=target_patient_id,
        event_date=sym.onset_date,
        event_category="symptom",
        title=f"Symptom Logged: {sym.symptom_name}",
        description=f"Severity: {sym.severity}/10. Status: {'Ongoing' if sym.is_ongoing else 'Resolved'}. Notes: {sym.notes or 'None'}.",
        source_type="symptom",
        source_id=sym.id,
        verification_status="confirmed_by_user"
    )

    return sym

@router.get("/", response_model=List[SymptomOut])
def list_symptoms(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_readings", resource_type="symptom")

    return db.query(Symptom).filter(Symptom.patient_id == target_patient_id).order_by(Symptom.onset_date.desc()).all()

@router.get("/correlate/{id}", response_model=SymptomCorrelationResult)
def correlate_symptom(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sym = db.query(Symptom).filter(Symptom.id == id).first()
    if not sym:
        raise HTTPException(status_code=404, detail="Symptom not found.")

    verify_patient_access(db, current_user, sym.patient_id, required_permission="can_view_readings", resource_type="symptom_correlation", resource_id=str(id))

    return SymptomCorrelatorService.correlate_symptom(db=db, patient_id=sym.patient_id, symptom_id=id)
