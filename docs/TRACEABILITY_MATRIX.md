# MediChronicle AI — Traceability Matrix

This matrix maps each requirement to its backend domain service, API route, database entity, frontend component/page, and automated test.

| Functional Area | Backend Service | API Route | DB Models | Frontend Page | Automated Test |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Core 1: Auth & RBAC** | `app/core/security.py`, `permissions.py` | `/api/v1/auth/*` | `User`, `AuditLog` | `Login.tsx` | `test_auth_and_security.py` |
| **Core 2: Documents & Observations** | Direct Router / PyPDF | `/api/v1/documents/*` | `MedicalDocument`, `MedicalObservation` | `DocumentUploadPage.tsx` | `test_core_document_and_readings.py` |
| **Core 3: Daily Health Tracking** | Direct Router / Validator | `/api/v1/health-readings/*` | `DailyHealthReading`, `HealthEvent` | `DailyReadingsPage.tsx` | `test_core_document_and_readings.py` |
| **Module 1: Lifetime Health Memory** | `app/services/timeline_service.py` | `/api/v1/timeline/*` | `HealthEvent`, `MedicalObservation` | `HealthTimelinePage.tsx` | `test_module_1_timeline_and_search.py` |
| **Module 2: Medicine Salt Engine** | `app/services/medicine_salt_service.py` | `/api/v1/medicines/*` | `Medication`, `ActiveSalt`, `DrugInteractionCheck` | `MedicineSaltPage.tsx` | `test_module_2_medicine_salt_and_interactions.py` |
| **Module 3: Trends & Early Warning** | `app/services/trend_analyzer.py` | `/api/v1/trends/*` | `DailyHealthReading`, `MedicalObservation` | `TrendsWarningPage.tsx` | `test_module_3_trends_and_early_warning.py` |
| **Module 4: Supplement Checker** | `app/services/supplement_service.py` | `/api/v1/supplements/*` | `Supplement`, `SupplementIngredient` | `SupplementCheckerPage.tsx` | `test_module_4_supplement_and_nutrient.py` |
| **Module 5: Report Translator** | `app/services/translator_service.py` | `/api/v1/translator/*` | `MedicalDocument`, `MedicalObservation` | `ReportTranslatorPage.tsx` | `test_module_5_report_translator.py` |
| **Module 6: Symptom Correlator** | `app/services/symptom_correlator_service.py` | `/api/v1/symptoms/*` | `SymptomEvent`, `HealthEvent`, `Medication` | `SymptomCorrelatorPage.tsx` | `test_module_6_symptom_correlator.py` |
| **Module 7: Medicine Change Impact** | `app/services/medicine_change_tracker.py` | `/api/v1/medicine-changes/*` | `MedicationHistoryEvent`, `DailyHealthReading` | `MedicineChangePage.tsx` | `test_module_7_medicine_change_tracker.py` |
| **Module 8: Prescription Verifier** | `app/services/prescription_verifier.py` | `/api/v1/prescription-verify/*` | `PrescriptionVerification`, `MedicalDocument` | `PrescriptionVerifyPage.tsx` | `test_module_8_prescription_verification.py` |
| **Module 9: Doctor Visit Prep** | `app/services/doctor_visit_generator.py` | `/api/v1/doctor-visit/*` | `DoctorVisitSummary` | `DoctorVisitPrepPage.tsx` | `test_module_9_doctor_visit_prep.py` |
| **Module 10: AI Transparency** | `app/services/ai_provenance_service.py` | `/api/v1/ai-transparency/*` | `AIProvenanceRecord` | `AITransparencyPage.tsx` | Integrated / Verified |
| **Module 11: Family Management** | `app/services/family_permission_service.py` | `/api/v1/family/*` | `CaregiverInvitation`, `CaregiverPermission`, `AuditLog` | `FamilyManagementPage.tsx` | `test_module_11_family_permissions.py` |
| **Module 12: Costs & Duplicate Tests** | `app/services/expense_duplicate_service.py` | `/api/v1/expenses/*` | `MedicalExpense`, `DuplicateTestFlag` | `ExpenseDuplicatePage.tsx` | `test_module_12_expense_duplicate_tracker.py` |
