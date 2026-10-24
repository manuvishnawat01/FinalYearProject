import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="patient", nullable=False)  # patient, caregiver, clinician, admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    documents = relationship("MedicalDocument", back_populates="patient", cascade="all, delete-orphan")
    observations = relationship("MedicalObservation", back_populates="patient", cascade="all, delete-orphan")
    health_readings = relationship("DailyHealthReading", back_populates="patient", cascade="all, delete-orphan")
    health_events = relationship("HealthEvent", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")
    supplements = relationship("Supplement", back_populates="patient", cascade="all, delete-orphan")
    symptoms = relationship("Symptom", back_populates="patient", cascade="all, delete-orphan")
    expenses = relationship("MedicalExpense", back_populates="patient", cascade="all, delete-orphan")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    blood_group = Column(String(20), nullable=True)
    emergency_contact = Column(String(255), nullable=True)
    allergies = Column(JSON, default=list, nullable=True)  # List of allergies
    chronic_conditions = Column(JSON, default=list, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")
