import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Symptom(Base):
    __tablename__ = "symptoms"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symptom_name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    onset_date = Column(String(50), nullable=False, index=True)  # YYYY-MM-DD
    onset_time = Column(String(50), nullable=True)  # HH:MM
    end_date = Column(String(50), nullable=True)
    end_time = Column(String(50), nullable=True)
    is_ongoing = Column(Boolean, default=False, nullable=False)
    severity = Column(Integer, nullable=False)  # 1-10 scale (Mild 1-3, Moderate 4-6, Severe 7-8, Critical 9-10)
    duration_hours = Column(Float, nullable=True)
    frequency = Column(String(100), nullable=True)  # constant, intermittent, once
    associated_measurement_type = Column(String(100), nullable=True)  # e.g., BP, glucose
    associated_measurement_value = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    source_provenance = Column(String(100), default="patient_entered", nullable=False)
    verification_status = Column(String(50), default="confirmed_by_user", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    patient = relationship("User", back_populates="symptoms")

class AdverseEffectReference(Base):
    __tablename__ = "adverse_effect_references"

    id = Column(Integer, primary_key=True, index=True)
    medication_name = Column(String(255), nullable=False, index=True)
    ingredient_name = Column(String(255), nullable=False, index=True)
    adverse_effect = Column(String(255), nullable=False, index=True)
    severity_category = Column(String(50), default="moderate", nullable=False)  # common, serious, rare_critical
    frequency_rate = Column(String(50), nullable=True)  # e.g., ">10%", "1-10%", "<1%"
    evidence_level = Column(String(50), default="high", nullable=False)  # high, moderate, preliminary
    source_name = Column(String(255), nullable=False)
    source_url = Column(String(500), nullable=True)
    jurisdiction = Column(String(50), default="FDA/EMA", nullable=False)
