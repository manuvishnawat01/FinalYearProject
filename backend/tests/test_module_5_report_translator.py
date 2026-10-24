import io
from fastapi import status

def test_medical_report_translator_english_and_hindi(client, patient_token):
    # Upload lab document
    file_content = b"%PDF-1.4 Lab Report with HbA1c"
    files = {"file": ("glycemic_panel.pdf", io.BytesIO(file_content), "application/pdf")}
    upload_res = client.post("/api/v1/documents/upload", files=files, data={"category": "laboratory"}, headers={"Authorization": f"Bearer {patient_token}"})
    doc_id = upload_res.json()["id"]

    # 1. Translate to English
    en_res = client.post(
        "/api/v1/translator/explain",
        json={"document_id": doc_id, "target_language": "en"},
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert en_res.status_code == status.HTTP_200_OK
    en_data = en_res.json()
    assert en_data["target_language"] == "en"
    assert len(en_data["observations"]) >= 1
    # Check value preserved
    first_obs = en_data["observations"][0]
    assert first_obs["actual_value"] is not None
    assert "average blood sugar" in first_obs["plain_language_explanation"]
    assert len(en_data["clinical_discussion_questions"]) >= 1
    assert len(en_data["citations"]) >= 1
    assert "NIH" in en_data["citations"][0]["publisher"] or "National" in en_data["citations"][0]["publisher"]

    # 2. Translate to Hindi
    hi_res = client.post(
        "/api/v1/translator/explain",
        json={"document_id": doc_id, "target_language": "hi"},
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert hi_res.status_code == status.HTTP_200_OK
    hi_data = hi_res.json()
    assert hi_data["target_language"] == "hi"
    # Underlying values preserved
    assert hi_data["observations"][0]["actual_value"] == first_obs["actual_value"]
    # Hindi explanation generated
    assert "रक्त शर्करा" in hi_data["observations"][0]["plain_language_explanation"] or "रिपोर्ट" in hi_data["executive_summary"]
