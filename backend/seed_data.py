import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import (
    User, PatientProfile, MedicalDocument, MedicalObservation,
    DailyHealthReading, HealthEvent, Medication, MedicationIngredient,
    MedicineHistoryEvent, Supplement, SupplementIngredient, Symptom,
    ExternalMedicalSource, CaregiverPermission, MedicalExpense, DuplicateTestFlag
)
from app.core.security import hash_password
from app.services.timeline_service import TimelineService

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "patient@medichronicle.ai").first():
            print("Database already contains seed data.")
            return

        print("Seeding MediChronicle AI database...")

        # 1. External Medical Sources
        sources = [
            ExternalMedicalSource(
                source_title="The A1C Test & Diabetes Guidelines",
                publisher="National Institutes of Health (NIH) / NIDDK",
                url_or_identifier="https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test",
                evidence_summary="The glycated hemoglobin test reflects average plasma glucose concentration over approximately 8-12 weeks.",
                is_active=True
            ),
            ExternalMedicalSource(
                source_title="KDIGO Clinical Practice Guideline for Acute Kidney Injury",
                publisher="KDIGO / MedlinePlus",
                url_or_identifier="https://medlineplus.gov/lab-tests/creatinine-test/",
                evidence_summary="Serum creatinine is filtered by glomeruli; elevations suggest impaired renal clearance or dehydration.",
                is_active=True
            ),
            ExternalMedicalSource(
                source_title="WHO Nutritional Anemias Reference Guide",
                publisher="World Health Organization (WHO)",
                url_or_identifier="https://www.who.int/data/gho/indicator-metadata-registry/imr-details/4176",
                evidence_summary="Hemoglobin concentrations indicate erythropoietic oxygen capacity; thresholds define nutritional anemia.",
                is_active=True
            ),
            ExternalMedicalSource(
                source_title="American Diabetes Association Standards of Medical Care in Diabetes",
                publisher="American Diabetes Association (ADA)",
                url_or_identifier="https://diabetes.org/about-diabetes/diagnosis",
                evidence_summary="Fasting blood glucose criteria establish normal (<100 mg/dL), impaired (100-125 mg/dL), and diabetic (>=126 mg/dL) thresholds.",
                is_active=True
            ),
            ExternalMedicalSource(
                source_title="FDA DailyMed Prescribing Information - Metformin",
                publisher="U.S. Food and Drug Administration (FDA)",
                url_or_identifier="https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=metformin",
                evidence_summary="Metformin decreases hepatic glucose production and intestinal absorption, improving insulin sensitivity.",
                is_active=True
            )
        ]
        for s in sources:
            db.add(s)
        db.flush()

        # 2. Users
        patient = User(
            email="patient@medichronicle.ai",
            hashed_password=hash_password("Password123!"),
            full_name="Rajesh Sharma",
            role="patient",
            is_active=True
        )
        db.add(patient)
        db.flush()

        patient_profile = PatientProfile(
            user_id=patient.id,
            date_of_birth="1978-05-14",
            gender="Male",
            blood_group="B+",
            emergency_contact="+91 98765 43210",
            allergies=["Penicillin", "Sulfa drugs"],
            chronic_conditions=["Type 2 Diabetes", "Mild Hypertension"]
        )
        db.add(patient_profile)

        caregiver = User(
            email="caregiver@medichronicle.ai",
            hashed_password=hash_password("Password123!"),
            full_name="Ananya Sharma",
            role="caregiver",
            is_active=True
        )
        db.add(caregiver)
        db.flush()

        other_patient = User(
            email="patient2@medichronicle.ai",
            hashed_password=hash_password("Password123!"),
            full_name="Vikram Patel",
            role="patient",
            is_active=True
        )
        db.add(other_patient)
        db.flush()

        # Initial Caregiver Permission (deny-by-default with specific grants)
        perm = CaregiverPermission(
            patient_id=patient.id,
            caregiver_id=caregiver.id,
            can_view_reports=False,  # Initially restricted to test authorization guard
            can_view_readings=True,
            can_view_medicines=True,
            can_view_summaries=False,
            can_view_appointments=True,
            can_edit=False,
            is_active=True,
            granted_at=datetime.datetime.utcnow()
        )
        db.add(perm)

        # 3. Medical Documents & Observations
        doc1 = MedicalDocument(
            patient_id=patient.id,
            file_name="Lab_Report_Comprehensive_Metabolic_Panel_Jan2026.pdf",
            file_path="./uploads/seed_doc1.pdf",
            file_type="application/pdf",
            file_size=248000,
            category="laboratory",
            document_date="2026-01-15",
            status="extracted",
            verification_status="confirmed_by_user",
            ocr_raw_text="Apex Diagnostics. Patient: Rajesh Sharma. Test: HbA1c: 7.2 %, Fasting Glucose: 135 mg/dL, Creatinine: 1.0 mg/dL"
        )
        db.add(doc1)
        db.flush()

        obs1 = MedicalObservation(
            patient_id=patient.id,
            document_id=doc1.id,
            observation_name="HbA1c",
            normalized_name="hba1c",
            test_category="Diabetes",
            numeric_value=7.2,
            unit="%",
            reference_range_low=4.0,
            reference_range_high=5.6,
            reference_range_text="4.0 - 5.6 %",
            interpretation="high",
            observation_date="2026-01-15",
            method="HPLC",
            source_provenance="confirmed_by_user",
            verification_status="confirmed_by_user"
        )
        obs2 = MedicalObservation(
            patient_id=patient.id,
            document_id=doc1.id,
            observation_name="Fasting Blood Glucose",
            normalized_name="fasting_glucose",
            test_category="Diabetes",
            numeric_value=135.0,
            unit="mg/dL",
            reference_range_low=70.0,
            reference_range_high=99.0,
            reference_range_text="70.0 - 99.0 mg/dL",
            interpretation="high",
            observation_date="2026-01-15",
            method="Hexokinase",
            source_provenance="confirmed_by_user",
            verification_status="confirmed_by_user"
        )
        obs3 = MedicalObservation(
            patient_id=patient.id,
            document_id=doc1.id,
            observation_name="Serum Creatinine",
            normalized_name="creatinine",
            test_category="Renal",
            numeric_value=1.0,
            unit="mg/dL",
            reference_range_low=0.7,
            reference_range_high=1.3,
            reference_range_text="0.7 - 1.3 mg/dL",
            interpretation="normal",
            observation_date="2026-01-15",
            method="Modified Jaffe",
            source_provenance="confirmed_by_user",
            verification_status="confirmed_by_user"
        )
        db.add_all([obs1, obs2, obs3])

        # Second Document (Repeat Lab in March 2026 to demonstrate Trend & Historical Comparison)
        doc2 = MedicalDocument(
            patient_id=patient.id,
            file_name="Lab_Report_Followup_March2026.pdf",
            file_path="./uploads/seed_doc2.pdf",
            file_type="application/pdf",
            file_size=215000,
            category="laboratory",
            document_date="2026-03-20",
            status="extracted",
            verification_status="confirmed_by_user",
            ocr_raw_text="Apex Diagnostics. Patient: Rajesh Sharma. Followup: HbA1c: 6.8 %, Fasting Glucose: 118 mg/dL, Creatinine: 1.05 mg/dL"
        )
        db.add(doc2)
        db.flush()

        obs4 = MedicalObservation(
            patient_id=patient.id,
            document_id=doc2.id,
            observation_name="HbA1c",
            normalized_name="hba1c",
            test_category="Diabetes",
            numeric_value=6.8,
            unit="%",
            reference_range_low=4.0,
            reference_range_high=5.6,
            reference_range_text="4.0 - 5.6 %",
            interpretation="high",
            observation_date="2026-03-20",
            method="HPLC",
            source_provenance="confirmed_by_user",
            verification_status="confirmed_by_user"
        )
        obs5 = MedicalObservation(
            patient_id=patient.id,
            document_id=doc2.id,
            observation_name="Fasting Blood Glucose",
            normalized_name="fasting_glucose",
            test_category="Diabetes",
            numeric_value=118.0,
            unit="mg/dL",
            reference_range_low=70.0,
            reference_range_high=99.0,
            reference_range_text="70.0 - 99.0 mg/dL",
            interpretation="high",
            observation_date="2026-03-20",
            method="Hexokinase",
            source_provenance="confirmed_by_user",
            verification_status="confirmed_by_user"
        )
        db.add_all([obs4, obs5])

        # 4. Daily Health Readings (Paired BP and contextual glucose across dates)
        readings = [
            DailyHealthReading(
                patient_id=patient.id,
                reading_type="blood_pressure",
                reading_date="2026-03-01",
                measurement_time="08:00",
                systolic=138.0,
                diastolic=88.0,
                pulse=72,
                notes="Morning resting BP",
                source_provenance="patient_entered"
            ),
            DailyHealthReading(
                patient_id=patient.id,
                reading_type="blood_pressure",
                reading_date="2026-03-10",
                measurement_time="08:15",
                systolic=142.0,
                diastolic=90.0,
                pulse=76,
                notes="Felt slightly stressed",
                source_provenance="patient_entered"
            ),
            DailyHealthReading(
                patient_id=patient.id,
                reading_type="blood_pressure",
                reading_date="2026-03-20",
                measurement_time="08:00",
                systolic=144.0,
                diastolic=92.0,
                pulse=74,
                notes="Repeat check",
                source_provenance="patient_entered"
            ),
            DailyHealthReading(
                patient_id=patient.id,
                reading_type="blood_glucose",
                reading_date="2026-03-01",
                measurement_time="07:30",
                glucose_value=124.0,
                glucose_context="fasting",
                notes="Fasting before tea",
                source_provenance="patient_entered"
            ),
            DailyHealthReading(
                patient_id=patient.id,
                reading_type="blood_glucose",
                reading_date="2026-03-10",
                measurement_time="07:30",
                glucose_value=120.0,
                glucose_context="fasting",
                notes="Fasting",
                source_provenance="patient_entered"
            ),
            DailyHealthReading(
                patient_id=patient.id,
                reading_type="blood_glucose",
                reading_date="2026-03-20",
                measurement_time="07:30",
                glucose_value=118.0,
                glucose_context="fasting",
                notes="Fasting",
                source_provenance="patient_entered"
            ),
            DailyHealthReading(
                patient_id=patient.id,
                reading_type="blood_glucose",
                reading_date="2026-03-20",
                measurement_time="14:00",
                glucose_value=162.0,
                glucose_context="post_meal",
                notes="2 hours post lunch",
                source_provenance="patient_entered"
            )
        ]
        db.add_all(readings)

        # 5. Medications (Including intentional duplicate salt for Module 2 testing)
        med1 = Medication(
            patient_id=patient.id,
            brand_name="Glycomet 500",
            generic_name="Metformin Hydrochloride",
            dosage_form="Tablet",
            route="oral",
            prescribed_dosage="1 tablet",
            frequency="Twice daily",
            timing_instructions="After breakfast and dinner",
            start_date="2025-10-01",
            status="active",
            prescriber_name="Dr. Sarah Rao, MD",
            reason_for_use="Type 2 Diabetes Glycemic Control",
            source="prescription",
            verification_status="confirmed_by_user"
        )
        db.add(med1)
        db.flush()
        db.add(MedicationIngredient(medication_id=med1.id, ingredient_name="Metformin Hydrochloride", normalized_ingredient_name="metformin hydrochloride", strength=500.0, strength_unit="mg"))

        med2 = Medication(
            patient_id=patient.id,
            brand_name="Telmikem 40",
            generic_name="Telmisartan",
            dosage_form="Tablet",
            route="oral",
            prescribed_dosage="1 tablet",
            frequency="Once daily",
            timing_instructions="Morning with water",
            start_date="2025-11-15",
            status="active",
            prescriber_name="Dr. Sarah Rao, MD",
            reason_for_use="Hypertension Management",
            source="prescription",
            verification_status="confirmed_by_user"
        )
        db.add(med2)
        db.flush()
        db.add(MedicationIngredient(medication_id=med2.id, ingredient_name="Telmisartan", normalized_ingredient_name="telmisartan", strength=40.0, strength_unit="mg"))

        # Duplicate Paracetamol products to trigger Module 2 Duplicate Salt Detection
        med3 = Medication(
            patient_id=patient.id,
            brand_name="Dolo 650",
            generic_name="Paracetamol",
            dosage_form="Tablet",
            route="oral",
            prescribed_dosage="1 tablet",
            frequency="As needed (SOS)",
            timing_instructions="For fever or mild pain",
            start_date="2026-02-01",
            status="active",
            source="manual_entry",
            verification_status="confirmed_by_user"
        )
        db.add(med3)
        db.flush()
        db.add(MedicationIngredient(medication_id=med3.id, ingredient_name="Paracetamol", normalized_ingredient_name="paracetamol", strength=650.0, strength_unit="mg"))

        med4 = Medication(
            patient_id=patient.id,
            brand_name="Calpol 500",
            generic_name="Paracetamol",
            dosage_form="Tablet",
            route="oral",
            prescribed_dosage="1 tablet",
            frequency="As needed (SOS)",
            timing_instructions="For headache",
            start_date="2026-02-15",
            status="active",
            source="manual_entry",
            verification_status="confirmed_by_user"
        )
        db.add(med4)
        db.flush()
        db.add(MedicationIngredient(medication_id=med4.id, ingredient_name="Paracetamol", normalized_ingredient_name="paracetamol", strength=500.0, strength_unit="mg"))

        # 6. Supplements
        supp1 = Supplement(
            patient_id=patient.id,
            product_name="D-Rise 60K",
            brand="USV",
            supplement_type="vitamin",
            serving_size="1 capsule",
            recorded_frequency="Weekly",
            daily_servings_count=0.14, # weekly = 1/7 per day
            start_date="2026-01-01",
            status="active",
            source="packaging",
            verification_status="confirmed_by_user"
        )
        db.add(supp1)
        db.flush()
        db.add(SupplementIngredient(supplement_id=supp1.id, ingredient_name="Cholecalciferol", normalized_name="vitamin_d", amount_per_serving=60000.0, unit="IU", is_amount_unknown="false"))

        supp2 = Supplement(
            patient_id=patient.id,
            product_name="Daily MultiVital Herbal",
            brand="HerbaHealth",
            supplement_type="multivitamin",
            serving_size="1 tablet",
            recorded_frequency="Once daily",
            daily_servings_count=1.0,
            start_date="2026-02-01",
            status="active",
            source="packaging",
            verification_status="unverified"
        )
        db.add(supp2)
        db.flush()
        db.add(SupplementIngredient(supplement_id=supp2.id, ingredient_name="Vitamin C", normalized_name="vitamin_c", amount_per_serving=100.0, unit="mg", is_amount_unknown="false"))
        db.add(SupplementIngredient(supplement_id=supp2.id, ingredient_name="Proprietary Herbal Extract", normalized_name="herbal_blend", amount_per_serving=None, unit="mg", is_amount_unknown="true"))

        # 7. Symptoms
        sym1 = Symptom(
            patient_id=patient.id,
            symptom_name="Dry Cough",
            description="Persistent non-productive cough, especially noticeable at night.",
            onset_date="2026-02-20",
            severity=4,
            duration_hours=72.0,
            frequency="intermittent",
            is_ongoing=True,
            notes="No fever or sputum.",
            source_provenance="patient_entered",
            verification_status="confirmed_by_user"
        )
        db.add(sym1)

        # 8. Expenses
        exp1 = MedicalExpense(
            patient_id=patient.id,
            expense_date="2026-01-15",
            provider_facility="Apex Diagnostics",
            category="laboratory",
            service_or_test_name="Comprehensive Diabetes Profile",
            amount=1450.0,
            currency="INR",
            related_report_id=doc1.id,
            payment_status="paid",
            notes="Routine 3-month review"
        )
        exp2 = MedicalExpense(
            patient_id=patient.id,
            expense_date="2026-01-18",
            provider_facility="City Heart Clinic",
            category="consultation",
            service_or_test_name="Physician Consultation - Dr. Sarah Rao",
            amount=800.0,
            currency="INR",
            payment_status="paid"
        )
        exp3 = MedicalExpense(
            patient_id=patient.id,
            expense_date="2026-03-20",
            provider_facility="Apex Diagnostics",
            category="laboratory",
            service_or_test_name="HbA1c & Fasting Glucose Follow-up",
            amount=950.0,
            currency="INR",
            related_report_id=doc2.id,
            payment_status="paid"
        )
        db.add_all([exp1, exp2, exp3])

        # 9. Register Timeline Events
        TimelineService.record_event(db, patient.id, "2026-01-15", "report", "Lab Report Uploaded", "Comprehensive Metabolic Panel from Apex Diagnostics", "medical_document", doc1.id, "confirmed_by_user")
        TimelineService.record_event(db, patient.id, "2026-01-15", "lab_observation", "Observation Confirmed: HbA1c 7.2%", "Higher than standard non-diabetic range.", "medical_observation", obs1.id, "confirmed_by_user")
        TimelineService.record_event(db, patient.id, "2026-03-20", "report", "Lab Report Uploaded", "Followup report from Apex Diagnostics", "medical_document", doc2.id, "confirmed_by_user")
        TimelineService.record_event(db, patient.id, "2026-03-20", "lab_observation", "Observation Confirmed: HbA1c 6.8%", "Decreased from 7.2% to 6.8%.", "medical_observation", obs4.id, "confirmed_by_user")
        TimelineService.record_event(db, patient.id, "2026-02-20", "symptom", "Symptom Logged: Dry Cough", "Severity 4/10. Persistent nighttime cough.", "symptom", sym1.id, "confirmed_by_user")

        db.commit()
        print("Database successfully seeded with realistic clinical records for all 14 modules.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
