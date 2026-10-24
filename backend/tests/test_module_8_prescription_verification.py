import io
from fastapi import status

def test_prescription_and_package_verification(client, patient_token):
    # Upload prescription
    rx_files = {"file": ("rx_doctor_order.pdf", io.BytesIO(b"%PDF-1.4 Rx: Metformin 500mg"), "application/pdf")}
    rx_res = client.post("/api/v1/documents/upload", files=rx_files, data={"category": "prescription"}, headers={"Authorization": f"Bearer {patient_token}"})
    rx_id = rx_res.json()["id"]

    # Upload packaging image
    pkg_files = {"file": ("package_label.jpg", io.BytesIO(b"JFIF Packaging Metformin 500mg"), "image/jpeg")}
    pkg_res = client.post("/api/v1/documents/upload", files=pkg_files, data={"category": "packaging"}, headers={"Authorization": f"Bearer {patient_token}"})
    pkg_id = pkg_res.json()["id"]

    # Analyze
    verify_res = client.post(
        "/api/v1/prescription-verify/analyze",
        json={"prescription_doc_id": rx_id, "package_doc_id": pkg_id},
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert verify_res.status_code == status.HTTP_200_OK
    data = verify_res.json()
    assert len(data["discrepancies"]) >= 3
    assert "chemical purity" in data["disclaimer"]
    assert "overall_status" in data
