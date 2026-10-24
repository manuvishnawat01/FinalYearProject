import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.visit_summary import DoctorVisitSummary
from app.schemas.intelligence_modules import DoctorVisitGenerateRequest, DoctorVisitSummaryOut
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.doctor_visit_generator import DoctorVisitGeneratorService

router = APIRouter()

@router.post("/generate", response_model=DoctorVisitSummaryOut, status_code=status.HTTP_201_CREATED)
def generate_doctor_visit_prep(
    req: DoctorVisitGenerateRequest,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_summaries", resource_type="doctor_visit_summary")

    return DoctorVisitGeneratorService.generate_summary(
        db=db,
        patient_id=target_patient_id,
        req=req
    )

@router.get("/download-pdf/{id}")
def download_visit_pdf(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    summary = db.query(DoctorVisitSummary).filter(DoctorVisitSummary.id == id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Doctor visit summary not found.")

    verify_patient_access(db, current_user, summary.patient_id, required_permission="can_view_summaries", resource_type="doctor_visit_pdf", resource_id=str(id))

    if not summary.pdf_path or not os.path.exists(summary.pdf_path):
        raise HTTPException(status_code=404, detail="PDF export file not found on server.")

    return FileResponse(
        path=summary.pdf_path,
        filename=summary.pdf_filename or "Doctor_Visit_Summary.pdf",
        media_type="application/pdf"
    )

@router.get("/list", response_model=List[Dict[str, Any]])
def list_doctor_visit_summaries(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_summaries", resource_type="doctor_visit_summary")

    summaries = db.query(DoctorVisitSummary).filter(
        DoctorVisitSummary.patient_id == target_patient_id
    ).order_by(DoctorVisitSummary.created_at.desc()).all()

    return [
        {
            "id": s.id,
            "appointment_date": s.appointment_date,
            "date_range": f"{s.date_range_start} to {s.date_range_end}",
            "clinician_name": s.clinician_name,
            "pdf_filename": s.pdf_filename,
            "created_at": s.created_at
        } for s in summaries
    ]
