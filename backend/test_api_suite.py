import sys
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

def run_all_tests():
    print("=" * 60)
    print("RUNNING ELDERCARE AI COMPREHENSIVE BACKEND TEST SUITE")
    print("=" * 60)

    Base.metadata.create_all(bind=engine)

    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("[PASS] 1. Health check endpoint")

        # 2. Reset / Seed demo data
        res = client.post("/api/demo/reset")
        assert res.status_code == 200, f"Demo reset failed: {res.text}"
        print("[PASS] 2. Demo data seeded")

        # 3. Test Elderly Demo Login
        res = client.post("/api/auth/demo-login/elderly")
        assert res.status_code == 200, f"Elderly login failed: {res.text}"
        elderly_data = res.json()
        elderly_token = elderly_data["access_token"]
        elderly_headers = {"Authorization": f"Bearer {elderly_token}"}
        print(f"[PASS] 3. Elderly demo login (User: {elderly_data['user']['name']})")

        # 4. Test Caregiver Demo Login
        res = client.post("/api/auth/demo-login/caregiver")
        assert res.status_code == 200, f"Caregiver login failed: {res.text}"
        caregiver_data = res.json()
        caregiver_token = caregiver_data["access_token"]
        caregiver_headers = {"Authorization": f"Bearer {caregiver_token}"}
        print(f"[PASS] 4. Caregiver demo login (User: {caregiver_data['user']['name']})")

        # 5. Test Auth /me endpoint
        res = client.get("/api/auth/me", headers=elderly_headers)
        assert res.status_code == 200 and res.json()["role"] == "elderly"
        print("[PASS] 5. Profile auth /me verification")

        # 6. Test Elderly Dashboard endpoint
        res = client.get("/api/dashboard/elderly", headers=elderly_headers)
        assert res.status_code == 200, f"Elderly dashboard failed: {res.text}"
        dash = res.json()
        assert "today_total_meds" in dash
        assert "today_timeline" in dash
        print(f"[PASS] 6. Elderly dashboard metrics: {dash['today_taken_meds']}/{dash['today_total_meds']} taken, Next: {dash.get('next_reminder', {}).get('medicine_name', 'None')}")

        # 7. Test Today's Medication Schedule
        res = client.get("/api/medication-logs/today", headers=elderly_headers)
        assert res.status_code == 200, f"Today schedule failed: {res.text}"
        timeline = res.json()
        assert len(timeline) > 0, "No medications in timeline"
        print(f"[PASS] 7. Today's medication timeline ({len(timeline)} scheduled items)")

        # 8. Test Mark Medication as Taken & Duplicate Check
        target_item = next((item for item in timeline if item["status"] != "taken"), timeline[0])
        log_payload = {
            "medication_id": target_item["medication_id"],
            "scheduled_time": target_item["scheduled_time"],
            "log_date": "2026-11-15",
            "status": "taken",
            "notes": "Verified by automated test suite"
        }
        res = client.post("/api/medication-logs", json=log_payload, headers=elderly_headers)
        assert res.status_code == 201, f"Mark taken failed: {res.text}"
        log_res = res.json()
        assert log_res["status"] == "taken"
        assert log_res["taken_at"] is not None
        print(f"[PASS] 8. Marked dose taken (ID: {log_res['id']}, Taken at: {log_res['taken_at']})")

        # Repeat same mark taken to ensure duplicate prevention / idempotent update
        res2 = client.post("/api/medication-logs", json=log_payload, headers=elderly_headers)
        assert res2.status_code == 201 and res2.json()["id"] == log_res["id"], "Duplicate dose should update existing log"
        print("[PASS] 8b. Duplicate medication dose log prevented / idempotently handled")

        # 9. Test Medication Adherence API
        res = client.get("/api/medication-logs/adherence?days=7", headers=elderly_headers)
        assert res.status_code == 200, f"Adherence failed: {res.text}"
        adh = res.json()
        assert "adherence_percentage" in adh
        print(f"[PASS] 9. Medication adherence calculation: {adh['adherence_percentage']}% (Total: {adh['total_doses']} doses)")

        # 10. Test Caregiver Dashboard
        res = client.get("/api/caregiver/dashboard", headers=caregiver_headers)
        assert res.status_code == 200, f"Caregiver dashboard failed: {res.text}"
        cg_dash = res.json()
        assert cg_dash["connected_elderly_count"] >= 1
        assert len(cg_dash["connected_elderly"]) >= 1
        print(f"[PASS] 10. Caregiver dashboard ({cg_dash['connected_elderly_count']} connected patient)")

        # 11. Test Caregiver querying specific elderly patient details
        elderly_id = cg_dash["connected_elderly"][0]["id"]
        res = client.get(f"/api/caregiver/elderly-users/{elderly_id}", headers=caregiver_headers)
        assert res.status_code == 200, f"Elderly details failed: {res.text}"
        print(f"[PASS] 11. Caregiver access to elderly patient #{elderly_id} records")

        # 12. Test Health Record Creation & History
        health_payload = {
            "blood_pressure_systolic": 122,
            "blood_pressure_diastolic": 79,
            "blood_glucose": 106.5,
            "heart_rate": 71,
            "weight": 73.5,
            "notes": "Test vitals log from automated test"
        }
        res = client.post("/api/health-records", json=health_payload, headers=elderly_headers)
        assert res.status_code == 201, f"Health record creation failed: {res.text}"
        print("[PASS] 12. Health vital recorded (BP: 122/79, Glucose: 106.5)")

        res = client.get("/api/health-records", headers=elderly_headers)
        assert res.status_code == 200 and len(res.json()) > 0
        print(f"[PASS] 12b. Historical health vitals fetched ({len(res.json())} records)")

        # 13. Test Emergency Contacts & SOS Triggering
        res = client.get("/api/emergency/contacts", headers=elderly_headers)
        assert res.status_code == 200 and len(res.json()) >= 2
        print(f"[PASS] 13. Emergency contacts list ({len(res.json())} trusted contacts)")

        # Trigger SOS
        sos_payload = {"notes": "Urgent alert test from automated verification"}
        res = client.post("/api/emergency/sos", json=sos_payload, headers=elderly_headers)
        assert res.status_code == 201, f"SOS trigger failed: {res.text}"
        sos_event = res.json()
        assert sos_event["status"] == "ACTIVE"
        sos_id = sos_event["id"]
        print(f"[PASS] 14. Emergency SOS created (ID: #{sos_id}, Status: ACTIVE)")

        # Verify Caregiver sees the active SOS event
        res = client.get("/api/caregiver/dashboard", headers=caregiver_headers)
        active_alerts = res.json().get("active_emergency_alerts", [])
        assert any(a["id"] == sos_id for a in active_alerts), "Active SOS not found in caregiver dashboard alerts!"
        print(f"[PASS] 15. Emergency SOS verified in Caregiver active alerts list")

        # Caregiver resolves the alert
        res = client.put(f"/api/emergency/events/{sos_id}/resolve?status_update=RESOLVED", headers=caregiver_headers)
        assert res.status_code == 200 and res.json()["status"] == "RESOLVED"
        print(f"[PASS] 16. Caregiver successfully resolved SOS alert #{sos_id}")

        # 17. Test Gemini AI Care Assistant endpoint
        chat_payload = {
            "message": "What should I do if I missed taking my morning medicine?",
            "history": []
        }
        res = client.post("/api/ai/chat", json=chat_payload, headers=elderly_headers)
        assert res.status_code == 200, f"AI chat failed: {res.text}"
        ai_reply = res.json()
        assert "reply" in ai_reply and len(ai_reply["reply"]) > 20
        assert "disclaimer" in ai_reply
        print(f"[PASS] 17. Gemini AI Assistant endpoint (is_fallback: {ai_reply['is_fallback']})")

        # 18. Test Medication CRUD (Create, Update, Delete)
        new_med_payload = {
            "medicine_name": "CoQ10 Heart Health",
            "dosage": "100 mg (1 softgel)",
            "frequency": "Once Daily",
            "instructions": "Take with breakfast.",
            "start_date": "2026-11-15",
            "category": "Supplements",
            "color": "#7C3AED",
            "schedules": ["09:30"]
        }
        res = client.post("/api/medications", json=new_med_payload, headers=elderly_headers)
        assert res.status_code == 201, f"Create med failed: {res.text}"
        created_med = res.json()
        med_id = created_med["id"]
        print(f"[PASS] 18a. Medication CRUD: Created #{med_id} ({created_med['medicine_name']})")

        # Update
        res = client.put(f"/api/medications/{med_id}", json={"dosage": "200 mg"}, headers=elderly_headers)
        assert res.status_code == 200 and res.json()["dosage"] == "200 mg"
        print(f"[PASS] 18b. Medication CRUD: Updated dosage to 200 mg")

        # Delete
        res = client.delete(f"/api/medications/{med_id}", headers=elderly_headers)
        assert res.status_code == 204
        print(f"[PASS] 18c. Medication CRUD: Deleted test medication")

        # 19. New User Registration Test
        reg_payload = {
            "name": "Evelyn Reed",
            "email": "evelyn.reed.test@example.com",
            "password": "SecurePassword123!",
            "role": "elderly",
            "age": 72
        }
        res = client.post("/api/auth/register", json=reg_payload)
        assert res.status_code == 201, f"Registration failed: {res.text}"
        reg_user = res.json()
        assert "access_token" in reg_user
        print(f"[PASS] 19. New user registration (User: {reg_user['user']['name']})")

        print("\n" + "=" * 60)
        print("ALL 19 CRITICAL API & WORKFLOW SUITE TESTS PASSED WITH 100% SUCCESS!")
        print("=" * 60)

if __name__ == "__main__":
    run_all_tests()
