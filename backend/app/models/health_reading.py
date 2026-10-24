import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class DailyHealthReading(Base):
    __tablename__ = "daily_health_readings"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reading_type = Column(String(50), nullable=False, index=True)  # blood_pressure, blood_glucose, pulse, weight, temperature
    reading_date = Column(String(50), nullable=False, index=True)  # YYYY-MM-DD
    measurement_time = Column(String(50), nullable=True)  # HH:MM
    
    # Blood Pressure specific (paired)
    systolic = Column(Float, nullable=True)
    diastolic = Column(Float, nullable=True)
    
    # Blood Glucose specific (with mandatory clinical context)
    glucose_value = Column(Float, nullable=True)
    glucose_context = Column(String(50), nullable=True)  # fasting, pre_meal, post_meal, random, bedtime
    
    # Pulse & Weight
    pulse = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    
    notes = Column(Text, nullable=True)
    source_provenance = Column(String(100), default="patient_entered", nullable=False)  # patient_entered, imported, device_provided, clinician_recorded
    verification_status = Column(String(50), default="confirmed_by_user", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    patient = relationship("User", back_populates="health_readings")
