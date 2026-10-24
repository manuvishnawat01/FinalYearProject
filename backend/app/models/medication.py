import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_name = Column(String(255), nullable=False, index=True)
    generic_name = Column(String(255), nullable=True)
    dosage_form = Column(String(100), nullable=True)  # tablet, capsule, syrup, injection, inhaler, etc.
    route = Column(String(100), default="oral", nullable=True)
    prescribed_dosage = Column(String(255), nullable=True)  # e.g., "1 tablet"
    frequency = Column(String(100), nullable=True)  # e.g., "Twice daily"
    timing_instructions = Column(String(255), nullable=True)  # e.g., "After meals"
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=True)
    status = Column(String(50), default="active", nullable=False)  # active, stopped, changed, completed
    prescriber_name = Column(String(255), nullable=True)
    prescriber_contact = Column(String(255), nullable=True)
    reason_for_use = Column(String(255), nullable=True)
    source = Column(String(100), default="prescription", nullable=False)  # prescription, manual_entry, discharge_summary
    verification_status = Column(String(50), default="unverified", nullable=False)  # unverified, confirmed_by_user, clinician_recorded
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    patient = relationship("User", back_populates="medications")
    ingredients = relationship("MedicationIngredient", back_populates="medication", cascade="all, delete-orphan")
    history_events = relationship("MedicineHistoryEvent", back_populates="medication", cascade="all, delete-orphan")

class MedicationIngredient(Base):
    __tablename__ = "medication_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient_name = Column(String(255), nullable=False, index=True)
    normalized_ingredient_name = Column(String(255), nullable=False, index=True)
    strength = Column(Float, nullable=True)
    strength_unit = Column(String(50), nullable=True)  # mg, mcg, g, ml, IU

    medication = relationship("Medication", back_populates="ingredients")

class MedicineHistoryEvent(Base):
    __tablename__ = "medicine_history_events"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)  # added, stopped, changed, corrected
    event_date = Column(String(50), nullable=False)
    previous_data = Column(JSON, nullable=True)
    new_data = Column(JSON, nullable=True)
    recorded_reason = Column(Text, nullable=True)
    source = Column(String(100), default="manual_entry", nullable=False)
    prescriber_info = Column(String(255), nullable=True)
    verification_status = Column(String(50), default="confirmed_by_user", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    medication = relationship("Medication", back_populates="history_events")
