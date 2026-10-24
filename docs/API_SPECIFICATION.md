# MediChronicle AI — REST API Specification (`/api/v1`)

All endpoints require JWT Bearer Authentication (`Authorization: Bearer <token>`) except `/auth/register` and `/auth/login`.

---

## 1. Authentication & Identity (`/auth`)

### `POST /auth/register`
- **Description:** Register a new user account.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "full_name": "John Doe",
    "role": "patient",
    "date_of_birth": "1980-05-15",
    "blood_group": "B+"
  }
  ```
- **Response:** `200 OK` with User profile object.

### `POST /auth/login`
- **Description:** Authenticate credentials and receive JWT access token.
- **Request Body:** `{"email": "...", "password": "..."}`
- **Response:** `{"access_token": "ey...", "token_type": "bearer", "user": {...}}`

### `GET /auth/me`
- **Description:** Retrieve currently authenticated profile and permissions.

---

## 2. Medical Documents & Observations (`/documents`)

### `POST /documents/upload`
- **Description:** Multipart upload of PDF, PNG, or JPG lab reports/prescriptions. Runs OCR candidate observation extraction.
- **Form Data:** `file`, `document_type` (e.g. `laboratory_report`, `prescription`, `discharge_summary`), `document_date`, `notes`.

### `GET /documents/`
- **Description:** List uploaded medical documents for authenticated patient.

### `GET /documents/observations/list`
- **Description:** List extracted candidate and confirmed observations. Filter by `status` (`candidate` vs `confirmed`).

### `POST /documents/confirm-observation`
- **Description:** Patient confirms/edits candidate observation into verified medical observation.
- **Request Body:** `{"observation_id": 1, "is_confirmed": true, "corrected_value": "135", "notes": "Verified against physical paper report"}`

---

## 3. Daily Health Tracking (`/health-readings`)

### `POST /health-readings/`
- **Description:** Record daily vital measurement with mandatory paired validation.
- **Request Body:**
  ```json
  {
    "reading_type": "blood_pressure",
    "date": "2026-10-24",
    "time": "08:30",
    "systolic": 128,
    "diastolic": 82,
    "unit": "mmHg"
  }
  ```
- **Supported types:** `blood_pressure` (requires systolic + diastolic), `blood_glucose` (requires `glucose_context`: fasting, pre_meal, post_meal, bedtime, random), `pulse`, `weight`.

### `GET /health-readings/`
- **Description:** Query chronological readings with date range and reading type filters.

---

## 4. Lifetime Patient Health Memory (`/timeline`)

### `GET /timeline/`
- **Description:** Unified chronological timeline across reports, lab observations, daily vitals, and medication starts/stops. Filter by `start_date`, `end_date`, `category`.

### `POST /timeline/search`
- **Description:** Constrained, SQL-injection-safe structured search over patient history. Translates user questions into validated parameter operations without executing unconstrained raw SQL.

### `POST /timeline/compare`
- **Description:** Side-by-side comparison of 2 or more compatible lab observations with unit compatibility checks and mathematical percentage change.

---

## 5. Medicine Salt Intelligence Engine (`/medicines`)

### `POST /medicines/`
- **Description:** Register medication with brand name, generic name, active salts, strengths, and dosage instructions.
- **Request Body:**
  ```json
  {
    "brand_name": "Amlong-5",
    "generic_name": "Amlodipine Besylate",
    "dosage_form": "tablet",
    "strength": "5 mg",
    "salts": [{"salt_name": "Amlodipine", "strength": "5 mg"}],
    "dosage_instructions": "Take 1 tablet daily in the morning",
    "start_date": "2026-01-15"
  }
  ```

### `GET /medicines/duplicate-check`
- **Description:** Compares active ingredients across all active medications to detect exact duplicate salts and combination overlap.

### `GET /medicines/interactions?simulate_outage=false`
- **Description:** Performs multi-drug interaction check. If `simulate_outage=true`, returns `HTTP 503 Interaction check unavailable` to ensure outage visibility.

---

## 6. Health Trend & Early-Warning System (`/trends`)

### `POST /trends/series`
- **Description:** Compute time-series statistics, absolute change, percentage change, and versioned early-warning rule alerts.
- **Request Body:** `{"metric_name": "blood_pressure", "start_date": "2026-07-01", "end_date": "2026-10-24"}`

---

## 7. Supplement & Nutrient Checker (`/supplements`)

### `POST /supplements/`
- **Description:** Register supplement with multiple constituent nutrients. Supports unknown proprietary blends without assuming zero intake.

### `GET /supplements/intake-analysis`
- **Description:** Aggregates cumulative daily nutrient intake across all products and checks against tolerable upper intake levels (UL).

---

## 8. Medical Report Translator (`/translator`)

### `POST /translator/explain`
- **Description:** Generates bilingual report summary in English (`en`) or Hindi (`hi`). Preserves exact values and provides peer-reviewed PubMed citations and discussion questions.

---

## 9. Symptom Correlator (`/symptoms`)

### `POST /symptoms/`
- **Description:** Record symptom with severity slider (1–10), frequency, and onset timestamps.
- **Request Body:** `{"symptom_name": "Peripheral Edema", "severity": 6, "onset_date": "2026-10-10", "frequency": "intermittent"}`

### `GET /symptoms/correlate/{symptom_id}`
- **Description:** Evaluates temporal proximity against medication starts/changes, pharmacovigilance side effects, non-causal disclaimer, and red-flag escalation.

---

## 10. Medicine Change Impact Tracker (`/medicine-changes`)

### `POST /medicine-changes/record-change`
- **Description:** Logs medication cessation, dose increase, or adjustment.

### `POST /medicine-changes/compare-impact`
- **Description:** Analyzes readings and laboratory tests in window $\pm N$ days of change date.

---

## 11. Prescription Verification (`/prescription-verify`)

### `POST /prescription-verify/analyze`
- **Description:** Cross-compares prescription document vs packaging photo document field-by-field (`active_ingredient`, `strength`, `brand_name`, `frequency`).

---

## 12. Doctor Visit Preparation Generator (`/doctor-visit`)

### `POST /doctor-visit/generate`
- **Description:** Generates consultation agenda with custom patient questions and section toggles.

### `GET /doctor-visit/download-pdf/{summary_id}`
- **Description:** Streams genuine binary PDF created by ReportLab.

---

## 13. AI Confidence & Transparency (`/ai-transparency`)

### `GET /ai-transparency/provenance`
- **Description:** Inspect prompt lineage, models, and 4D uncertainty decomposition.

### `POST /ai-transparency/validate-source`
- **Description:** Validates URL against authorized medical domains whitelist.

---

## 14. Family Health Management (`/family`)

### `POST /family/invite`
- **Description:** Issue single-use invitation token with granular deny-by-default permission booleans.

### `POST /family/accept-invite`
- **Description:** Caregiver accepts token to bind access.

### `PUT /family/permissions`
- **Description:** Update granular capability booleans in real-time.

### `POST /family/revoke/{permission_id}`
- **Description:** Instantly revokes caregiver access.

---

## 15. Healthcare Costs & Duplicate Tests (`/expenses`)

### `POST /expenses/`
- **Description:** Log healthcare expenditure with category, facility, and invoice notes.

### `GET /expenses/summary`
- **Description:** Aggregate category, facility, and monthly cost breakdown.

### `GET /expenses/export-csv`
- **Description:** Stream CSV spreadsheet export of expense ledger.

### `POST /expenses/check-duplicates`
- **Description:** Scan laboratory records for duplicate tests performed within $N$ days (default: 90 days).
