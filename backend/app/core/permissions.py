from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.family_access import CaregiverPermission
from app.models.audit_log import AuditLog
import datetime

def log_audit_event(
    db: Session,
    user_id: int,
    patient_id: int,
    action: str,
    resource_type: str,
    resource_id: str = None,
    outcome: str = "success",
    details: dict = None,
    ip_address: str = "127.0.0.1"
):
    """Securely logs every resource access and permission enforcement event."""
    audit_entry = AuditLog(
        user_id=user_id,
        patient_id=patient_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        outcome=outcome,
        ip_address=ip_address,
        details=details or {},
        timestamp=datetime.datetime.utcnow()
    )
    db.add(audit_entry)
    db.commit()

def verify_patient_access(
    db: Session,
    requester: User,
    target_patient_id: int,
    required_permission: str = None, # 'can_view_reports', 'can_view_readings', 'can_view_medicines', 'can_view_summaries', 'can_edit'
    resource_type: str = "general",
    resource_id: str = None
) -> bool:
    """
    Enforces deny-by-default access control:
    1. Patient accessing their own record is always allowed.
    2. Admin is allowed.
    3. Caregivers must have an active, non-revoked CaregiverPermission grant with the specific required_permission set to True.
    4. Otherwise, access is denied and audited.
    """
    if requester.id == target_patient_id:
        log_audit_event(db, requester.id, target_patient_id, f"VIEW_{resource_type.upper()}", resource_type, resource_id, "success")
        return True

    if requester.role == "admin":
        log_audit_event(db, requester.id, target_patient_id, f"ADMIN_VIEW_{resource_type.upper()}", resource_type, resource_id, "success")
        return True

    # Check CaregiverPermission
    perm = db.query(CaregiverPermission).filter(
        CaregiverPermission.patient_id == target_patient_id,
        CaregiverPermission.caregiver_id == requester.id,
        CaregiverPermission.is_active == True
    ).first()

    if not perm:
        log_audit_event(db, requester.id, target_patient_id, f"UNAUTHORIZED_ACCESS_ATTEMPT", resource_type, resource_id, "denied", {"reason": "No active caregiver grant"})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to view or access this patient's medical records."
        )

    if required_permission:
        has_perm = getattr(perm, required_permission, False)
        if not has_perm:
            log_audit_event(db, requester.id, target_patient_id, f"PERMISSION_REVOKED_OR_DENIED", resource_type, resource_id, "denied", {"required": required_permission})
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Caregiver grant does not include '{required_permission}' permission for this patient."
            )

    log_audit_event(db, requester.id, target_patient_id, f"CAREGIVER_VIEW_{resource_type.upper()}", resource_type, resource_id, "success", {"granted_permission": required_permission})
    return True
