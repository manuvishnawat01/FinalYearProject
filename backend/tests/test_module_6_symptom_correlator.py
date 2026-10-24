from fastapi import status

def test_symptom_recording_and_temporal_correlation(client, patient_token):
    # 1. Start a medicine
    client.post("/api/v1/medicines/", json={
        "brand_name": "Zestril",
        "generic_name": "Lisinopril",
        "start_date": "2026-02-01",
        "ingredients": [{"ingredient_name": "Lisinopril", "strength": 10.0, "strength_unit": "mg"}]
    }, headers={"Authorization": f"Bearer {patient_token}"})

    # 2. Record symptom starting 15 days later
    sym_res = client.post("/api/v1/symptoms/", json={
        "symptom_name": "Dry Cough",
        "description": "Tickling dry cough at night",
        "onset_date": "2026-02-16",
        "severity": 4,
        "is_ongoing": True
    }, headers={"Authorization": f"Bearer {patient_token}"})
    assert sym_res.status_code == status.HTTP_201_CREATED
    sym_id = sym_res.json()["id"]

    # 3. Correlate
    corr_res = client.get(f"/api/v1/symptoms/correlate/{sym_id}", headers={"Authorization": f"Bearer {patient_token}"})
    assert corr_res.status_code == status.HTTP_200_OK
    data = corr_res.json()
    assert len(data["temporal_events"]) >= 1
    # Check non-causal explanation
    assert "does NOT establish that the medication caused the symptom" in data["non_causal_explanation"]
    # Check known adverse effect reference found
    assert any("dry cough" in eff["reported_adverse_effect"] for eff in data["known_side_effects"])

def test_symptom_emergency_red_flag_trigger(client, patient_token):
    # Log crushing chest pain (cardiac red-flag rule)
    res = client.post("/api/v1/symptoms/", json={
        "symptom_name": "Severe Crushing Chest Pain",
        "description": "Radiating to left arm with sweating",
        "onset_date": "2026-03-01",
        "severity": 9,
        "is_ongoing": True
    }, headers={"Authorization": f"Bearer {patient_token}"})
    sym_id = res.json()["id"]

    corr_res = client.get(f"/api/v1/symptoms/correlate/{sym_id}", headers={"Authorization": f"Bearer {patient_token}"})
    assert corr_res.status_code == status.HTTP_200_OK
    data = corr_res.json()
    assert data["red_flag_alert"] is not None
    assert data["red_flag_alert"]["is_critical"] is True
    assert "Cardiac Emergency" in data["red_flag_alert"]["title"]
    assert "Call emergency medical services" in data["red_flag_alert"]["emergency_action"]
