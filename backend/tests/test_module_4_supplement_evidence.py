from fastapi import status

def test_supplement_intake_and_unknown_amount_handling(client, patient_token):
    # Supplement 1: Vitamin C known quantity (500 mg, once daily)
    client.post("/api/v1/supplements/", json={
        "product_name": "Pure Vitamin C 500",
        "supplement_type": "vitamin",
        "serving_size": "1 tablet",
        "recorded_frequency": "Once daily",
        "daily_servings_count": 1.0,
        "start_date": "2026-01-01",
        "ingredients": [
            {"ingredient_name": "Ascorbic Acid", "amount_per_serving": 500.0, "unit": "mg", "is_amount_unknown": "false"}
        ]
    }, headers={"Authorization": f"Bearer {patient_token}"})

    # Supplement 2: Vitamin C known quantity (250 mg, once daily)
    client.post("/api/v1/supplements/", json={
        "product_name": "Immune Boost Chewable",
        "supplement_type": "multivitamin",
        "serving_size": "1 chewable",
        "recorded_frequency": "Once daily",
        "daily_servings_count": 1.0,
        "start_date": "2026-01-10",
        "ingredients": [
            {"ingredient_name": "Vitamin C", "amount_per_serving": 250.0, "unit": "mg", "is_amount_unknown": "false"}
        ]
    }, headers={"Authorization": f"Bearer {patient_token}"})

    res = client.get("/api/v1/supplements/intake-analysis", headers={"Authorization": f"Bearer {patient_token}"})
    assert res.status_code == status.HTTP_200_OK
    items = res.json()
    vit_c = next((i for i in items if "Vitamin C" in i["nutrient_name"]), None)
    assert vit_c is not None
    assert vit_c["total_daily_intake"] == 750.0  # 500 + 250
    assert vit_c["has_unknown_quantities"] is False
    assert len(vit_c["products_containing"]) == 2
    assert "collagen synthesis" in vit_c["evidence_benefits"]
    assert "kidney stones" in vit_c["evidence_limitations"]

def test_supplement_unknown_quantity_not_zero(client, patient_token):
    # Add a product with proprietary blend / unknown quantity
    client.post("/api/v1/supplements/", json={
        "product_name": "Herbal Sleep Complex",
        "supplement_type": "herbal",
        "serving_size": "2 capsules",
        "recorded_frequency": "Nightly",
        "daily_servings_count": 1.0,
        "start_date": "2026-02-01",
        "ingredients": [
            {"ingredient_name": "Zinc", "amount_per_serving": None, "unit": "mg", "is_amount_unknown": "true"}
        ]
    }, headers={"Authorization": f"Bearer {patient_token}"})

    res = client.get("/api/v1/supplements/intake-analysis", headers={"Authorization": f"Bearer {patient_token}"})
    assert res.status_code == status.HTTP_200_OK
    zinc_item = next((i for i in res.json() if "Zinc" in i["nutrient_name"]), None)
    assert zinc_item is not None
    # Crucial acceptance criteria: Never treat unknown as zero!
    assert zinc_item["has_unknown_quantities"] is True
    assert zinc_item["total_daily_intake"] is None
