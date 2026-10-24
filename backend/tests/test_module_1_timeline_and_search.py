from fastapi import status
from app.models.document import MedicalObservation

def test_unified_timeline_chronological_order(client, patient_token, db_session):
    from app.models.user import User
    from app.services.timeline_service import TimelineService
    patient = db_session.query(User).filter(User.email == "testpatient@medichronicle.ai").first()

    TimelineService.record_event(db_session, patient.id, "2026-01-10", "report", "Lab Report Jan", "Diagnostic", "doc", 1)
    TimelineService.record_event(db_session, patient.id, "2026-03-15", "daily_reading", "BP Reading", "120/80", "reading", 1)
    TimelineService.record_event(db_session, patient.id, "2026-02-05", "symptom", "Headache", "Mild", "symptom", 1)

    res = client.get("/api/v1/timeline/", headers={"Authorization": f"Bearer {patient_token}"})
    assert res.status_code == status.HTTP_200_OK
    events = res.json()
    assert len(events) >= 3
    # Check descending chronological order
    dates = [e["event_date"] for e in events]
    assert dates == sorted(dates, reverse=True)

def test_search_known_and_nonexistent_test(client, patient_token, db_session):
    from app.models.user import User
    patient = db_session.query(User).filter(User.email == "testpatient@medichronicle.ai").first()

    obs = MedicalObservation(
        patient_id=patient.id,
        observation_name="HbA1c",
        normalized_name="hba1c",
        numeric_value=6.9,
        unit="%",
        observation_date="2026-02-10",
        source_provenance="confirmed_by_user",
        verification_status="confirmed_by_user"
    )
    db_session.add(obs)
    db_session.commit()

    # Search for known test
    res = client.post(
        "/api/v1/timeline/search",
        json={"query": "HbA1c"},
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["total_matches"] >= 1
    assert any("hba1c" in obs["name"].lower() for obs in data["observations"])

    # Search for non-existent test
    none_res = client.post(
        "/api/v1/timeline/search",
        json={"query": "NonExistentZebraInvestigation"},
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert none_res.status_code == status.HTTP_200_OK
    none_data = none_res.json()
    assert none_data["total_matches"] == 0
    assert "No records matching" in none_data["message"]
    assert len(none_data["observations"]) == 0

def test_observation_comparison_with_change_math(client, patient_token, db_session):
    # Retrieve user id
    from app.models.user import User
    patient = db_session.query(User).filter(User.email == "testpatient@medichronicle.ai").first()

    obs1 = MedicalObservation(
        patient_id=patient.id,
        observation_name="HbA1c",
        normalized_name="hba1c",
        numeric_value=7.0,
        unit="%",
        observation_date="2026-01-10",
        source_provenance="confirmed_by_user",
        verification_status="confirmed_by_user"
    )
    obs2 = MedicalObservation(
        patient_id=patient.id,
        observation_name="HbA1c",
        normalized_name="hba1c",
        numeric_value=6.3,
        unit="%",
        observation_date="2026-03-10",
        source_provenance="confirmed_by_user",
        verification_status="confirmed_by_user"
    )
    db_session.add_all([obs1, obs2])
    db_session.commit()

    res = client.post(
        "/api/v1/timeline/compare",
        json={"observation_ids": [obs1.id, obs2.id]},
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["is_compatible"] is True
    assert data["absolute_change"] == -0.7
    assert data["percentage_change"] == -10.0
    assert "Baseline: 7.0 %" in data["calculation_explanation"]

def test_observation_comparison_zero_baseline(client, patient_token, db_session):
    from app.models.user import User
    patient = db_session.query(User).filter(User.email == "testpatient@medichronicle.ai").first()

    obs1 = MedicalObservation(
        patient_id=patient.id,
        observation_name="Coronary Calcium",
        normalized_name="calcium_score",
        numeric_value=0.0,
        unit="Agatston",
        observation_date="2025-01-10",
        source_provenance="confirmed_by_user",
        verification_status="confirmed_by_user"
    )
    obs2 = MedicalObservation(
        patient_id=patient.id,
        observation_name="Coronary Calcium",
        normalized_name="calcium_score",
        numeric_value=15.0,
        unit="Agatston",
        observation_date="2026-01-10",
        source_provenance="confirmed_by_user",
        verification_status="confirmed_by_user"
    )
    db_session.add_all([obs1, obs2])
    db_session.commit()

    res = client.post(
        "/api/v1/timeline/compare",
        json={"observation_ids": [obs1.id, obs2.id]},
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["is_compatible"] is True
    assert data["absolute_change"] == 15.0
    assert data["percentage_change"] is None  # Undefined when baseline is zero
    assert "baseline value is zero" in data["calculation_explanation"]

def test_cross_patient_timeline_access_denied(client, other_patient_token, db_session):
    from app.models.user import User
    patient = db_session.query(User).filter(User.email == "testpatient@medichronicle.ai").first()

    # Attempt to access patient 1's timeline with other patient's token
    res = client.get(f"/api/v1/timeline/?patient_id={patient.id}", headers={"Authorization": f"Bearer {other_patient_token}"})
    assert res.status_code == status.HTTP_403_FORBIDDEN
