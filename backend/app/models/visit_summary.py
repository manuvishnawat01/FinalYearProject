import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from app.database import Base

class DoctorVisitSummary(Base):
    __tablename__ = "doctor_visit_summaries"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    appointment_date = Column(String(50), nullable=True)
    date_range_start = Column(String(50), nullable=False)
    date_range_end = Column(String(50), nullable=False)
    clinician_name = Column(String(255), nullable=True)
    specialty = Column(String(100), nullable=True)
    selected_sections = Column(JSON, nullable=False)  # list of enabled sections
    custom_questions = Column(JSON, default=list, nullable=True)  # questions prepared by patient
    summary_content = Column(JSON, nullable=False)  # full structured clinical digest
    pdf_filename = Column(String(255), nullable=True)
    pdf_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
