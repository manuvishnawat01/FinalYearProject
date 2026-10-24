from fastapi import status
from app.models.document import MedicalObservation

def test_expense_tracking_summary_and_csv_export(client, patient_token):
    # 1. Invalid expense (zero or negative) rejected
    fail_res = client.post("/api/v1/expenses/", json={
        "expense_date": "2026-03-01",
        "provider_facility": "Apollo Clinic",
        "category": "laboratory",
        "service_or_test_name": "Lipid Panel",
        "amount": 0.0
    }, headers={"Authorization": f"Bearer {patient_token}"})
    assert fail_res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # 2. Add valid expenses
    client.post("/api/v1/expenses/", json={
        "expense_date": "2026-03-01",
        "provider_facility": "Apex Diagnostics",
        "category": "laboratory",
        "service_or_test_name": "Lipid Profile",
        "amount": 1200.0,
        "currency": "INR"
    }, headers={"Authorization": f"Bearer {patient_token}"})

    client.post("/api/v1/expenses/", json={
        "expense_date": "2026-03-05",
        "provider_facility": "Apollo Pharmacy",
        "category": "medication",
        "service_or_test_name": "Monthly Metformin & Telmisartan",
        "amount": 650.0,
        "currency": "INR"
    }, headers={"Authorization": f"Bearer {patient_token}"})

    # 3. Check summary
    sum_res = client.get("/api/v1/expenses/summary", headers={"Authorization": f"Bearer {patient_token}"})
    assert sum_res.status_code == status.HTTP_200_OK
    summary = sum_res.json()
    assert summary["total_expenses_count"] >= 2
    assert summary["total_expenditure"] >= 1850.0
    assert "Laboratory" in summary["category_breakdown"]
    assert "Medication" in summary["category_breakdown"]

    # 4. Check CSV export
    csv_res = client.get("/api/v1/expenses/export-csv", headers={"Authorization": f"Bearer {patient_token}"})
    assert csv_res.status_code == status.HTTP_200_OK
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Expense ID,Date,Provider / Facility" in csv_res.text
    assert "Apex Diagnostics" in csv_res.text

def test_duplicate_test_detection_with_clinical_disclaimer(client, patient_token, db_session):
    from app.models.user import User
    patient = db_session.query(User).filter(User.email == "testpatient@medichronicle.ai").first()

    # Add two similar tests 15 days apart
    o1 = MedicalObservation(
        patient_id=patient.id,
        observation_name="Lipid Profile",
        normalized_name="lipid_profile",
        numeric_value=195.0,
        unit="mg/dL",
        observation_date="2026-02-01",
        source_provenance="confirmed_by_user",
        verification_status="confirmed_by_user"
    )
    o2 = MedicalObservation(
        patient_id=patient.id,
        observation_name="Lipid Profile",
        normalized_name="lipid_profile",
        numeric_value=188.0,
        unit="mg/dL",
        observation_date="2026-02-16",
        source_provenance="confirmed_by_user",
        verification_status="confirmed_by_user"
    )
    db_session.add_all([o1, o2])
    db_session.commit()

    res = client.post(
        "/api/v1/expenses/check-duplicates",
        json={"review_window_days": 90},
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert res.status_code == status.HTTP_200_OK
    flags = res.json()
    assert len(flags) >= 1
    flag = flags[0]
    assert flag["days_between"] == 15
    assert "within 90-day review window" in flag["flag_reason"]
    # Check clinical disclaimer is present
    assert "Repeated investigations are often clinically indicated" in flag["clinical_disclaimer"]
