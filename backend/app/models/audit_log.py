import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # VIEW_RECORD, DOWNLOAD_REPORT, REVOKE_PERMISSION, EXPORT_SUMMARY, CREATE_MEDICINE, etc.
    resource_type = Column(String(100), nullable=False)       # document, reading, medication, family_permission, expense
    resource_id = Column(String(100), nullable=True)
    outcome = Column(String(50), default="success", nullable=False)  # success, denied, error
    ip_address = Column(String(100), nullable=True)
    details = Column(JSON, default=dict, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
