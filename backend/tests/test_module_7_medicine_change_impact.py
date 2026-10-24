from fastapi import status

def test_medicine_change_impact_tracker(client, patient_token):
    # 1. Add medication
    med_res = client.post("/api/v1/medicines/", json={
        "brand_name": "Atorva 20",
        "generic_name": "Atorvastatin",
        "start_date": "2025-12-01",
        "prescribed_dosage": "20 mg",
        "ingredients": [{"ingredient_name": "Atorvastatin Calcium", "strength": 20.0, "strength_unit": "mg"}]
    }, headers={"Authorization": f"Bearer {patient_token}"})
    med_id = med_res.json()["id"]

    # 2. Record dosage change
    change_res = client.post("/api/v1/medicine-changes/record-change", json={
        "medication_id": med_id,
        "event_type": "changed",
        "event_date": "2026-02-01",
        "new_dosage": "40 mg",
        "recorded_reason": "Lipid target optimization"
    }, headers={"Authorization": f"Bearer {patient_token}"})
    assert change_res.status_code == status.HTTP_201_CREATED

    # 3. Check history was preserved
    hist_res = client.get("/api/v1/medicine-changes/history", headers={"Authorization": f"Bearer {patient_token}"})
    assert hist_res.status_code == status.HTTP_200_OK
    history = hist_res.json()
    assert len(history) >= 1
    assert history[0]["event_type"] == "changed"
    assert history[0]["previous_data"]["prescribed_dosage"] == "20 mg"
    assert history[0]["new_data"]["prescribed_dosage"] == "40 mg"

    # 4. Compare impact across 30-day window
    comp_res = client.post("/api/v1/medicine-changes/compare-impact", json={
        "medication_id": med_id,
        "change_date": "2026-02-01",
        "window_days": 30
    }, headers={"Authorization": f"Bearer {patient_token}"})
    assert comp_res.status_code == status.HTTP_200_OK
    comp_data = comp_res.json()
    assert comp_data["medication_name"] == "Atorva 20"
    assert "do not independently demonstrate drug efficacy" in comp_data["summary_text"]
    assert len(comp_data["clinical_discussion_prompts"]) >= 1
