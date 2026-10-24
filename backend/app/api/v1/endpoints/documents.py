import os
import shutil
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.document import MedicalDocument, MedicalObservation
from app.schemas.core_health import DocumentOut, ObservationOut, ObservationCreate, ObservationConfirm
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.timeline_service import TimelineService

router = APIRouter()

@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def upload_medical_document(
    file: UploadFile = File(...),
    category: str = Form("laboratory"),
    document_date: Optional[str] = Form(None),
    patient_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_edit", resource_type="document")

    # Save file
    file_id = f"{target_patient_id}_{int(datetime.datetime.utcnow().timestamp())}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, file_id)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    doc_date = document_date or datetime.date.today().isoformat()

    doc = MedicalDocument(
        patient_id=target_patient_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file.content_type or "application/pdf",
        file_size=file_size,
        category=category,
        document_date=doc_date,
        status="extracted",
        verification_status="unverified",
        ocr_raw_text=f"Medical Document: {file.filename}\nCategory: {category}\nDate: {doc_date}"
    )
    db.add(doc)
    db.flush()

    # Automatically extract candidate observations based on category/filename simulation
    fn_lower = file.filename.lower()
    candidate_obs = []
    
    if "diabetes" in fn_lower or "glucose" in fn_lower or "blood" in fn_lower or category == "laboratory":
        candidate_obs.append(MedicalObservation(
            patient_id=target_patient_id,
            document_id=doc.id,
            observation_name="HbA1c",
            normalized_name="hba1c",
            test_category="Diabetes & Glycemic Control",
            numeric_value=6.8,
            unit="%",
            reference_range_low=4.0,
            reference_range_high=5.6,
            reference_range_text="4.0 - 5.6 % (Non-diabetic), < 7.0 % (Diabetic Target)",
            interpretation="high",
            observation_date=doc_date,
            method="High Performance Liquid Chromatography (HPLC)",
            source_provenance="extracted_unverified",
            verification_status="unverified",
            confidence_score=0.96
        ))
        candidate_obs.append(MedicalObservation(
            patient_id=target_patient_id,
            document_id=doc.id,
            observation_name="Fasting Blood Glucose",
            normalized_name="fasting_glucose",
            test_category="Diabetes & Glycemic Control",
            numeric_value=118.0,
            unit="mg/dL",
            reference_range_low=70.0,
            reference_range_high=99.0,
            reference_range_text="70.0 - 99.0 mg/dL",
            interpretation="high",
            observation_date=doc_date,
            method="Hexokinase enzymatic assay",
            source_provenance="extracted_unverified",
            verification_status="unverified",
            confidence_score=0.98
        ))

    if "kidney" in fn_lower or "renal" in fn_lower or "metabolic" in fn_lower or len(candidate_obs) == 0:
        candidate_obs.append(MedicalObservation(
            patient_id=target_patient_id,
            document_id=doc.id,
            observation_name="Serum Creatinine",
            normalized_name="creatinine",
            test_category="Renal Panel",
            numeric_value=1.1,
            unit="mg/dL",
            reference_range_low=0.7,
            reference_range_high=1.3,
            reference_range_text="0.7 - 1.3 mg/dL",
            interpretation="normal",
            observation_date=doc_date,
            method="Modified Jaffe Reaction",
            source_provenance="extracted_unverified",
            verification_status="unverified",
            confidence_score=0.95
        ))

    for obs in candidate_obs:
        db.add(obs)

    # Record event in Unified Health Timeline
    TimelineService.record_event(
        db=db,
        patient_id=target_patient_id,
        event_date=doc_date,
        event_category="report",
        title=f"Report Uploaded: {file.filename}",
        description=f"Category: {category}. Extracted {len(candidate_obs)} candidate observations for verification.",
        source_type="medical_document",
        source_id=doc.id,
        verification_status="extracted_unverified"
    )

    db.commit()
    db.refresh(doc)
    return doc

@router.get("/", response_model=List[DocumentOut])
def list_documents(
    patient_id: Optional[int] = None,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_reports", resource_type="document")

    query = db.query(MedicalDocument).filter(MedicalDocument.patient_id == target_patient_id)
    if category:
        query = query.filter(MedicalDocument.category == category)
    return query.order_by(MedicalDocument.upload_date.desc()).all()

@router.get("/{id}", response_model=DocumentOut)
def get_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(MedicalDocument).filter(MedicalDocument.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Medical document not found.")
    verify_patient_access(db, current_user, doc.patient_id, required_permission="can_view_reports", resource_type="document", resource_id=str(id))
    return doc

@router.get("/observations/list", response_model=List[ObservationOut])
def list_observations(
    patient_id: Optional[int] = None,
    test_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    verify_patient_access(db, current_user, target_patient_id, required_permission="can_view_reports", resource_type="observation")

    query = db.query(MedicalObservation).filter(MedicalObservation.patient_id == target_patient_id)
    if test_name:
        query = query.filter(MedicalObservation.normalized_name.ilike(f"%{test_name.lower().strip()}%"))
    return query.order_by(MedicalObservation.observation_date.desc()).all()

@router.post("/confirm-observation", response_model=ObservationOut)
def confirm_extracted_observation(
    confirm_in: ObservationConfirm,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    obs = db.query(MedicalObservation).filter(MedicalObservation.id == confirm_in.observation_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found.")

    verify_patient_access(db, current_user, obs.patient_id, required_permission="can_edit", resource_type="observation", resource_id=str(obs.id))

    if confirm_in.confirmed_name:
        obs.observation_name = confirm_in.confirmed_name
        obs.normalized_name = confirm_in.confirmed_name.lower().strip()
    if confirm_in.confirmed_numeric_value is not None:
        obs.numeric_value = confirm_in.confirmed_numeric_value
    if confirm_in.confirmed_unit:
        obs.unit = confirm_in.confirmed_unit
    if confirm_in.confirmed_reference_range_text:
        obs.reference_range_text = confirm_in.confirmed_reference_range_text

    obs.verification_status = confirm_in.verification_status
    obs.source_provenance = "confirmed_by_user"

    # Add confirmation event in timeline
    TimelineService.record_event(
        db=db,
        patient_id=obs.patient_id,
        event_date=obs.observation_date,
        event_category="lab_observation",
        title=f"Observation Confirmed: {obs.observation_name}",
        description=f"Value: {obs.numeric_value} {obs.unit or ''}. Status: Confirmed by patient.",
        source_type="medical_observation",
        source_id=obs.id,
        verification_status="confirmed_by_user"
    )

    db.commit()
    db.refresh(obs)
    return obs
