# MediChronicle AI — Acceptance Test Checklist

This checklist documents the verification of each requirement across the 14 functional areas.

---

## Core 1: User Authentication, Security & RBAC
- [x] Register patient, caregiver, and clinician accounts with hashed passwords (bcrypt).
- [x] Issue valid JWT tokens with expiration.
- [x] Enforce role-based access control (deny-by-default on cross-patient data access).
- [x] Generate persistent audit log records for authorization and data access events.
- [x] Automated test passing: `tests/test_auth_and_security.py`.

## Core 2: Document Upload, Extraction & Confirmation
- [x] Upload PDF, PNG, and JPG medical reports.
- [x] Extract text candidate observations with OCR confidence scores.
- [x] Retain unverified status until user reviews.
- [x] Support explicit user confirmation and value correction.
- [x] Automated test passing: `tests/test_core_document_and_readings.py`.

## Core 3: Daily Health Tracking
- [x] Enforce paired systolic & diastolic blood pressure validation.
- [x] Enforce mandatory glucose context tags (fasting, pre-meal, post-meal, bedtime, random).
- [x] Support heart rate and weight tracking.
- [x] Reject invalid inputs (e.g. systolic alone, negative values, unphysiological numbers).
- [x] Automated test passing: `tests/test_core_document_and_readings.py`.

## Module 1: Lifetime Patient Health Memory
- [x] Aggregate reports, daily vitals, medicines, and alerts into a unified chronological timeline.
- [x] Execute constrained parameter search without raw unconstrained SQL injection risk.
- [x] Side-by-side comparison of compatible lab tests with percentage change calculation.
- [x] Report missing test results without fabricating data.
- [x] Automated test passing: `tests/test_module_1_timeline_and_search.py`.

## Module 2: Medicine Salt Intelligence Engine
- [x] Add medications with brand name, generic name, active salts, and strengths.
- [x] Identify exact duplicate active ingredients and combination drug overlap across regimen.
- [x] Check drug-drug interactions against trusted database.
- [x] Simulate external provider outage and verify UI displays `503 Unavailable` instead of false "No interactions found".
- [x] Automated test passing: `tests/test_module_2_medicine_salt_and_interactions.py`.

## Module 3: Health Trend and Early-Warning System
- [x] Render time-series charts for blood pressure, glucose, and lab values.
- [x] Compute absolute and percentage change with boundary protection against zero division.
- [x] Display clinical reference ranges and high/low alert badges.
- [x] Evaluate versioned early-warning rules transparently.
- [x] Automated test passing: `tests/test_module_3_trends_and_early_warning.py`.

## Module 4: Supplement and Nutrient Evidence Checker
- [x] Register multi-constituent supplements.
- [x] Sum daily nutrient intake across all products.
- [x] Flag proprietary blends with unknown quantities without erroneously assuming 0.
- [x] Compare cumulative intake against Tolerable Upper Intake Levels (UL).
- [x] Automated test passing: `tests/test_module_4_supplement_and_nutrient.py`.

## Module 5: Medical Report Translator with Evidence
- [x] Generate plain-language explanations in English (`en`) and Hindi (`hi`).
- [x] Strictly preserve exact numerical test values, reference intervals, and units.
- [x] Attach verified peer-reviewed citations (PubMed, NIH, WHO).
- [x] Provide clinical discussion prompts for patient-doctor appointments.
- [x] Automated test passing: `tests/test_module_5_report_translator.py`.

## Module 6: Side-Effect and Symptom Timeline Correlator
- [x] Log symptoms with severity rating (1–10) and onset timing.
- [x] Correlate symptom onset with medication starts/changes within 60-day window.
- [x] Highlight pharmacovigilance adverse reactions from FDA/DailyMed.
- [x] Include prominent disclaimer stating temporal proximity $\neq$ causation.
- [x] Escalate severe symptoms (severity $\ge 8$ or chest pain) to emergency red-flag alert.
- [x] Automated test passing: `tests/test_module_6_symptom_correlator.py`.

## Module 7: Medicine Change Impact Tracker
- [x] Log regimen modifications (discontinuation, dose changes, substitutions).
- [x] Compare daily readings (BP, glucose) and lab observations $\pm N$ days of change.
- [x] Present neutral, non-prescriptive report with doctor follow-up prompts.
- [x] Automated test passing: `tests/test_module_7_medicine_change_tracker.py`.

## Module 8: Prescription-to-Actual-Medicine Verification
- [x] Select prescription document vs dispensed medicine package photo.
- [x] Perform field-by-field comparison (`salt`, `strength`, `brand`, `frequency`).
- [x] Categorize fields as `match`, `potential_discrepancy`, `missing_on_one_side`, `uncertain`.
- [x] Display prominent non-authenticity disclaimer.
- [x] Automated test passing: `tests/test_module_8_prescription_verification.py`.

## Module 9: Doctor Visit Preparation Generator
- [x] Select lookback window, clinician name, and specialty.
- [x] Configure section inclusion toggles (meds, vitals, labs, symptoms).
- [x] Add custom patient questions for consultation.
- [x] Generate and download genuine binary PDF generated with ReportLab.
- [x] Automated test passing: `tests/test_module_9_doctor_visit_prep.py`.

## Module 10: AI Confidence and Evidence Transparency
- [x] Log prompt versions, models used, and specific patient records considered.
- [x] Expose 4-Dimensional uncertainty decomposition:
  1. Extraction uncertainty
  2. Identity uncertainty
  3. Evidence uncertainty
  4. Interpretation uncertainty
- [x] Validate external citation URLs against approved medical domain whitelist.
- [x] Functional verification in frontend `AITransparencyPage.tsx`.

## Module 11: Family Health Management with Permission Controls
- [x] Generate single-use caregiver invitation tokens with expiration.
- [x] Enforce granular deny-by-default capability booleans:
  - `can_view_reports`
  - `can_view_readings`
  - `can_view_medicines`
  - `can_view_summaries`
  - `can_view_appointments`
  - `can_edit`
- [x] Immediate access revocation sets `is_active=false` with timestamp.
- [x] Log all permission changes in security audit trail.
- [x] Automated test passing: `tests/test_module_11_family_permissions.py`.

## Module 12: Healthcare Cost and Duplicate-Test Tracker
- [x] Log medical expenses by category, provider facility, and amount.
- [x] Compute category, provider, and monthly breakdown summaries.
- [x] Stream CSV file download of expenditure ledger.
- [x] Detect duplicate diagnostic tests ordered within 90 days.
- [x] Display clinical appropriateness disclaimer on repeated testing.
- [x] Automated test passing: `tests/test_module_12_expense_duplicate_tracker.py`.
