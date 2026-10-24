from fastapi import status

def test_blood_pressure_trend_and_early_warning(client, patient_token):
    # Add a high BP reading to trigger Stage 2 Hypertension Warning
    client.post("/api/v1/health-readings/", json={
        "reading_type": "blood_pressure",
        "reading_date": "2026-03-01",
        "systolic": 135.0,
        "diastolic": 85.0
    }, headers={"Authorization": f"Bearer {patient_token}"})

    client.post("/api/v1/health-readings/", json={
        "reading_type": "blood_pressure",
        "reading_date": "2026-03-05",
        "systolic": 145.0,
        "diastolic": 95.0
    }, headers={"Authorization": f"Bearer {patient_token}"})

    res = client.post("/api/v1/trends/series", json={"metric_name": "blood_pressure"}, headers={"Authorization": f"Bearer {patient_token}"})
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["metric"] == "blood_pressure"
    assert len(data["data_points"]) >= 2
    # Verify systolic and diastolic are paired
    assert data["data_points"][-1]["systolic"] == 145.0
    assert data["data_points"][-1]["diastolic"] == 95.0

    # Verify Stage 2 warning
    assert len(data["early_warnings"]) >= 1
    w = data["early_warnings"][0]
    assert "BP-" in w["rule_id"]
    assert "AHA/ACC" in w["reference_source"]

def test_glucose_trend_and_hypo_early_warning(client, patient_token):
    # Add a low glucose reading (<70 mg/dL) to trigger Hypoglycemia critical alert
    client.post("/api/v1/health-readings/", json={
        "reading_type": "blood_glucose",
        "reading_date": "2026-03-08",
        "glucose_value": 62.0,
        "glucose_context": "fasting"
    }, headers={"Authorization": f"Bearer {patient_token}"})

    res = client.post("/api/v1/trends/series", json={"metric_name": "blood_glucose", "glucose_context": "fasting"}, headers={"Authorization": f"Bearer {patient_token}"})
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["data_points"][-1]["value"] == 62.0

    hypo_w = next((w for w in data["early_warnings"] if w["rule_id"] == "GLU-HYPO-001"), None)
    assert hypo_w is not None
    assert hypo_w["severity"] == "critical"
    assert "Hypoglycemia" in hypo_w["title"]
