from fastapi import status

def test_doctor_visit_summary_and_pdf_generation(client, patient_token, other_patient_token):
    res = client.post(
        "/api/v1/doctor-visit/generate",
        json={
            "appointment_date": "2026-03-25",
            "date_range_start": "2026-01-01",
            "date_range_end": "2026-03-20",
            "clinician_name": "Sarah Rao",
            "specialty": "Endocrinologist",
            "custom_questions": ["Should we adjust my metformin timing?", "Is a repeat HbA1c needed in 3 months?"]
        },
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["clinician_name"] == "Sarah Rao"
    assert "pdf_download_url" in data
    summary_id = data["id"]

    # 2. Download the generated PDF
    dl_res = client.get(f"/api/v1/doctor-visit/download-pdf/{summary_id}", headers={"Authorization": f"Bearer {patient_token}"})
    assert dl_res.status_code == status.HTTP_200_OK
    assert dl_res.headers["content-type"] == "application/pdf"
    assert len(dl_res.content) > 1000  # Genuine binary PDF content

    # 3. Authorization test: other patient cannot access
    unauth_res = client.get(f"/api/v1/doctor-visit/download-pdf/{summary_id}", headers={"Authorization": f"Bearer {other_patient_token}"})
    assert unauth_res.status_code == status.HTTP_403_FORBIDDEN
