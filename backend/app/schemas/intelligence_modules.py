from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
import datetime

# --- Module 1: Lifetime Patient Health Memory ---
class TimelineFilter(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    event_category: Optional[str] = None
    source_type: Optional[str] = None
    verification_status: Optional[str] = None

class TimelineSearchRequest(BaseModel):
    query: str
    target_patient_id: Optional[int] = None

class ObservationCompareRequest(BaseModel):
    observation_ids: List[int]

class ObservationComparisonItem(BaseModel):
    observation_id: int
    observation_name: str
    date: str
    value: Optional[float] = None
    string_value: Optional[str] = None
    unit: Optional[str] = None
    reference_range_text: Optional[str] = None
    source_document: Optional[str] = None
    verification_status: str

class ObservationCompareResult(BaseModel):
    test_name: str
    is_compatible: bool
    compatibility_reason: str
    items: List[ObservationComparisonItem]
    absolute_change: Optional[float] = None
    percentage_change: Optional[float] = None
    calculation_explanation: Optional[str] = None

# --- Module 2: Medicine Salt Intelligence Engine ---
class MedicationIngredientCreate(BaseModel):
    ingredient_name: str
    strength: Optional[float] = None
    strength_unit: Optional[str] = "mg"

class MedicationCreate(BaseModel):
    brand_name: str
    generic_name: Optional[str] = None
    dosage_form: Optional[str] = "tablet"
    route: Optional[str] = "oral"
    prescribed_dosage: Optional[str] = "1 tablet"
    frequency: Optional[str] = "Once daily"
    timing_instructions: Optional[str] = "After breakfast"
    start_date: str
    end_date: Optional[str] = None
    prescriber_name: Optional[str] = None
    reason_for_use: Optional[str] = None
    source: Optional[str] = "manual_entry"
    verification_status: Optional[str] = "unverified"
    notes: Optional[str] = None
    ingredients: List[MedicationIngredientCreate]

class MedicationIngredientOut(BaseModel):
    id: int
    ingredient_name: str
    normalized_ingredient_name: str
    strength: Optional[float] = None
    strength_unit: Optional[str] = None

    class Config:
        from_attributes = True

class MedicationOut(BaseModel):
    id: int
    patient_id: int
    brand_name: str
    generic_name: Optional[str] = None
    dosage_form: Optional[str] = None
    route: Optional[str] = None
    prescribed_dosage: Optional[str] = None
    frequency: Optional[str] = None
    timing_instructions: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    status: str
    prescriber_name: Optional[str] = None
    reason_for_use: Optional[str] = None
    source: str
    verification_status: str
    notes: Optional[str] = None
    created_at: datetime.datetime
    ingredients: List[MedicationIngredientOut] = []

    class Config:
        from_attributes = True

class DuplicateSaltAlert(BaseModel):
    active_ingredient: str
    normalized_ingredient: str
    first_medication: str
    first_med_id: int
    first_strength: Optional[str] = None
    second_medication: str
    second_med_id: int
    second_strength: Optional[str] = None
    warning_type: str  # exact_duplicate_ingredient, combination_overlap
    clinical_note: str

class DrugInteractionResult(BaseModel):
    interaction_provider_status: str  # available, unavailable
    drugs_checked: List[str]
    interactions_found: List[Dict[str, Any]]
    evidence_source: str
    disclaimer: str
    check_timestamp: str

# --- Module 3: Health Trend and Early-Warning System ---
class TrendSeriesRequest(BaseModel):
    metric_name: str  # "blood_pressure", "blood_glucose", "hba1c", "creatinine", etc.
    glucose_context: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class TrendDataPoint(BaseModel):
    date: str
    time: Optional[str] = None
    value: Optional[float] = None
    systolic: Optional[float] = None
    diastolic: Optional[float] = None
    unit: Optional[str] = None
    reference_low: Optional[float] = None
    reference_high: Optional[float] = None
    context: Optional[str] = None
    source: str

class TrendSeriesResult(BaseModel):
    metric: str
    data_points: List[TrendDataPoint]
    minimum_value: Optional[float] = None
    maximum_value: Optional[float] = None
    absolute_change: Optional[float] = None
    percentage_change: Optional[float] = None
    percentage_change_explanation: str
    trend_summary: str
    early_warnings: List[Dict[str, Any]]

# --- Module 4: Supplement and Nutrient Evidence Checker ---
class SupplementIngredientCreate(BaseModel):
    ingredient_name: str
    amount_per_serving: Optional[float] = None
    unit: Optional[str] = "mg"
    is_amount_unknown: Optional[str] = "false"

class SupplementCreate(BaseModel):
    product_name: str
    brand: Optional[str] = None
    supplement_type: Optional[str] = "multivitamin"
    serving_size: Optional[str] = "1 capsule"
    recorded_frequency: Optional[str] = "Once daily"
    daily_servings_count: Optional[float] = 1.0
    start_date: str
    end_date: Optional[str] = None
    source: Optional[str] = "packaging"
    verification_status: Optional[str] = "unverified"
    notes: Optional[str] = None
    ingredients: List[SupplementIngredientCreate]

class SupplementIngredientOut(BaseModel):
    id: int
    ingredient_name: str
    normalized_name: str
    amount_per_serving: Optional[float] = None
    unit: Optional[str] = None
    is_amount_unknown: str

    class Config:
        from_attributes = True

class SupplementOut(BaseModel):
    id: int
    patient_id: int
    product_name: str
    brand: Optional[str] = None
    supplement_type: str
    serving_size: Optional[str] = None
    recorded_frequency: Optional[str] = None
    daily_servings_count: Optional[float] = 1.0
    start_date: str
    end_date: Optional[str] = None
    status: str
    verification_status: str
    notes: Optional[str] = None
    created_at: datetime.datetime
    ingredients: List[SupplementIngredientOut] = []

    class Config:
        from_attributes = True

class NutrientIntakeItem(BaseModel):
    nutrient_name: str
    total_daily_intake: Optional[float] = None
    unit: Optional[str] = None
    has_unknown_quantities: bool
    products_containing: List[str]
    evidence_benefits: str
    evidence_limitations: str
    safety_concerns: str
    tolerable_upper_intake_note: Optional[str] = None

# --- Module 5: Medical Report Translator with Evidence ---
class TranslateReportRequest(BaseModel):
    document_id: int
    target_language: str = "en"  # en or hi

class TranslatedObservationItem(BaseModel):
    test_name: str
    actual_value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_out_of_range: bool
    plain_language_explanation: str
    evidence_claim_source: str

class ReportExplanationOut(BaseModel):
    document_id: int
    document_name: str
    document_date: Optional[str] = None
    target_language: str
    executive_summary: str
    observations: List[TranslatedObservationItem]
    clinical_discussion_questions: List[str]
    citations: List[Dict[str, Any]]
    limitations_and_uncertainties: str

# --- Module 6: Side-Effect and Symptom Timeline Correlator ---
class SymptomCreate(BaseModel):
    symptom_name: str
    description: Optional[str] = None
    onset_date: str
    onset_time: Optional[str] = "12:00"
    end_date: Optional[str] = None
    end_time: Optional[str] = None
    is_ongoing: Optional[bool] = False
    severity: int = Field(ge=1, le=10)
    duration_hours: Optional[float] = None
    frequency: Optional[str] = "intermittent"
    associated_measurement_type: Optional[str] = None
    associated_measurement_value: Optional[str] = None
    notes: Optional[str] = None

class SymptomOut(BaseModel):
    id: int
    patient_id: int
    symptom_name: str
    description: Optional[str] = None
    onset_date: str
    onset_time: Optional[str] = None
    end_date: Optional[str] = None
    end_time: Optional[str] = None
    is_ongoing: bool
    severity: int
    duration_hours: Optional[float] = None
    frequency: Optional[str] = None
    associated_measurement_type: Optional[str] = None
    associated_measurement_value: Optional[str] = None
    notes: Optional[str] = None
    source_provenance: str
    verification_status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class SymptomCorrelationResult(BaseModel):
    symptom: SymptomOut
    temporal_events: List[Dict[str, Any]]  # medications started/changed within window
    known_side_effects: List[Dict[str, Any]]
    non_causal_explanation: str
    red_flag_alert: Optional[Dict[str, Any]] = None

# --- Module 7: Medicine Change Impact Tracker ---
class MedicineChangeCreate(BaseModel):
    medication_id: int
    event_type: str  # stopped, changed, corrected
    event_date: str
    new_instructions: Optional[str] = None
    new_dosage: Optional[str] = None
    recorded_reason: Optional[str] = None

class MedicineChangeComparisonRequest(BaseModel):
    medication_id: int
    change_date: str
    window_days: int = 30

class MedicineChangeReportOut(BaseModel):
    medication_name: str
    change_event: Dict[str, Any]
    window_days: int
    pre_change_readings: List[Dict[str, Any]]
    post_change_readings: List[Dict[str, Any]]
    pre_change_labs: List[Dict[str, Any]]
    post_change_labs: List[Dict[str, Any]]
    summary_text: str
    clinical_discussion_prompts: List[str]

# --- Module 8: Prescription-to-Actual-Medicine Verification ---
class PrescriptionVerifyRequest(BaseModel):
    prescription_doc_id: int
    package_doc_id: int

class FieldDiscrepancyItem(BaseModel):
    field_name: str
    prescription_value: str
    packaging_value: str
    status: str  # match, potential_discrepancy, missing_on_one_side, uncertain
    explanation: str

class PrescriptionVerifyResult(BaseModel):
    id: int
    overall_status: str
    discrepancy_count: int
    discrepancies: List[FieldDiscrepancyItem]
    disclaimer: str
    created_at: datetime.datetime

# --- Module 9: Doctor Visit Preparation Generator ---
class DoctorVisitGenerateRequest(BaseModel):
    appointment_date: Optional[str] = None
    date_range_start: str
    date_range_end: str
    clinician_name: Optional[str] = None
    specialty: Optional[str] = "General Physician"
    include_allergies: bool = True
    include_medications: bool = True
    include_supplements: bool = True
    include_readings: bool = True
    include_labs: bool = True
    include_symptoms: bool = True
    custom_questions: List[str] = []

class DoctorVisitSummaryOut(BaseModel):
    id: int
    appointment_date: Optional[str] = None
    date_range: str
    clinician_name: Optional[str] = None
    specialty: Optional[str] = None
    summary_content: Dict[str, Any]
    custom_questions: List[str]
    pdf_download_url: str
    created_at: datetime.datetime

# --- Module 10: AI Confidence and Evidence Transparency ---
class AIProvenanceOut(BaseModel):
    id: int
    patient_id: int
    module_name: str
    request_context: str
    model_identifier: str
    prompt_version: str
    records_considered: List[Dict[str, Any]]
    cited_sources: List[Dict[str, Any]]
    extraction_uncertainty: float
    identity_uncertainty: float
    evidence_uncertainty: float
    interpretation_uncertainty: float
    validation_status: str
    explanation_text: str
    limitations_notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Module 11: Family Health Management with Permission Controls ---
class FamilyInviteCreate(BaseModel):
    invitee_email: EmailStr
    invitee_name: str
    relationship: str = "Family Member"
    can_view_reports: bool = False
    can_view_readings: bool = False
    can_view_medicines: bool = False
    can_view_summaries: bool = False
    can_view_appointments: bool = False
    can_edit: bool = False

class FamilyInviteOut(BaseModel):
    id: int
    patient_id: int
    invitee_email: str
    invitee_name: str
    relationship: str
    invitation_token: str
    status: str
    expires_at: datetime.datetime
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class CaregiverPermissionOut(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    caregiver_id: int
    caregiver_name: str
    caregiver_email: str
    can_view_reports: bool
    can_view_readings: bool
    can_view_medicines: bool
    can_view_summaries: bool
    can_view_appointments: bool
    can_edit: bool
    is_active: bool
    granted_at: datetime.datetime
    revoked_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class CaregiverPermissionUpdate(BaseModel):
    permission_id: int
    can_view_reports: bool
    can_view_readings: bool
    can_view_medicines: bool
    can_view_summaries: bool
    can_view_appointments: bool
    can_edit: bool

# --- Module 12: Healthcare Cost and Duplicate-Test Tracker ---
class ExpenseCreate(BaseModel):
    expense_date: str
    provider_facility: str
    category: str  # laboratory, consultation, medication, radiology, procedure, other
    service_or_test_name: str
    amount: float
    currency: Optional[str] = "INR"
    related_report_id: Optional[int] = None
    payment_status: Optional[str] = "paid"
    notes: Optional[str] = None

class ExpenseOut(BaseModel):
    id: int
    patient_id: int
    expense_date: str
    provider_facility: str
    category: str
    service_or_test_name: str
    amount: float
    currency: str
    related_report_id: Optional[int] = None
    payment_status: str
    verification_status: str
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ExpenseSummaryOut(BaseModel):
    total_expenses_count: int
    total_expenditure: float
    currency: str
    category_breakdown: Dict[str, float]
    provider_breakdown: Dict[str, float]
    monthly_breakdown: Dict[str, float]

class DuplicateTestCheckRequest(BaseModel):
    review_window_days: int = 90

class DuplicateTestFlagOut(BaseModel):
    id: int
    current_test_name: str
    previous_test_name: str
    current_test_date: str
    previous_test_date: str
    days_between: int
    review_window_days: int
    flag_reason: str
    match_type: str
    status: str
    clinical_disclaimer: str
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True
