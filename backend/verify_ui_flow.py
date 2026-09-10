"""
Full API Flow & Web UI Backend Verification Script for AquaCrop.
Tests every API endpoint that the Web UI consumes.
"""
import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

def run_ui_flow_verification():
    print("=== AQUACROP WEB UI BACKEND API FLOW VERIFICATION ===")
    
    from fastapi.testclient import TestClient
    from app.main import app
    from app.db import Base, engine, SessionLocal
    from app.seed import seed_if_empty

    # Initialize DB & Seed
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_if_empty(db)
    db.close()

    client = TestClient(app)
    results = {}

    # 1. Health Endpoint
    r = client.get("/api/v1/health")
    print(f"1. Health Check GET /api/v1/health -> Status {r.status_code}, Response: {r.json()}")
    results["Health"] = r.status_code == 200

    # 2. Login as Farmer
    r = client.post("/api/v1/auth/login", json={"email": "demo@aquacrop.local", "password": "demo1234"})
    print(f"2. Farmer Login POST /api/v1/auth/login -> Status {r.status_code}")
    assert r.status_code == 200, f"Login failed: {r.text}"
    farmer_token = r.json()["access_token"]
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    results["Farmer Login"] = True

    # 3. Login as Engineer
    r = client.post("/api/v1/auth/login", json={"email": "engineer@aquacrop.local", "password": "demo1234"})
    print(f"3. Engineer Login POST /api/v1/auth/login -> Status {r.status_code}")
    assert r.status_code == 200, f"Engineer login failed: {r.text}"
    engineer_token = r.json()["access_token"]
    engineer_headers = {"Authorization": f"Bearer {engineer_token}"}
    results["Engineer Login"] = True

    # 4. User Profile GET /api/v1/me
    r = client.get("/api/v1/me", headers=farmer_headers)
    print(f"4. User Profile GET /api/v1/me -> Status {r.status_code}, Role: {r.json().get('role')}")
    results["User Profile"] = r.status_code == 200

    # 5. List Fields GET /api/v1/fields
    r = client.get("/api/v1/fields", headers=farmer_headers)
    print(f"5. List Fields GET /api/v1/fields -> Status {r.status_code}, Count: {len(r.json())}")
    assert r.status_code == 200 and len(r.json()) > 0
    fields = r.json()
    field_id = fields[0]["id"]
    results["List Fields"] = True

    # 6. Detailed Field GET /api/v1/fields/{id}
    r = client.get(f"/api/v1/fields/{field_id}", headers=farmer_headers)
    print(f"6. Field Detail GET /api/v1/fields/{field_id} -> Status {r.status_code}")
    assert r.status_code == 200
    field_detail = r.json()
    print(f"   Name: '{field_detail.get('name')}', Lat/Lon: ({field_detail.get('latitude')}, {field_detail.get('longitude')})")
    print(f"   Current Crops: {field_detail.get('current_crops')}")
    print(f"   Previous Crop: {field_detail.get('previous_crop')}")
    results["Field Detail"] = True

    # 7. Crop Analysis POST /api/v1/fields/{id}/crop-analysis
    r = client.post(f"/api/v1/fields/{field_id}/crop-analysis", headers=farmer_headers, json={})
    print(f"7. Crop Analysis POST /api/v1/fields/{field_id}/crop-analysis -> Status {r.status_code}")
    assert r.status_code == 200
    analysis = r.json()
    print(f"   ML Status: {analysis.get('ml_status')}, Model Version: {analysis.get('model_version')}")
    print(f"   Top Recommendation: {analysis.get('recommendations')[0] if analysis.get('recommendations') else 'None'}")
    results["Crop Analysis"] = True

    # 8. Evaluate Irrigation POST /api/v1/fields/{id}/irrigation/evaluate
    r = client.post(f"/api/v1/fields/{field_id}/irrigation/evaluate", headers=farmer_headers, json={})
    print(f"8. Evaluate Irrigation POST /api/v1/fields/{field_id}/irrigation/evaluate -> Status {r.status_code}")
    assert r.status_code == 200
    decision = r.json()
    decision_id = decision.get("decision_id")
    print(f"   Action: {decision.get('action')}, Decision Code: {decision.get('public_code')}, Litres: {decision.get('estimated_water_litres')}")
    results["Evaluate Irrigation"] = True

    # 9. Farmer Confirm Decision POST /api/v1/irrigation/{decision_id}/confirm
    r = client.post(f"/api/v1/irrigation/{decision_id}/confirm", headers=farmer_headers, json={})
    print(f"9. Confirm Decision POST /api/v1/irrigation/{decision_id}/confirm -> Status {r.status_code}")
    assert r.status_code == 200
    results["Farmer Confirmation"] = True

    # 10. Execute Authorized Command POST /api/v1/irrigation/{decision_id}/execute
    r = client.post(f"/api/v1/irrigation/{decision_id}/execute", headers=farmer_headers, json={})
    print(f"10. Execute Command POST /api/v1/irrigation/{decision_id}/execute -> Status {r.status_code}")
    assert r.status_code == 200
    results["Execute Command"] = True

    # 11. History GET /api/v1/fields/{id}/irrigation/history
    r = client.get(f"/api/v1/fields/{field_id}/irrigation/history", headers=farmer_headers)
    print(f"11. Irrigation History GET /api/v1/fields/{field_id}/irrigation/history -> Status {r.status_code}, Count: {len(r.json())}")
    results["Irrigation History"] = r.status_code == 200

    # 12. Simulation Scenario POST /api/v1/simulation/scenario
    r = client.post("/api/v1/simulation/scenario", headers=farmer_headers, json={"field_id": field_id, "scenario": "HEAVY_RAIN"})
    print(f"12. Simulation Scenario POST /api/v1/simulation/scenario -> Status {r.status_code}")
    assert r.status_code == 200
    sim_res = r.json()
    print(f"    Scenario: {sim_res.get('scenario')}, Simulated Action: {sim_res.get('decision', {}).get('action')}")
    results["Simulation Mode"] = True

    # 13. AI Chat POST /api/v1/ai/chat (English)
    r = client.post("/api/v1/ai/chat", headers=farmer_headers, json={"message": "Should I irrigate my tomato field?", "field_id": field_id, "language": "en"})
    print(f"13. AI Chat (English) POST /api/v1/ai/chat -> Status {r.status_code}")
    assert r.status_code == 200
    results["Ask AquaCrop English"] = True

    # 14. AI Chat POST /api/v1/ai/chat (Telugu)
    r = client.post("/api/v1/ai/chat", headers=farmer_headers, json={"message": "నా టమాటా పొలానికి నీళ్లు పెట్టాలా?", "field_id": field_id, "language": "te"})
    print(f"14. AI Chat (Telugu) POST /api/v1/ai/chat -> Status {r.status_code}")
    assert r.status_code == 200
    print(f"    Telugu Reply Snippet: {r.json().get('reply')[:80]}...")
    results["Ask AquaCrop Telugu"] = True

    # 15. Active Alerts GET /api/v1/alerts
    r = client.get("/api/v1/alerts", headers=farmer_headers)
    print(f"15. System Alerts GET /api/v1/alerts -> Status {r.status_code}")
    results["Alerts"] = r.status_code == 200

    # 16. Engineer Status GET /api/v1/engineer/status
    r = client.get("/api/v1/engineer/status", headers=engineer_headers)
    print(f"16. Engineer Status GET /api/v1/engineer/status -> Status {r.status_code}")
    assert r.status_code == 200
    results["Engineer Status Panel"] = True

    print("\n=== SUMMARY OF ALL TESTED ENDPOINTS ===")
    for name, ok in results.items():
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}")

    return all(results.values())

if __name__ == "__main__":
    run_ui_flow_verification()
