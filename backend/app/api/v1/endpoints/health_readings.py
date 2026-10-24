from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.health_reading import DailyHealthReading
from app.schemas.core_health import ReadingCreate, ReadingOut
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.timeline_service import TimelineService

router = APIRouter()

@router.post("/", response_model=ReadingOut, status_code=status.HTTP_201_CREATED)
def record_daily_health_reading(
    reading_in: ReadingCreate,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_edit", resource_type="reading")

    # Enforce clinical validation rules
    if reading_in.reading_type == "blood_pressure":
        if reading_in.systolic is None or reading_in.diastolic is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Blood pressure readings must include paired systolic AND diastolic values. Neither can be omitted."
            )
        if reading_in.systolic <= reading_in.diastolic:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Systolic blood pressure must be greater than diastolic blood pressure."
            )

    if reading_in.reading_type == "blood_glucose":
        if reading_in.glucose_value is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Blood glucose measurement requires a numerical glucose value."
            )
        if not reading_in.glucose_context:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Blood glucose requires clinical context: fasting, pre_meal, post_meal, random, or bedtime."
            )

    reading = DailyHealthReading(
        patient_id=target_patient_id,
        reading_type=reading_in.reading_type,
        reading_date=reading_in.reading_date,
        measurement_time=reading_in.measurement_time or "08:00",
        systolic=reading_in.systolic,
        diastolic=reading_in.diastolic,
        glucose_value=reading_in.glucose_value,
        glucose_context=reading_in.glucose_context,
        pulse=reading_in.pulse,
        weight_kg=reading_in.weight_kg,
        notes=reading_in.notes,
        source_provenance=reading_in.source_provenance or "patient_entered",
        verification_status="confirmed_by_user"
    )
    db.add(reading)
    db.flush()

    # Create timeline event
    title_str = f"Daily Reading: {reading_in.reading_type.replace('_', ' ').title()}"
    desc_str = ""
    if reading_in.reading_type == "blood_pressure":
        desc_str = f"BP: {reading_in.systolic}/{reading_in.diastolic} mmHg at {reading.measurement_time}"
    elif reading_in.reading_type == "blood_glucose":
        desc_str = f"Glucose: {reading_in.glucose_value} mg/dL ({reading_in.glucose_context}) at {reading.measurement_time}"
    elif reading_in.pulse:
        desc_str = f"Pulse: {reading_in.pulse} bpm"
    elif reading_in.weight_kg:
        desc_str = f"Weight: {reading_in.weight_kg} kg"

    TimelineService.record_event(
        db=db,
        patient_id=target_patient_id,
        event_date=reading_in.reading_date,
        event_category="daily_reading",
        title=title_str,
        description=desc_str,
        source_type="daily_health_reading",
        source_id=reading.id,
        verification_status="confirmed_by_user"
    )

    db.commit()
    db.refresh(reading)
    return reading

@router.get("/", response_model=List[ReadingOut])
def list_daily_readings(
    patient_id: Optional[int] = None,
    reading_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_readings", resource_type="reading")

    query = db.query(DailyHealthReading).filter(DailyHealthReading.patient_id == target_patient_id)
    if reading_type:
        query = query.filter(DailyHealthReading.reading_type == reading_type)
    if start_date:
        query = query.filter(DailyHealthReading.reading_date >= start_date)
    if end_date:
        query = query.filter(DailyHealthReading.reading_date <= end_date)

    return query.order_by(DailyHealthReading.reading_date.desc(), DailyHealthReading.id.desc()).all()
