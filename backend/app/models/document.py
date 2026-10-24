import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    category = Column(String(100), default="laboratory", nullable=False)  # laboratory, prescription, radiology, discharge_summary, packaging, other
    document_date = Column(String(50), nullable=True)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    status = Column(String(50), default="uploaded", nullable=False)  # uploaded, processing, extracted, failed
    ocr_raw_text = Column(Text, nullable=True)
    verification_status = Column(String(50), default="unverified", nullable=False)  # unverified, confirmed_by_user, clinician_recorded
    metadata_info = Column(JSON, default=dict, nullable=True)

    patient = relationship("User", back_populates="documents")
    observations = relationship("MedicalObservation", back_populates="document", cascade="all, delete-orphan")

class MedicalObservation(Base):
    __tablename__ = "medical_observations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("medical_documents.id", ondelete="SET NULL"), nullable=True, index=True)
    observation_name = Column(String(255), nullable=False, index=True)
    normalized_name = Column(String(255), nullable=False, index=True)
    test_category = Column(String(100), default="General", nullable=False)
    numeric_value = Column(Float, nullable=True)
    string_value = Column(String(255), nullable=True)
    unit = Column(String(50), nullable=True)
    reference_range_low = Column(Float, nullable=True)
    reference_range_high = Column(Float, nullable=True)
    reference_range_text = Column(String(255), nullable=True)
    interpretation = Column(String(50), default="normal", nullable=False)  # normal, low, high, critical, uncertain
    observation_date = Column(String(50), nullable=False, index=True)
    method = Column(String(255), nullable=True)
    source_provenance = Column(String(100), default="extracted_unverified", nullable=False)  # patient_entered, imported, extracted_unverified, confirmed_by_user, clinician_recorded, ai_generated
    verification_status = Column(String(50), default="unverified", nullable=False)  # unverified, confirmed_by_user, clinician_recorded
    confidence_score = Column(Float, default=1.0, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    patient = relationship("User", back_populates="observations")
    document = relationship("MedicalDocument", back_populates="observations")
