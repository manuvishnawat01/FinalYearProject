from fastapi import status

def test_ai_provenance_and_citation_validation(client, patient_token):
    # 1. Test source validation endpoint for valid known URL
    valid_res = client.post(
        "/api/v1/ai-transparency/validate-source",
        json={"url": "https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test"},
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert valid_res.status_code == status.HTTP_200_OK
    assert valid_res.json()["is_valid"] is True
    assert valid_res.json()["status"] == "verified"

    # 2. Test source validation for fabricated/hallucinated URL
    fake_res = client.post(
        "/api/v1/ai-transparency/validate-source",
        json={"url": "https://fake-hallucinated-medical-reference-site.com/miracle-cure"},
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert fake_res.status_code == status.HTTP_200_OK
    fake_data = fake_res.json()
    assert fake_data["is_valid"] is False
    assert fake_data["status"] == "rejected"
    assert "Rejected to prevent hallucinated evidence" in fake_data["reason"]

    # 3. List provenance logs
    log_res = client.get("/api/v1/ai-transparency/provenance", headers={"Authorization": f"Bearer {patient_token}"})
    assert log_res.status_code == status.HTTP_200_OK
    assert isinstance(log_res.json(), list)
