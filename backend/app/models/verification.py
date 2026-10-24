import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from app.database import Base

class PrescriptionVerification(Base):
    __tablename__ = "prescription_verifications"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prescription_doc_id = Column(Integer, ForeignKey("medical_documents.id", ondelete="SET NULL"), nullable=True)
    package_doc_id = Column(Integer, ForeignKey("medical_documents.id", ondelete="SET NULL"), nullable=True)
    
    # Raw extracted candidates
    rx_extracted_data = Column(JSON, nullable=False)  # { medicine_name, ingredient, strength, form, dosage, prescriber, date }
    pkg_extracted_data = Column(JSON, nullable=False) # { product_name, ingredient, strength, form, manufacturer, batch, expiry }
    
    # Verified fields
    verified_data = Column(JSON, nullable=True)
    
    # Comparison and discrepancies
    field_comparisons = Column(JSON, nullable=False)  # [ { field, rx_val, pkg_val, status: match|potential_discrepancy|missing_on_one_side|uncertain, notes } ]
    overall_status = Column(String(50), default="discrepancy_detected", nullable=False)  # match, potential_discrepancy, uncertain, reviewed
    disclaimer = Column(String(500), default="This tool detects discrepancy between prescription and label text. It does NOT verify physical drug authenticity, chemical composition, or safety.", nullable=False)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
