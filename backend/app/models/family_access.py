import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class FamilyInvitation(Base):
    __tablename__ = "family_invitations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    invitee_email = Column(String(255), nullable=False, index=True)
    invitee_name = Column(String(255), nullable=False)
    relationship = Column(String(100), default="Caregiver", nullable=False)
    invitation_token = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(String(50), default="pending", nullable=False)  # pending, accepted, expired, revoked
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class CaregiverPermission(Base):
    __tablename__ = "caregiver_permissions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    caregiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Granular Deny-by-Default permissions
    can_view_reports = Column(Boolean, default=False, nullable=False)
    can_view_readings = Column(Boolean, default=False, nullable=False)
    can_view_medicines = Column(Boolean, default=False, nullable=False)
    can_view_summaries = Column(Boolean, default=False, nullable=False)
    can_view_appointments = Column(Boolean, default=False, nullable=False)
    can_edit = Column(Boolean, default=False, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    granted_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
