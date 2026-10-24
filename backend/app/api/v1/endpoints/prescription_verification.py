from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.verification import PrescriptionVerification
from app.schemas.intelligence_modules import PrescriptionVerifyRequest, PrescriptionVerifyResult
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.prescription_verifier import PrescriptionVerifierService

router = APIRouter()

@router.post("/analyze", response_model=PrescriptionVerifyResult)
def verify_prescription_and_packaging(
    req: PrescriptionVerifyRequest,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_edit", resource_type="prescription_verification")

    try:
        return PrescriptionVerifierService.verify_documents(
            db=db,
            patient_id=target_patient_id,
            prescription_doc_id=req.prescription_doc_id,
            package_doc_id=req.package_doc_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/history", response_model=List[Dict[str, Any]])
def list_verifications(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_reports", resource_type="prescription_verification_history")

    records = db.query(PrescriptionVerification).filter(
        PrescriptionVerification.patient_id == target_patient_id
    ).order_by(PrescriptionVerification.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "overall_status": r.overall_status,
            "field_comparisons": r.field_comparisons,
            "disclaimer": r.disclaimer,
            "created_at": r.created_at
        } for r in records
    ]
