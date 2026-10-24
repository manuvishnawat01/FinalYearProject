from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.core_health import HealthEventOut
from app.schemas.intelligence_modules import (
    TimelineSearchRequest,
    ObservationCompareRequest,
    ObservationCompareResult
)
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.timeline_service import TimelineService, SearchService

router = APIRouter()

@router.get("/", response_model=List[HealthEventOut])
def get_timeline(
    patient_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    event_category: Optional[str] = None,
    source_type: Optional[str] = None,
    verification_status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_reports", resource_type="timeline")

    events = TimelineService.get_unified_timeline(
        db=db,
        patient_id=target_patient_id,
        start_date=start_date,
        end_date=end_date,
        event_category=event_category,
        source_type=source_type,
        verification_status=verification_status
    )
    return events

@router.post("/search", response_model=Dict[str, Any])
def search_patient_history(
    search_req: TimelineSearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = search_req.target_patient_id if search_req.target_patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_reports", resource_type="search")

    return SearchService.safe_search_patient_history(
        db=db,
        patient_id=target_patient_id,
        query_text=search_req.query
    )

@router.post("/compare", response_model=ObservationCompareResult)
def compare_observations(
    req: ObservationCompareRequest,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_reports", resource_type="compare_observations")

    return TimelineService.compare_observations(
        db=db,
        patient_id=target_patient_id,
        observation_ids=req.observation_ids
    )
