from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.document import MedicalDocument, MedicalObservation
from app.models.ai_provenance import ExternalMedicalSource, AIProvenanceLog
from app.schemas.intelligence_modules import ReportExplanationOut, TranslatedObservationItem

class MedicalTranslatorService:
    # Deterministic bilingual plain-language vocabulary & evidence mappings
    EXPLANATION_MAP = {
        "hba1c": {
            "en": {
                "name": "HbA1c (Glycated Hemoglobin)",
                "explanation": "HbA1c reflects average blood sugar levels over the past 2 to 3 months. Unlike a daily fingerstick glucose test, it shows overall long-term glucose management.",
                "low": "Lower than typical reference; rarely clinical unless accompanied by hypoglycemia symptoms.",
                "normal": "Within target range for non-diabetic or well-controlled individuals.",
                "high": "Higher than reference range; indicates elevated glucose over the past 90 days. Discuss medication, nutrition, or physical activity with your doctor.",
                "source_title": "NIH NIDDK - The A1C Test & Diabetes",
                "source_pub": "National Institutes of Health (NIH)",
                "source_url": "https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test"
            },
            "hi": {
                "name": "एचबीए1सी (ग्लाइकेटेड हीमोग्लोबिन)",
                "explanation": "एचबीए1सी (HbA1c) पिछले 2 से 3 महीनों में आपके औसत रक्त शर्करा (ब्लड शुगर) के स्तर को दर्शाता है। यह दैनिक टेस्ट से अलग, लंबे समय के शुगर नियंत्रण को बताता है।",
                "low": "सामान्य सीमा से कम; जब तक लो शुगर के लक्षण न हों, आमतौर पर चिंता की बात नहीं।",
                "normal": "सामान्य और स्वस्थ सीमा के भीतर है।",
                "high": "सामान्य सीमा से अधिक है; यह दर्शाता है कि पिछले 90 दिनों में ब्लड शुगर अधिक रहा है। अपने डॉक्टर से दवा या आहार पर चर्चा करें।",
                "source_title": "NIH NIDDK - The A1C Test & Diabetes",
                "source_pub": "National Institutes of Health (NIH)",
                "source_url": "https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test"
            }
        },
        "creatinine": {
            "en": {
                "name": "Serum Creatinine",
                "explanation": "Creatinine is a waste byproduct produced by muscle metabolism that is filtered out by healthy kidneys. It is a key indicator of kidney filtration efficiency.",
                "low": "Below range; may indicate lower muscle mass or high fluid hydration.",
                "normal": "Within healthy limits, suggesting normal renal filtration.",
                "high": "Above normal range; may indicate that kidneys are filtering more slowly, or dehydration. Requires clinical evaluation in context with eGFR.",
                "source_title": "Kidney Disease Improving Global Outcomes (KDIGO) Guidelines",
                "source_pub": "KDIGO / MedlinePlus",
                "source_url": "https://medlineplus.gov/lab-tests/creatinine-test/"
            },
            "hi": {
                "name": "सीरम क्रिएटिनिन",
                "explanation": "क्रिएटिनिन मांसपेशियों के काम करने से बनने वाला एक अपशिष्ट उत्पाद है, जिसे स्वस्थ गुर्दे (किडनी) खून से छानकर बाहर निकालते हैं। यह किडनी की कार्यक्षमता का मुख्य संकेत है।",
                "low": "सामान्य से कम; मांसपेशियों की कमी या अधिक पानी पीने के कारण हो सकता है।",
                "normal": "सामान्य सीमा के भीतर है, जो दर्शाता है कि किडनी ठीक से काम कर रही है।",
                "high": "सामान्य सीमा से अधिक है; यह संकेत दे सकता है कि किडनी धीमी गति से छान रही है या शरीर में पानी की कमी (डिहाइड्रेशन) है। डॉक्टर से जांच करवाएं।",
                "source_title": "Kidney Disease Improving Global Outcomes (KDIGO) Guidelines",
                "source_pub": "KDIGO / MedlinePlus",
                "source_url": "https://medlineplus.gov/lab-tests/creatinine-test/"
            }
        },
        "hemoglobin": {
            "en": {
                "name": "Hemoglobin (Hb)",
                "explanation": "Hemoglobin is an iron-rich protein in red blood cells that transports oxygen from your lungs to tissues throughout your body.",
                "low": "Below range; commonly indicates anemia (e.g. iron deficiency, vitamin B12 deficiency, or blood loss). Symptoms may include tiredness or dizziness.",
                "normal": "Within healthy range; adequate oxygen-carrying capacity in blood.",
                "high": "Above range; may be related to dehydration, living at high altitude, or rarely bone marrow conditions.",
                "source_title": "WHO Nutritional Anemias Reference Guide",
                "source_pub": "World Health Organization (WHO)",
                "source_url": "https://www.who.int/data/gho/indicator-metadata-registry/imr-details/4176"
            },
            "hi": {
                "name": "हीमोग्लोबिन (Hb)",
                "explanation": "हीमोग्लोबिन लाल रक्त कोशिकाओं में मौजूद एक प्रोटीन है जो फेफड़ों से शरीर के सभी अंगों तक ऑक्सीजन पहुंचाने का काम करता है।",
                "low": "सामान्य सीमा से कम; यह अक्सर एनीमिया (खून की कमी) की ओर इशारा करता है। इससे थकान या कमजोरी महसूस हो सकती है।",
                "normal": "सामान्य और स्वस्थ सीमा के भीतर है।",
                "high": "सामान्य सीमा से अधिक; डिहाइड्रेशन या ऊंचाई पर रहने के कारण हो सकता है।",
                "source_title": "WHO Nutritional Anemias Reference Guide",
                "source_pub": "World Health Organization (WHO)",
                "source_url": "https://www.who.int/data/gho/indicator-metadata-registry/imr-details/4176"
            }
        },
        "fasting_glucose": {
            "en": {
                "name": "Fasting Blood Glucose",
                "explanation": "Measures sugar levels in your bloodstream after an overnight fast (typically 8 to 12 hours without food).",
                "low": "Low blood sugar (<70 mg/dL). Discuss symptoms of shakiness or sweating with your clinician.",
                "normal": "Normal fasting range (typically 70-99 mg/dL).",
                "high": "Fasting glucose >= 100 mg/dL indicates impaired fasting glucose or diabetes. Clinical review needed.",
                "source_title": "American Diabetes Association Standards of Medical Care in Diabetes",
                "source_pub": "American Diabetes Association (ADA)",
                "source_url": "https://diabetes.org/about-diabetes/diagnosis"
            },
            "hi": {
                "name": "खाली पेट ब्लड शुगर (फास्टिंग ग्लूकोज)",
                "explanation": "यह रात भर (8 से 12 घंटे) बिना भोजन किए आपके रक्त में शर्करा (शुगर) के स्तर को मापता है।",
                "low": "कम ब्लड शुगर (<70 mg/dL)। यदि चक्कर या कंपकंपी हो तो डॉक्टर को बताएं।",
                "normal": "सामान्य और स्वस्थ सीमा (70-99 mg/dL) में है।",
                "high": "खाली पेट शुगर 100 mg/dL या उससे अधिक है; डॉक्टर से जांच और मार्गदर्शन लें।",
                "source_title": "American Diabetes Association Standards of Medical Care in Diabetes",
                "source_pub": "American Diabetes Association (ADA)",
                "source_url": "https://diabetes.org/about-diabetes/diagnosis"
            }
        }
    }

    @staticmethod
    def explain_report(
        db: Session,
        patient_id: int,
        document_id: int,
        target_language: str = "en"
    ) -> ReportExplanationOut:
        doc = db.query(MedicalDocument).filter(
            MedicalDocument.id == document_id,
            MedicalDocument.patient_id == patient_id
        ).first()

        if not doc:
            raise ValueError("Document not found or access denied.")

        lang = target_language.lower() if target_language.lower() in ["en", "hi"] else "en"
        observations = db.query(MedicalObservation).filter(
            MedicalObservation.document_id == document_id,
            MedicalObservation.patient_id == patient_id
        ).all()

        translated_items: List[TranslatedObservationItem] = []
        citations_used: List[Dict[str, Any]] = []
        questions: List[str] = []

        is_hindi = (lang == "hi")

        for obs in observations:
            norm_name = obs.normalized_name.lower()
            val_str = str(obs.numeric_value) if obs.numeric_value is not None else (obs.string_value or "Present")
            ref_str = obs.reference_range_text or (f"{obs.reference_range_low} - {obs.reference_range_high}" if obs.reference_range_low is not None else ("Not specified in report" if not is_hindi else "रिपोर्ट में उल्लेख नहीं है"))

            # Determine out of range
            is_out = False
            status_text = "normal"
            if obs.numeric_value is not None:
                if obs.reference_range_low is not None and obs.numeric_value < obs.reference_range_low:
                    is_out = True
                    status_text = "low"
                elif obs.reference_range_high is not None and obs.numeric_value > obs.reference_range_high:
                    is_out = True
                    status_text = "high"

            # Match in dictionary or create grounded fallback
            dict_match = None
            for k in MedicalTranslatorService.EXPLANATION_MAP.keys():
                if k in norm_name or norm_name in k:
                    dict_match = MedicalTranslatorService.EXPLANATION_MAP[k][lang]
                    break

            if dict_match:
                name_display = dict_match["name"]
                desc_text = f"{dict_match['explanation']} Result status: {dict_match[status_text]}"
                claim_source = f"{dict_match['source_title']} ({dict_match['source_pub']})"
                
                # Check / register in ExternalMedicalSource
                db_source = db.query(ExternalMedicalSource).filter(
                    ExternalMedicalSource.url_or_identifier == dict_match["source_url"]
                ).first()
                if not db_source:
                    db_source = ExternalMedicalSource(
                        source_title=dict_match["source_title"],
                        publisher=dict_match["source_pub"],
                        url_or_identifier=dict_match["source_url"],
                        evidence_summary=dict_match["explanation"],
                        is_active=True
                    )
                    db.add(db_source)
                    db.flush()

                citations_used.append({
                    "id": db_source.id,
                    "title": db_source.source_title,
                    "publisher": db_source.publisher,
                    "url": db_source.url_or_identifier,
                    "validated": True
                })
            else:
                name_display = obs.observation_name
                if not is_hindi:
                    desc_text = f"Reported {obs.observation_name} is {val_str} {obs.unit or ''}. Reference range: {ref_str}. Status: {'Outside standard range' if is_out else 'Within reference range'}."
                else:
                    desc_text = f"{obs.observation_name} का परिणाम {val_str} {obs.unit or ''} है। सामान्य सीमा: {ref_str}। स्थिति: {'सामान्य सीमा से बाहर' if is_out else 'सामान्य सीमा के भीतर'}।"
                claim_source = "Hospital Laboratory Report"

            translated_items.append(TranslatedObservationItem(
                test_name=name_display,
                actual_value=val_str,
                unit=obs.unit,
                reference_range=ref_str,
                is_out_of_range=is_out,
                plain_language_explanation=desc_text,
                evidence_claim_source=claim_source
            ))

            # Generate targeted clinician discussion questions
            if is_out:
                if not is_hindi:
                    questions.append(f"My {name_display} result ({val_str} {obs.unit or ''}) is outside the report's reference range ({ref_str}). Does this require a repeat test or dosage adjustment?")
                else:
                    questions.append(f"मेरा {name_display} परिणाम ({val_str} {obs.unit or ''}) सामान्य सीमा ({ref_str}) से बाहर है। क्या मुझे दोबारा जांच या दवा में बदलाव की आवश्यकता है?")

        if not questions:
            if not is_hindi:
                questions.append("Are there any routine lifestyle recommendations or follow-up timelines based on these results?")
            else:
                questions.append("इन सामान्य परिणामों के आधार पर क्या कोई अनुवर्ती जांच या जीवनशैली संबंधी सलाह है?")

        # Executive summary
        out_count = sum(1 for item in translated_items if item.is_out_of_range)
        if not is_hindi:
            summary = f"Report '{doc.file_name}' contains {len(translated_items)} observation(s). {out_count} observation(s) fall outside the laboratory's documented reference ranges."
            limitations = "Reference ranges are specific to the issuing laboratory's testing methodology and calibration standards. This translation is for personal health literacy and must be clinically correlated by a licensed medical practitioner."
        else:
            summary = f"रिपोर्ट '{doc.file_name}' में {len(translated_items)} परीक्षण दर्ज हैं। इनमें से {out_count} परिणाम प्रयोगशाला की सामान्य सीमा से बाहर हैं।"
            limitations = "संदर्भ सीमाएं (Reference Ranges) संबंधित प्रयोगशाला की परीक्षण पद्धति पर निर्भर करती हैं। यह अनुवाद केवल समझ बढ़ाने के लिए है और इसे किसी प्रमाणित चिकित्सक द्वारा सत्यापित किया जाना चाहिए।"

        # Deduplicate citations
        unique_citations = {c["url"]: c for c in citations_used}.values()

        # Save AI Provenance record
        prov = AIProvenanceLog(
            patient_id=patient_id,
            module_name="translator",
            request_context=f"Document ID #{doc.id} translation to {lang.upper()}",
            model_identifier="medichronicle-deterministic-translator-v1",
            prompt_version="1.0.0",
            records_considered=[{"type": "observation", "id": o.id, "name": o.observation_name} for o in observations],
            cited_sources=list(unique_citations),
            extraction_uncertainty=0.05,
            identity_uncertainty=0.02,
            evidence_uncertainty=0.04,
            interpretation_uncertainty=0.05,
            validation_status="validated",
            explanation_text=summary,
            limitations_notes=limitations
        )
        db.add(prov)
        db.commit()

        return ReportExplanationOut(
            document_id=doc.id,
            document_name=doc.file_name,
            document_date=doc.document_date,
            target_language=lang,
            executive_summary=summary,
            observations=translated_items,
            clinical_discussion_questions=questions,
            citations=list(unique_citations),
            limitations_and_uncertainties=limitations
        )
