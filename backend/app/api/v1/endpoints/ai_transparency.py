from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.ai_provenance import AIProvenanceLog, ExternalMedicalSource
from app.schemas.intelligence_modules import AIProvenanceOut
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access

router = APIRouter()

@router.get("/provenance", response_model=List[AIProvenanceOut])
def get_ai_provenance_logs(
    patient_id: Optional[int] = None,
    module_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_reports", resource_type="ai_provenance")

    query = db.query(AIProvenanceLog).filter(AIProvenanceLog.patient_id == target_patient_id)
    if module_name:
        query = query.filter(AIProvenanceLog.module_name == module_name)
    return query.order_by(AIProvenanceLog.created_at.desc()).limit(25).all()

@router.post("/validate-source", response_model=Dict[str, Any])
def validate_citation_source(
    payload: Dict[str, str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    url_or_id = payload.get("url") or payload.get("url_or_identifier")
    if not url_or_id:
        raise HTTPException(status_code=400, detail="Missing URL or source identifier.")

    source = db.query(ExternalMedicalSource).filter(
        ExternalMedicalSource.url_or_identifier == url_or_id.strip(),
        ExternalMedicalSource.is_active == True
    ).first()

    if not source:
        return {
            "is_valid": False,
            "url_or_identifier": url_or_id,
            "status": "rejected",
            "reason": "Source identifier not found in indexed, verified clinical references repository. Rejected to prevent hallucinated evidence."
        }

    return {
        "is_valid": True,
        "source_id": source.id,
        "title": source.source_title,
        "publisher": source.publisher,
        "url_or_identifier": source.url_or_identifier,
        "status": "verified",
        "retrieval_date": str(source.retrieval_timestamp.date())
    }
