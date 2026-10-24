from fastapi import status

def test_add_medicine_and_combination(client, patient_token):
    # Single ingredient medicine
    res1 = client.post("/api/v1/medicines/", json={
        "brand_name": "Glucophage",
        "generic_name": "Metformin",
        "dosage_form": "Tablet",
        "prescribed_dosage": "500 mg",
        "frequency": "Twice daily",
        "start_date": "2026-01-01",
        "ingredients": [
            {"ingredient_name": "Metformin Hydrochloride", "strength": 500.0, "strength_unit": "mg"}
        ]
    }, headers={"Authorization": f"Bearer {patient_token}"})
    assert res1.status_code == status.HTTP_201_CREATED
    assert len(res1.json()["ingredients"]) == 1

    # Combination medicine
    res2 = client.post("/api/v1/medicines/", json={
        "brand_name": "Telma-H",
        "generic_name": "Telmisartan + Hydrochlorothiazide",
        "dosage_form": "Tablet",
        "prescribed_dosage": "1 tablet",
        "frequency": "Once daily in morning",
        "start_date": "2026-02-01",
        "ingredients": [
            {"ingredient_name": "Telmisartan", "strength": 40.0, "strength_unit": "mg"},
            {"ingredient_name": "Hydrochlorothiazide", "strength": 12.5, "strength_unit": "mg"}
        ]
    }, headers={"Authorization": f"Bearer {patient_token}"})
    assert res2.status_code == status.HTTP_201_CREATED
    data2 = res2.json()
    assert len(data2["ingredients"]) == 2

def test_duplicate_salt_detection(client, patient_token):
    # Add two differently branded products containing Paracetamol
    client.post("/api/v1/medicines/", json={
        "brand_name": "Dolo 650",
        "generic_name": "Paracetamol",
        "start_date": "2026-01-01",
        "ingredients": [{"ingredient_name": "Paracetamol", "strength": 650.0, "strength_unit": "mg"}]
    }, headers={"Authorization": f"Bearer {patient_token}"})

    client.post("/api/v1/medicines/", json={
        "brand_name": "Crocin Advance",
        "generic_name": "Paracetamol",
        "start_date": "2026-01-15",
        "ingredients": [{"ingredient_name": "Paracetamol", "strength": 500.0, "strength_unit": "mg"}]
    }, headers={"Authorization": f"Bearer {patient_token}"})

    dup_res = client.get("/api/v1/medicines/duplicate-check", headers={"Authorization": f"Bearer {patient_token}"})
    assert dup_res.status_code == status.HTTP_200_OK
    alerts = dup_res.json()
    assert len(alerts) >= 1
    paracetamol_alert = next((a for a in alerts if "paracetamol" in a["normalized_ingredient"]), None)
    assert paracetamol_alert is not None
    assert paracetamol_alert["warning_type"] in ["exact_duplicate_ingredient", "combination_overlap"]
    assert "Dolo 650" in [paracetamol_alert["first_medication"], paracetamol_alert["second_medication"]]
    assert "Crocin Advance" in [paracetamol_alert["first_medication"], paracetamol_alert["second_medication"]]

def test_interaction_provider_and_outage_simulation(client, patient_token):
    # Standard check: available
    res = client.get("/api/v1/medicines/interactions", headers={"Authorization": f"Bearer {patient_token}"})
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["interaction_provider_status"] == "available"
    assert "National Library of Medicine" in data["evidence_source"]

    # Outage check: simulated outage must return 'unavailable'
    outage_res = client.get("/api/v1/medicines/interactions?simulate_outage=true", headers={"Authorization": f"Bearer {patient_token}"})
    assert outage_res.status_code == status.HTTP_200_OK
    outage_data = outage_res.json()
    assert outage_data["interaction_provider_status"] == "unavailable"
    assert outage_data["evidence_source"] == "Unavailable"
    # Ensure outage does not falsely claim "No interactions found"
    assert len(outage_data["interactions_found"]) == 0
