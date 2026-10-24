from fastapi import status

def test_caregiver_invitation_granular_permissions_and_revocation(client, patient_token, caregiver_token, db_session):
    from app.models.user import User
    patient = db_session.query(User).filter(User.email == "testpatient@medichronicle.ai").first()

    # 1. Patient creates caregiver invitation
    invite_res = client.post(
        "/api/v1/family/invite",
        json={
            "invitee_email": "testcaregiver@medichronicle.ai",
            "invitee_name": "Ananya Sharma",
            "relationship": "Daughter / Primary Caregiver"
        },
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert invite_res.status_code == status.HTTP_201_CREATED
    token = invite_res.json()["invitation_token"]

    # 2. Caregiver accepts invitation
    accept_res = client.post(
        "/api/v1/family/accept-invite",
        json={"token": token},
        headers={"Authorization": f"Bearer {caregiver_token}"}
    )
    assert accept_res.status_code == status.HTTP_200_OK
    perm_id = accept_res.json()["id"]

    # 3. Deny-by-default check: Caregiver attempts to view reports (can_view_reports is False by default)
    denied_res = client.get(f"/api/v1/documents/?patient_id={patient.id}", headers={"Authorization": f"Bearer {caregiver_token}"})
    assert denied_res.status_code == status.HTTP_403_FORBIDDEN
    assert "Access denied: Caregiver grant does not include 'can_view_reports'" in denied_res.json()["detail"]

    # 4. Allowed scope check: Caregiver views readings (can_view_readings is True)
    allowed_res = client.get(f"/api/v1/health-readings/?patient_id={patient.id}", headers={"Authorization": f"Bearer {caregiver_token}"})
    assert allowed_res.status_code == status.HTTP_200_OK

    # 5. Patient grants report permission
    update_res = client.put(
        "/api/v1/family/permissions",
        json={
            "permission_id": perm_id,
            "can_view_reports": True,
            "can_view_readings": True,
            "can_view_medicines": True,
            "can_view_summaries": True,
            "can_view_appointments": True,
            "can_edit": False
        },
        headers={"Authorization": f"Bearer {patient_token}"}
    )
    assert update_res.status_code == status.HTTP_200_OK
    assert update_res.json()["can_view_reports"] is True

    # Now caregiver can view reports
    now_allowed_res = client.get(f"/api/v1/documents/?patient_id={patient.id}", headers={"Authorization": f"Bearer {caregiver_token}"})
    assert now_allowed_res.status_code == status.HTTP_200_OK

    # 6. Immediate Revocation: Patient revokes access
    revoke_res = client.post(f"/api/v1/family/revoke/{perm_id}", headers={"Authorization": f"Bearer {patient_token}"})
    assert revoke_res.status_code == status.HTTP_200_OK

    # 7. Subsequent requests MUST be denied immediately!
    revoked_check_res = client.get(f"/api/v1/health-readings/?patient_id={patient.id}", headers={"Authorization": f"Bearer {caregiver_token}"})
    assert revoked_check_res.status_code == status.HTTP_403_FORBIDDEN

    # 8. Verify audit trail has recorded access and revocation events
    audit_res = client.get(f"/api/v1/family/audit-trail?patient_id={patient.id}", headers={"Authorization": f"Bearer {patient_token}"})
    assert audit_res.status_code == status.HTTP_200_OK
    audit_logs = audit_res.json()
    actions = [l["action"] for l in audit_logs]
    assert any("REVOKE_CAREGIVER_ACCESS" in a for a in actions)
