from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.ai_provenance import ExternalMedicalSource
from app.schemas.intelligence_modules import TranslateReportRequest, ReportExplanationOut
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.translator_service import MedicalTranslatorService

router = APIRouter()

@router.post("/explain", response_model=ReportExplanationOut)
def translate_medical_report(
    req: TranslateReportRequest,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_reports", resource_type="report_translation", resource_id=str(req.document_id))

    try:
        explanation = MedicalTranslatorService.explain_report(
            db=db,
            patient_id=target_patient_id,
            document_id=req.document_id,
            target_language=req.target_language
        )
        return explanation
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/sources", response_model=List[Dict[str, Any]])
def list_medical_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sources = db.query(ExternalMedicalSource).filter(ExternalMedicalSource.is_active == True).all()
    return [
        {
            "id": s.id,
            "title": s.source_title,
            "publisher": s.publisher,
            "url": s.url_or_identifier,
            "evidence_summary": s.evidence_summary,
            "retrieval_date": str(s.retrieval_timestamp.date())
        } for s in sources
    ]
