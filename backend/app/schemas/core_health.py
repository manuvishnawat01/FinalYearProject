from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import datetime

# Document & Observation Schemas
class DocumentOut(BaseModel):
    id: int
    patient_id: int
    file_name: str
    file_type: str
    file_size: int
    category: str
    document_date: Optional[str] = None
    upload_date: datetime.datetime
    status: str
    verification_status: str
    ocr_raw_text: Optional[str] = None

    class Config:
        from_attributes = True

class ObservationCreate(BaseModel):
    observation_name: str
    numeric_value: Optional[float] = None
    string_value: Optional[str] = None
    unit: Optional[str] = None
    reference_range_low: Optional[float] = None
    reference_range_high: Optional[float] = None
    reference_range_text: Optional[str] = None
    observation_date: str
    document_id: Optional[int] = None
    method: Optional[str] = "Laboratory Test"
    source_provenance: Optional[str] = "patient_entered"

class ObservationConfirm(BaseModel):
    observation_id: int
    confirmed_name: Optional[str] = None
    confirmed_numeric_value: Optional[float] = None
    confirmed_unit: Optional[str] = None
    confirmed_reference_range_text: Optional[str] = None
    verification_status: str = "confirmed_by_user"

class ObservationOut(BaseModel):
    id: int
    patient_id: int
    document_id: Optional[int] = None
    observation_name: str
    normalized_name: str
    test_category: str
    numeric_value: Optional[float] = None
    string_value: Optional[str] = None
    unit: Optional[str] = None
    reference_range_low: Optional[float] = None
    reference_range_high: Optional[float] = None
    reference_range_text: Optional[str] = None
    interpretation: str
    observation_date: str
    method: Optional[str] = None
    source_provenance: str
    verification_status: str
    confidence_score: float
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Daily Health Reading Schemas
class ReadingCreate(BaseModel):
    reading_type: str  # blood_pressure, blood_glucose, pulse, weight, temperature
    reading_date: str  # YYYY-MM-DD
    measurement_time: Optional[str] = "08:00"
    
    # Blood pressure fields
    systolic: Optional[float] = None
    diastolic: Optional[float] = None
    
    # Blood glucose fields
    glucose_value: Optional[float] = None
    glucose_context: Optional[str] = None  # fasting, pre_meal, post_meal, random, bedtime
    
    pulse: Optional[int] = None
    weight_kg: Optional[float] = None
    notes: Optional[str] = None
    source_provenance: Optional[str] = "patient_entered"

class ReadingOut(BaseModel):
    id: int
    patient_id: int
    reading_type: str
    reading_date: str
    measurement_time: Optional[str] = None
    systolic: Optional[float] = None
    diastolic: Optional[float] = None
    glucose_value: Optional[float] = None
    glucose_context: Optional[str] = None
    pulse: Optional[int] = None
    weight_kg: Optional[float] = None
    notes: Optional[str] = None
    source_provenance: str
    verification_status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Unified Timeline Event Schema
class HealthEventOut(BaseModel):
    id: int
    patient_id: int
    event_date: str
    event_category: str
    title: str
    description: str
    source_type: str
    source_id: Optional[int] = None
    verification_status: str
    metadata_payload: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True
