from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.supplement import Supplement
from app.schemas.intelligence_modules import SupplementCreate, SupplementOut, NutrientIntakeItem
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.supplement_service import SupplementService
from app.services.timeline_service import TimelineService

router = APIRouter()

@router.post("/", response_model=SupplementOut, status_code=status.HTTP_201_CREATED)
def add_supplement(
    supp_in: SupplementCreate,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_edit", resource_type="supplement")

    if not supp_in.ingredients:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A supplement record must list at least one ingredient."
        )

    supp = SupplementService.add_supplement(db=db, patient_id=target_patient_id, supp_in=supp_in)

    # Timeline event
    ing_names = ", ".join([f"{i.ingredient_name} ({i.amount_per_serving or 'unspecified'}{i.unit or ''})" for i in supp.ingredients])
    TimelineService.record_event(
        db=db,
        patient_id=target_patient_id,
        event_date=supp.start_date,
        event_category="supplement_record",
        title=f"Supplement Added: {supp.product_name}",
        description=f"Ingredients: {ing_names}. Frequency: {supp.recorded_frequency or 'Daily'}.",
        source_type="supplement",
        source_id=supp.id,
        verification_status=supp.verification_status
    )

    return supp

@router.get("/", response_model=List[SupplementOut])
def list_supplements(
    patient_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_medicines", resource_type="supplement")

    query = db.query(Supplement).filter(Supplement.patient_id == target_patient_id)
    if status_filter:
        query = query.filter(Supplement.status == status_filter)
    return query.order_by(Supplement.start_date.desc()).all()

@router.get("/intake-analysis", response_model=List[NutrientIntakeItem])
def analyze_nutrient_intake(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_medicines", resource_type="supplement_analysis")

    return SupplementService.analyze_nutrient_intake(db=db, patient_id=target_patient_id)
