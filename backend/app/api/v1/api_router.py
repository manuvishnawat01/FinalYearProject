from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    documents,
    health_readings,
    timeline,
    medicines,
    trends,
    supplements,
    translator,
    symptoms,
    medicine_changes,
    prescription_verification,
    doctor_visit,
    ai_transparency,
    family,
    expenses
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Core: Authentication & Security"])
api_router.include_router(documents.router, prefix="/documents", tags=["Core: Medical Documents & Observations"])
api_router.include_router(health_readings.router, prefix="/health-readings", tags=["Core: Daily Health Tracking"])
api_router.include_router(timeline.router, prefix="/timeline", tags=["Module 1: Lifetime Patient Health Memory"])
api_router.include_router(medicines.router, prefix="/medicines", tags=["Module 2: Medicine Salt Intelligence Engine"])
api_router.include_router(trends.router, prefix="/trends", tags=["Module 3: Health Trend and Early-Warning System"])
api_router.include_router(supplements.router, prefix="/supplements", tags=["Module 4: Supplement & Nutrient Evidence"])
api_router.include_router(translator.router, prefix="/translator", tags=["Module 5: Medical Report Translator with Evidence"])
api_router.include_router(symptoms.router, prefix="/symptoms", tags=["Module 6: Side-Effect & Symptom Correlator"])
api_router.include_router(medicine_changes.router, prefix="/medicine-changes", tags=["Module 7: Medicine Change Impact Tracker"])
api_router.include_router(prescription_verification.router, prefix="/prescription-verify", tags=["Module 8: Prescription Verification"])
api_router.include_router(doctor_visit.router, prefix="/doctor-visit", tags=["Module 9: Doctor Visit Preparation Generator"])
api_router.include_router(ai_transparency.router, prefix="/ai-transparency", tags=["Module 10: AI Confidence & Transparency"])
api_router.include_router(family.router, prefix="/family", tags=["Module 11: Family Health Management & Permissions"])
api_router.include_router(expenses.router, prefix="/expenses", tags=["Module 12: Healthcare Cost & Duplicate-Test Tracker"])
