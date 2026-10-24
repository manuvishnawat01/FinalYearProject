from typing import List, Dict, Any, Optional
import datetime
from sqlalchemy.orm import Session
from app.models.ai_provenance import AIProvenanceLog, ExternalMedicalSource
from app.schemas.intelligence_modules import AIProvenanceOut

class AIProvenanceService:
    @staticmethod
    def validate_and_log_provenance(
        db: Session,
        patient_id: int,
        module_name: str,
        request_context: str,
        explanation_text: str,
        records_considered: List[Dict[str, Any]],
        candidate_citations: List[Dict[str, Any]],
        extraction_uncertainty: float = 0.0,
        identity_uncertainty: float = 0.0,
        evidence_uncertainty: float = 0.0,
        interpretation_uncertainty: float = 0.0,
        limitations_notes: Optional[str] = None
    ) -> AIProvenanceLog:
        """
        Validates external citations against verified persistent references.
        Rejects non-existent, fabricated, or unverified citations.
        Stores multi-dimensional uncertainty decomposition.
        """
        verified_citations = []
        validation_status = "validated"

        for cit in candidate_citations:
            url_or_id = cit.get("url") or cit.get("url_or_identifier")
            # Verify source in persistent ExternalMedicalSource repository
            source_rec = db.query(ExternalMedicalSource).filter(
                ExternalMedicalSource.url_or_identifier == url_or_id,
                ExternalMedicalSource.is_active == True
            ).first()

            if source_rec:
                verified_citations.append({
                    "id": source_rec.id,
                    "title": source_rec.source_title,
                    "publisher": source_rec.publisher,
                    "url": source_rec.url_or_identifier,
                    "evidence_summary": source_rec.evidence_summary,
                    "retrieval_date": str(source_rec.retrieval_timestamp.date()),
                    "validated": True
                })
            else:
                # Citation validation failed! Do NOT include unverified citation
                validation_status = "partial" if verified_citations else "citation_failed"

        log_entry = AIProvenanceLog(
            patient_id=patient_id,
            module_name=module_name,
            request_context=request_context,
            model_identifier="medichronicle-deterministic-v1",
            prompt_version="1.0.0",
            records_considered=records_considered,
            cited_sources=verified_citations,
            extraction_uncertainty=extraction_uncertainty,
            identity_uncertainty=identity_uncertainty,
            evidence_uncertainty=evidence_uncertainty if validation_status == "validated" else max(0.5, evidence_uncertainty),
            interpretation_uncertainty=interpretation_uncertainty,
            validation_status=validation_status,
            explanation_text=explanation_text,
            limitations_notes=limitations_notes or "AI outputs are grounded strictly in confirmed patient records and indexed clinical literature.",
            created_at=datetime.datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    @staticmethod
    def get_provenance_logs(db: Session, patient_id: int, module_name: Optional[str] = None) -> List[AIProvenanceLog]:
        q = db.query(AIProvenanceLog).filter(AIProvenanceLog.patient_id == patient_id)
        if module_name:
            q = q.filter(AIProvenanceLog.module_name == module_name)
        return q.order_by(AIProvenanceLog.created_at.desc()).limit(20).all()
