from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    full_name: str

class TokenData(BaseModel):
    sub: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "patient"
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PatientProfileOut(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    allergies: Optional[List[str]] = []
    chronic_conditions: Optional[List[str]] = []

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime.datetime
    profile: Optional[PatientProfileOut] = None

    class Config:
        from_attributes = True
