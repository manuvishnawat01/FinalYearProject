import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class HealthEvent(Base):
    __tablename__ = "health_events"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_date = Column(String(50), nullable=False, index=True)  # YYYY-MM-DD or ISO timestamp
    event_category = Column(String(100), nullable=False, index=True)  # report, lab_observation, daily_reading, medication_change, supplement_record, symptom, doctor_visit, interaction_alert, cost_expense
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    source_type = Column(String(100), nullable=False)  # medical_document, medical_observation, daily_health_reading, medication, supplement, symptom, doctor_visit, expense
    source_id = Column(Integer, nullable=True)
    verification_status = Column(String(100), default="unverified", nullable=False)  # patient_entered, imported, extracted_unverified, confirmed_by_user, clinician_recorded, ai_generated
    metadata_payload = Column(JSON, default=dict, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    patient = relationship("User", back_populates="health_events")
