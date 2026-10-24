import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON, Boolean
from app.database import Base

class ExternalMedicalSource(Base):
    __tablename__ = "external_medical_sources"

    id = Column(Integer, primary_key=True, index=True)
    source_title = Column(String(255), nullable=False)
    publisher = Column(String(255), nullable=False)  # WHO, NIH, PubMed, MayoClinic, MedlinePlus, FDA
    url_or_identifier = Column(String(500), unique=True, nullable=False, index=True)
    publication_date = Column(String(50), nullable=True)
    retrieval_timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    topic_keywords = Column(JSON, default=list, nullable=True)
    evidence_summary = Column(Text, nullable=False)
    jurisdiction = Column(String(50), default="Global/US/IN", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class AIProvenanceLog(Base):
    __tablename__ = "ai_provenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    module_name = Column(String(100), nullable=False, index=True)  # translator, health_memory, trend_warning, etc.
    request_context = Column(String(255), nullable=False)
    model_identifier = Column(String(100), default="medichronicle-deterministic-v1", nullable=False)
    prompt_version = Column(String(50), default="1.0.0", nullable=False)
    
    # Authorized records input into the synthesis
    records_considered = Column(JSON, nullable=False)  # [ { type: "observation", id: 12, name: "HbA1c" } ]
    
    # External citations
    cited_sources = Column(JSON, nullable=False)      # [ { id: 1, title: "...", url: "...", validated: true } ]
    
    # 4-Dimensional Uncertainty Decomposition (0.0 to 1.0 where 0 is complete certainty, 1 is total uncertainty)
    extraction_uncertainty = Column(Float, default=0.0, nullable=False)
    identity_uncertainty = Column(Float, default=0.0, nullable=False)
    evidence_uncertainty = Column(Float, default=0.0, nullable=False)
    interpretation_uncertainty = Column(Float, default=0.0, nullable=False)
    
    validation_status = Column(String(50), default="validated", nullable=False)  # validated, partial, citation_failed
    explanation_text = Column(Text, nullable=False)
    limitations_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
