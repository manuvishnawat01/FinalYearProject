from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.medication import Medication
from app.schemas.intelligence_modules import (
    MedicationCreate,
    MedicationOut,
    DuplicateSaltAlert,
    DrugInteractionResult
)
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.medicine_salt_service import MedicineSaltService
from app.services.timeline_service import TimelineService

router = APIRouter()

@router.post("/", response_model=MedicationOut, status_code=status.HTTP_201_CREATED)
def add_medication(
    med_in: MedicationCreate,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_edit", resource_type="medication")

    if not med_in.ingredients:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A medication record must identify at least one active pharmaceutical ingredient (salt)."
        )

    med = MedicineSaltService.add_medication(db=db, patient_id=target_patient_id, med_in=med_in)

    # Add to unified timeline
    salts_str = ", ".join([f"{i.ingredient_name} ({i.strength or ''}{i.strength_unit or ''})" for i in med.ingredients])
    TimelineService.record_event(
        db=db,
        patient_id=target_patient_id,
        event_date=med.start_date,
        event_category="medication_change",
        title=f"Medicine Started: {med.brand_name}",
        description=f"Active Salts: {salts_str}. Dosage: {med.prescribed_dosage} ({med.frequency or 'Daily'}).",
        source_type="medication",
        source_id=med.id,
        verification_status=med.verification_status
    )

    return med

@router.get("/", response_model=List[MedicationOut])
def list_medications(
    patient_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_medicines", resource_type="medication")

    query = db.query(Medication).filter(Medication.patient_id == target_patient_id)
    if status_filter:
        query = query.filter(Medication.status == status_filter)
    return query.order_by(Medication.start_date.desc()).all()

@router.get("/duplicate-check", response_model=List[DuplicateSaltAlert])
def check_duplicate_ingredients(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_medicines", resource_type="medication_duplicate_check")

    return MedicineSaltService.detect_duplicate_ingredients(db=db, patient_id=target_patient_id)

@router.get("/interactions", response_model=DrugInteractionResult)
def check_drug_interactions(
    patient_id: Optional[int] = None,
    simulate_outage: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_medicines", resource_type="medication_interactions")

    return MedicineSaltService.check_patient_drug_interactions(
        db=db,
        patient_id=target_patient_id,
        simulate_outage=simulate_outage
    )
