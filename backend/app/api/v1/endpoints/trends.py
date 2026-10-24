from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.intelligence_modules import TrendSeriesRequest, TrendSeriesResult
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.trend_analyzer import TrendAnalyzerService

router = APIRouter()

@router.post("/series", response_model=TrendSeriesResult)
def get_metric_trend_series(
    req: TrendSeriesRequest,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_readings", resource_type="trends")

    return TrendAnalyzerService.get_trend_series(
        db=db,
        patient_id=target_patient_id,
        metric_name=req.metric_name,
        glucose_context=req.glucose_context,
        start_date=req.start_date,
        end_date=req.end_date
    )
