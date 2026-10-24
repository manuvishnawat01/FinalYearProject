import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.core.security import create_access_token, hash_password
from app.models import (
    User, PatientProfile, MedicalDocument, MedicalObservation,
    DailyHealthReading, HealthEvent, Medication, MedicationIngredient,
    Supplement, SupplementIngredient, Symptom, ExternalMedicalSource,
    CaregiverPermission, MedicalExpense
)

# Use a test SQLite database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_medichronicle.db"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    # Seed base test data
    db = TestingSessionLocal()
    
    # 1. External sources
    src1 = ExternalMedicalSource(
        source_title="The A1C Test & Diabetes Guidelines",
        publisher="NIH",
        url_or_identifier="https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test",
        evidence_summary="The glycated hemoglobin test reflects average plasma glucose concentration over approximately 8-12 weeks.",
        is_active=True
    )
    src2 = ExternalMedicalSource(
        source_title="KDIGO Clinical Practice Guideline for Acute Kidney Injury",
        publisher="KDIGO",
        url_or_identifier="https://medlineplus.gov/lab-tests/creatinine-test/",
        evidence_summary="Serum creatinine is filtered by glomeruli; elevations suggest impaired renal clearance.",
        is_active=True
    )
    db.add_all([src1, src2])

    # 2. Test Patient
    patient = User(
        email="testpatient@medichronicle.ai",
        hashed_password=hash_password("Password123!"),
        full_name="Rajesh Sharma",
        role="patient",
        is_active=True
    )
    db.add(patient)
    db.flush()

    profile = PatientProfile(
        user_id=patient.id,
        date_of_birth="1980-01-01",
        blood_group="B+",
        allergies=["Penicillin"]
    )
    db.add(profile)

    # 3. Test Caregiver
    caregiver = User(
        email="testcaregiver@medichronicle.ai",
        hashed_password=hash_password("Password123!"),
        full_name="Ananya Sharma",
        role="caregiver",
        is_active=True
    )
    db.add(caregiver)
    db.flush()

    # 4. Other Patient
    other_patient = User(
        email="otherpatient@medichronicle.ai",
        hashed_password=hash_password("Password123!"),
        full_name="Vikram Patel",
        role="patient",
        is_active=True
    )
    db.add(other_patient)
    db.flush()

    # Grant caregiver permission: readings ONLY (reports denied by default)
    perm = CaregiverPermission(
        patient_id=patient.id,
        caregiver_id=caregiver.id,
        can_view_reports=False,
        can_view_readings=True,
        can_view_medicines=True,
        can_view_summaries=False,
        can_view_appointments=True,
        can_edit=False,
        is_active=True
    )
    db.add(perm)
    db.commit()
    db.close()

    yield

    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def patient_token(db_session):
    user = db_session.query(User).filter(User.email == "testpatient@medichronicle.ai").first()
    return create_access_token(data={"sub": str(user.id), "role": user.role, "email": user.email})

@pytest.fixture
def caregiver_token(db_session):
    user = db_session.query(User).filter(User.email == "testcaregiver@medichronicle.ai").first()
    return create_access_token(data={"sub": str(user.id), "role": user.role, "email": user.email})

@pytest.fixture
def other_patient_token(db_session):
    user = db_session.query(User).filter(User.email == "otherpatient@medichronicle.ai").first()
    return create_access_token(data={"sub": str(user.id), "role": user.role, "email": user.email})
