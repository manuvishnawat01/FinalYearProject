import uuid
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.family_access import FamilyInvitation, CaregiverPermission
from app.schemas.intelligence_modules import FamilyInviteCreate, FamilyInviteOut, CaregiverPermissionOut, CaregiverPermissionUpdate
from app.core.permissions import log_audit_event

class FamilyPermissionService:
    @staticmethod
    def create_invitation(db: Session, patient_id: int, req: FamilyInviteCreate) -> FamilyInvitation:
        token = str(uuid.uuid4())
        expires = datetime.datetime.utcnow() + datetime.timedelta(days=7)

        inv = FamilyInvitation(
            patient_id=patient_id,
            invitee_email=req.invitee_email.lower().strip(),
            invitee_name=req.invitee_name.strip(),
            relationship=req.relationship,
            invitation_token=token,
            status="pending",
            expires_at=expires,
            created_at=datetime.datetime.utcnow()
        )
        db.add(inv)
        db.commit()
        db.refresh(inv)

        log_audit_event(db, patient_id, patient_id, "CREATE_CAREGIVER_INVITATION", "family_invitation", str(inv.id), "success", {"invitee_email": req.invitee_email})
        return inv

    @staticmethod
    def accept_invitation(db: Session, caregiver_user: User, token: str, initial_permissions: Optional[Dict[str, bool]] = None) -> CaregiverPermission:
        inv = db.query(FamilyInvitation).filter(
            FamilyInvitation.invitation_token == token,
            FamilyInvitation.status == "pending"
        ).first()

        if not inv:
            raise ValueError("Invitation token is invalid or has already been used.")

        if inv.expires_at < datetime.datetime.utcnow():
            inv.status = "expired"
            db.commit()
            raise ValueError("Invitation token has expired. Please request a new invitation.")

        inv.status = "accepted"

        # Check existing permission record
        existing = db.query(CaregiverPermission).filter(
            CaregiverPermission.patient_id == inv.patient_id,
            CaregiverPermission.caregiver_id == caregiver_user.id
        ).first()

        perms = initial_permissions or {
            "can_view_reports": False,
            "can_view_readings": True, # default minimal view
            "can_view_medicines": True,
            "can_view_summaries": False,
            "can_view_appointments": True,
            "can_edit": False
        }

        if existing:
            existing.is_active = True
            existing.can_view_reports = perms.get("can_view_reports", False)
            existing.can_view_readings = perms.get("can_view_readings", True)
            existing.can_view_medicines = perms.get("can_view_medicines", True)
            existing.can_view_summaries = perms.get("can_view_summaries", False)
            existing.can_view_appointments = perms.get("can_view_appointments", True)
            existing.can_edit = perms.get("can_edit", False)
            existing.revoked_at = None
            db.commit()
            db.refresh(existing)
            log_audit_event(db, caregiver_user.id, inv.patient_id, "ACCEPT_CAREGIVER_INVITATION", "caregiver_permission", str(existing.id), "success")
            return existing

        new_perm = CaregiverPermission(
            patient_id=inv.patient_id,
            caregiver_id=caregiver_user.id,
            can_view_reports=perms.get("can_view_reports", False),
            can_view_readings=perms.get("can_view_readings", True),
            can_view_medicines=perms.get("can_view_medicines", True),
            can_view_summaries=perms.get("can_view_summaries", False),
            can_view_appointments=perms.get("can_view_appointments", True),
            can_edit=perms.get("can_edit", False),
            is_active=True,
            granted_at=datetime.datetime.utcnow()
        )
        db.add(new_perm)
        db.commit()
        db.refresh(new_perm)

        log_audit_event(db, caregiver_user.id, inv.patient_id, "ACCEPT_CAREGIVER_INVITATION", "caregiver_permission", str(new_perm.id), "success")
        return new_perm

    @staticmethod
    def update_permissions(db: Session, patient_id: int, update_data: CaregiverPermissionUpdate) -> CaregiverPermission:
        perm = db.query(CaregiverPermission).filter(
            CaregiverPermission.id == update_data.permission_id,
            CaregiverPermission.patient_id == patient_id
        ).first()

        if not perm:
            raise ValueError("Permission record not found.")

        perm.can_view_reports = update_data.can_view_reports
        perm.can_view_readings = update_data.can_view_readings
        perm.can_view_medicines = update_data.can_view_medicines
        perm.can_view_summaries = update_data.can_view_summaries
        perm.can_view_appointments = update_data.can_view_appointments
        perm.can_edit = update_data.can_edit

        db.commit()
        db.refresh(perm)

        log_audit_event(db, patient_id, patient_id, "UPDATE_CAREGIVER_PERMISSIONS", "caregiver_permission", str(perm.id), "success", {
            "reports": perm.can_view_reports,
            "readings": perm.can_view_readings,
            "medicines": perm.can_view_medicines
        })
        return perm

    @staticmethod
    def revoke_permission(db: Session, patient_id: int, permission_id: int) -> CaregiverPermission:
        """
        Immediately revokes caregiver access. Subsequent API requests are blocked in real-time.
        """
        perm = db.query(CaregiverPermission).filter(
            CaregiverPermission.id == permission_id,
            CaregiverPermission.patient_id == patient_id
        ).first()

        if not perm:
            raise ValueError("Permission record not found.")

        perm.is_active = False
        perm.revoked_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(perm)

        log_audit_event(db, patient_id, patient_id, "REVOKE_CAREGIVER_ACCESS", "caregiver_permission", str(perm.id), "success", {
            "caregiver_id": perm.caregiver_id,
            "status": "revoked"
        })
        return perm

    @staticmethod
    def list_caregivers_for_patient(db: Session, patient_id: int) -> List[CaregiverPermissionOut]:
        perms = db.query(CaregiverPermission).filter(CaregiverPermission.patient_id == patient_id).all()
        results = []
        for p in perms:
            cg = db.query(User).filter(User.id == p.caregiver_id).first()
            pt = db.query(User).filter(User.id == p.patient_id).first()
            results.append(CaregiverPermissionOut(
                id=p.id,
                patient_id=p.patient_id,
                patient_name=pt.full_name if pt else "Patient",
                caregiver_id=p.caregiver_id,
                caregiver_name=cg.full_name if cg else "Caregiver",
                caregiver_email=cg.email if cg else "Unknown",
                can_view_reports=p.can_view_reports,
                can_view_readings=p.can_view_readings,
                can_view_medicines=p.can_view_medicines,
                can_view_summaries=p.can_view_summaries,
                can_view_appointments=p.can_view_appointments,
                can_edit=p.can_edit,
                is_active=p.is_active,
                granted_at=p.granted_at,
                revoked_at=p.revoked_at
            ))
        return results

    @staticmethod
    def list_patients_for_caregiver(db: Session, caregiver_id: int) -> List[CaregiverPermissionOut]:
        perms = db.query(CaregiverPermission).filter(
            CaregiverPermission.caregiver_id == caregiver_id,
            CaregiverPermission.is_active == True
        ).all()
        results = []
        for p in perms:
            cg = db.query(User).filter(User.id == p.caregiver_id).first()
            pt = db.query(User).filter(User.id == p.patient_id).first()
            results.append(CaregiverPermissionOut(
                id=p.id,
                patient_id=p.patient_id,
                patient_name=pt.full_name if pt else "Patient",
                caregiver_id=p.caregiver_id,
                caregiver_name=cg.full_name if cg else "Caregiver",
                caregiver_email=cg.email if cg else "Unknown",
                can_view_reports=p.can_view_reports,
                can_view_readings=p.can_view_readings,
                can_view_medicines=p.can_view_medicines,
                can_view_summaries=p.can_view_summaries,
                can_view_appointments=p.can_view_appointments,
                can_edit=p.can_edit,
                is_active=p.is_active,
                granted_at=p.granted_at,
                revoked_at=p.revoked_at
            ))
        return results
