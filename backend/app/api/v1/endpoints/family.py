from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.intelligence_modules import (
    FamilyInviteCreate,
    FamilyInviteOut,
    CaregiverPermissionOut,
    CaregiverPermissionUpdate
)
from app.core.security import get_current_user
from app.core.permissions import verify_patient_access
from app.services.family_permission_service import FamilyPermissionService

router = APIRouter()

@router.post("/invite", response_model=FamilyInviteOut, status_code=status.HTTP_201_CREATED)
def invite_caregiver(
    req: FamilyInviteCreate,
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    if current_user.id != target_patient_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the patient or an administrator may issue caregiver invitations.")

    return FamilyPermissionService.create_invitation(db=db, patient_id=target_patient_id, req=req)

@router.post("/accept-invite", response_model=CaregiverPermissionOut)
def accept_caregiver_invitation(
    payload: Dict[str, str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing invitation token.")

    try:
        perm = FamilyPermissionService.accept_invitation(db=db, caregiver_user=current_user, token=token.strip())
        pt = db.query(User).filter(User.id == perm.patient_id).first()
        return CaregiverPermissionOut(
            id=perm.id,
            patient_id=perm.patient_id,
            patient_name=pt.full_name if pt else "Patient",
            caregiver_id=perm.caregiver_id,
            caregiver_name=current_user.full_name,
            caregiver_email=current_user.email,
            can_view_reports=perm.can_view_reports,
            can_view_readings=perm.can_view_readings,
            can_view_medicines=perm.can_view_medicines,
            can_view_summaries=perm.can_view_summaries,
            can_view_appointments=perm.can_view_appointments,
            can_edit=perm.can_edit,
            is_active=perm.is_active,
            granted_at=perm.granted_at,
            revoked_at=perm.revoked_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/caregivers", response_model=List[CaregiverPermissionOut])
def list_patient_caregivers(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    if current_user.id != target_patient_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")

    return FamilyPermissionService.list_caregivers_for_patient(db=db, patient_id=target_patient_id)

@router.get("/shared-patients", response_model=List[CaregiverPermissionOut])
def list_shared_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return FamilyPermissionService.list_patients_for_caregiver(db=db, caregiver_id=current_user.id)

@router.put("/permissions", response_model=CaregiverPermissionOut)
def update_caregiver_permissions(
    update_data: CaregiverPermissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        perm = FamilyPermissionService.update_permissions(db=db, patient_id=current_user.id, update_data=update_data)
        cg = db.query(User).filter(User.id == perm.caregiver_id).first()
        return CaregiverPermissionOut(
            id=perm.id,
            patient_id=perm.patient_id,
            patient_name=current_user.full_name,
            caregiver_id=perm.caregiver_id,
            caregiver_name=cg.full_name if cg else "Caregiver",
            caregiver_email=cg.email if cg else "Unknown",
            can_view_reports=perm.can_view_reports,
            can_view_readings=perm.can_view_readings,
            can_view_medicines=perm.can_view_medicines,
            can_view_summaries=perm.can_view_summaries,
            can_view_appointments=perm.can_view_appointments,
            can_edit=perm.can_edit,
            is_active=perm.is_active,
            granted_at=perm.granted_at,
            revoked_at=perm.revoked_at
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/revoke/{permission_id}")
def revoke_caregiver_access(
    permission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        FamilyPermissionService.revoke_permission(db=db, patient_id=current_user.id, permission_id=permission_id)
        return {"message": "Caregiver permission revoked immediately. Subsequent access requests will be blocked."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/audit-trail", response_model=List[Dict[str, Any]])
def get_family_audit_trail(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_patient_id = patient_id if patient_id else current_user.id
    if current_user.id != target_patient_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")

    logs = db.query(AuditLog).filter(
        AuditLog.patient_id == target_patient_id
    ).order_by(AuditLog.timestamp.desc()).limit(50).all()

    return [
        {
            "id": l.id,
            "action": l.action,
            "resource_type": l.resource_type,
            "outcome": l.outcome,
            "details": l.details,
            "timestamp": l.timestamp
        } for l in logs
    ]
