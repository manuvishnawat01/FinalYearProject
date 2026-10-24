import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class MedicalExpense(Base):
    __tablename__ = "medical_expenses"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    expense_date = Column(String(50), nullable=False, index=True)  # YYYY-MM-DD
    provider_facility = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)  # laboratory, consultation, medication, radiology, procedure, other
    service_or_test_name = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    receipt_filename = Column(String(255), nullable=True)
    receipt_path = Column(String(500), nullable=True)
    related_report_id = Column(Integer, ForeignKey("medical_documents.id", ondelete="SET NULL"), nullable=True)
    payment_status = Column(String(50), default="paid", nullable=False)  # paid, pending, reimbursed
    verification_status = Column(String(50), default="patient_entered", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    patient = relationship("User", back_populates="expenses")

class DuplicateTestFlag(Base):
    __tablename__ = "duplicate_test_flags"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    current_test_name = Column(String(255), nullable=False)
    previous_test_name = Column(String(255), nullable=False)
    current_test_date = Column(String(50), nullable=False)
    previous_test_date = Column(String(50), nullable=False)
    days_between = Column(Integer, nullable=False)
    review_window_days = Column(Integer, default=90, nullable=False)
    flag_reason = Column(Text, nullable=False)
    match_type = Column(String(50), default="similar_investigation", nullable=False)  # exact_duplicate, repeated_investigation, similar_category
    status = Column(String(50), default="pending_review", nullable=False)  # pending_review, reviewed_appropriate, confirmed_duplicate, dismissed
    clinical_disclaimer = Column(String(500), default="Repeated tests may be clinically necessary to monitor disease progress or treatment response. Consult your physician before cancelling any scheduled test.", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
