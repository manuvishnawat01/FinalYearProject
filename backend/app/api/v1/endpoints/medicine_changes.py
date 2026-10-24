from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.medication import MedicineHistoryEvent
from app.schemas.intelligence_modules import (
    MedicineChangeCreate,
    MedicineChangeComparisonRequest,
    MedicineChangeReportOut
)
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.medicine_change_tracker import MedicineChangeTrackerService
from app.services.timeline_service import TimelineService

router = APIRouter()

@router.post("/record-change", status_code=status.HTTP_201_CREATED)
def record_medicine_change(
    req: MedicineChangeCreate,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_edit", resource_type="medication_change")

    try:
        hist_event = MedicineChangeTrackerService.record_change(
            db=db,
            patient_id=target_patient_id,
            medication_id=req.medication_id,
            event_type=req.event_type,
            event_date=req.event_date,
            new_instructions=req.new_instructions,
            new_dosage=req.new_dosage,
            recorded_reason=req.recorded_reason
        )

        # Timeline event
        TimelineService.record_event(
            db=db,
            patient_id=target_patient_id,
            event_date=req.event_date,
            event_category="medication_change",
            title=f"Medication {req.event_type.capitalize()}: {hist_event.medication.brand_name}",
            description=f"Action: {req.event_type}. Reason: {req.recorded_reason or 'Clinical update'}.",
            source_type="medicine_history_event",
            source_id=hist_event.id,
            verification_status="confirmed_by_user"
        )

        return {"message": "Medication change recorded successfully and previous history archived.", "event_id": hist_event.id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/history", response_model=List[Dict[str, Any]])
def list_medicine_history(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_medicines", resource_type="medication_history")

    events = db.query(MedicineHistoryEvent).filter(
        MedicineHistoryEvent.patient_id == target_patient_id
    ).order_by(MedicineHistoryEvent.event_date.desc()).all()

    return [
        {
            "id": e.id,
            "medication_id": e.medication_id,
            "medication_name": e.medication.brand_name if e.medication else "Medication",
            "event_type": e.event_type,
            "event_date": e.event_date,
            "previous_data": e.previous_data,
            "new_data": e.new_data,
            "recorded_reason": e.recorded_reason,
            "verification_status": e.verification_status
        } for e in events
    ]

@router.post("/compare-impact", response_model=MedicineChangeReportOut)
def compare_medicine_impact(
    req: MedicineChangeComparisonRequest,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_medicines", resource_type="medication_impact")

    try:
        report = MedicineChangeTrackerService.generate_impact_comparison(
            db=db,
            patient_id=target_patient_id,
            medication_id=req.medication_id,
            change_date=req.change_date,
            window_days=req.window_days
        )
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
