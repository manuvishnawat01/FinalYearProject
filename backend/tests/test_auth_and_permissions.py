import pytest
from fastapi import status

def test_user_registration_success(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "newuser@medichronicle.ai",
        "password": "SecurePassword123!",
        "full_name": "Dr. Sneha Verma",
        "role": "clinician",
        "date_of_birth": "1985-04-12"
    })
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["email"] == "newuser@medichronicle.ai"
    assert data["role"] == "clinician"
    assert "password" not in data

def test_user_registration_duplicate_email(client):
    res = client.post("/api/v1/auth/register", json={
        "email": "testpatient@medichronicle.ai",
        "password": "Password123!",
        "full_name": "Duplicate User"
    })
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in res.json()["detail"]

def test_user_login_success(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "testpatient@medichronicle.ai",
        "password": "Password123!"
    })
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "patient"

def test_user_login_invalid_password(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "testpatient@medichronicle.ai",
        "password": "WrongPassword!"
    })
    assert res.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_current_user_profile(client, patient_token):
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {patient_token}"})
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["email"] == "testpatient@medichronicle.ai"
    assert data["profile"]["blood_group"] == "B+"

def test_unauthenticated_request_rejected(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == status.HTTP_401_UNAUTHORIZED
