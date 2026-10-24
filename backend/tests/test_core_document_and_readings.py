import io
from fastapi import status

def test_document_upload_and_candidate_extraction(client, patient_token):
    file_content = b"%PDF-1.4 Synthetic Lab Report Content: HbA1c 6.8%, Fasting Glucose 118 mg/dL"
    files = {"file": ("test_report.pdf", io.BytesIO(file_content), "application/pdf")}
    data = {"category": "laboratory", "document_date": "2026-03-15"}

    res = client.post(
        "/api/v1/documents/upload",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert res.status_code == status.HTTP_201_CREATED
    doc = res.json()
    assert doc["file_name"] == "test_report.pdf"
    assert doc["status"] == "extracted"

    # Check observations created
    obs_res = client.get("/api/v1/documents/observations/list", headers={"Authorization": f"Bearer {patient_token}"})
    assert obs_res.status_code == status.HTTP_200_OK
    obs_list = obs_res.json()
    assert len(obs_list) >= 1
    first_obs = obs_list[0]
    assert first_obs["verification_status"] == "unverified"
    assert first_obs["source_provenance"] == "extracted_unverified"

def test_observation_user_confirmation(client, patient_token):
    # First upload doc to get observation
    file_content = b"%PDF-1.4 Lab Report"
    files = {"file": ("confirmation_test.pdf", io.BytesIO(file_content), "application/pdf")}
    client.post("/api/v1/documents/upload", files=files, data={"category": "laboratory"}, headers={"Authorization": f"Bearer {patient_token}"})

    obs_list = client.get("/api/v1/documents/observations/list", headers={"Authorization": f"Bearer {patient_token}"}).json()
    obs_id = obs_list[0]["id"]

    # Confirm observation
    conf_res = client.post(
        "/api/v1/documents/confirm-observation",
        json={"observation_id": obs_id, "confirmed_name": "Confirmed HbA1c", "verification_status": "confirmed_by_user"},
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert conf_res.status_code == status.HTTP_200_OK
    confirmed = conf_res.json()
    assert confirmed["verification_status"] == "confirmed_by_user"
    assert confirmed["source_provenance"] == "confirmed_by_user"

def test_daily_health_reading_paired_bp_validation(client, patient_token):
    # 1. Missing diastolic should fail
    fail_res = client.post("/api/v1/health-readings/", json={
        "reading_type": "blood_pressure",
        "reading_date": "2026-03-10",
        "systolic": 120.0
        # diastolic omitted
    }, headers={"Authorization": f"Bearer {patient_token}"})
    assert fail_res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # 2. Systolic <= diastolic should fail
    invalid_res = client.post("/api/v1/health-readings/", json={
        "reading_type": "blood_pressure",
        "reading_date": "2026-03-10",
        "systolic": 80.0,
        "diastolic": 120.0
    }, headers={"Authorization": f"Bearer {patient_token}"})
    assert invalid_res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # 3. Valid paired BP succeeds
    success_res = client.post("/api/v1/health-readings/", json={
        "reading_type": "blood_pressure",
        "reading_date": "2026-03-10",
        "systolic": 125.0,
        "diastolic": 82.0,
        "pulse": 72
    }, headers={"Authorization": f"Bearer {patient_token}"})
    assert success_res.status_code == status.HTTP_201_CREATED
    assert success_res.json()["systolic"] == 125.0
    assert success_res.json()["diastolic"] == 82.0

def test_daily_health_reading_glucose_context_validation(client, patient_token):
    # Missing context should fail
    fail_res = client.post("/api/v1/health-readings/", json={
        "reading_type": "blood_glucose",
        "reading_date": "2026-03-10",
        "glucose_value": 110.0
        # glucose_context omitted
    }, headers={"Authorization": f"Bearer {patient_token}"})
    assert fail_res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Valid contextual glucose succeeds
    success_res = client.post("/api/v1/health-readings/", json={
        "reading_type": "blood_glucose",
        "reading_date": "2026-03-10",
        "glucose_value": 110.0,
        "glucose_context": "fasting"
    }, headers={"Authorization": f"Bearer {patient_token}"})
    assert success_res.status_code == status.HTTP_201_CREATED
    assert success_res.json()["glucose_context"] == "fasting"
