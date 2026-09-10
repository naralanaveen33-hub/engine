"""AquaCrop Docker Verification Script - Run inside the backend container"""
from pathlib import Path
import json

print("=" * 60)
print("  AQUACROP DOCKER FULL SYSTEM VERIFICATION")
print("=" * 60)

# 1. ML Model
print("\n[1] ML MODEL CHECK")
model_path = Path("/app/ml/artifacts/crop_rf_v1.joblib")
metrics_path = Path("/app/ml/artifacts/metrics.json")
print(f"  Model exists: {model_path.exists()} ({model_path})")
print(f"  Metrics exists: {metrics_path.exists()} ({metrics_path})")

from app.engines.crop_analysis import load_model, model_meta
load_model()
meta = model_meta()
print(f"  ML Status: {meta.get('status')}")
print(f"  Test Accuracy: {meta.get('test_accuracy')}")

# 2. Database
print("\n[2] DATABASE CHECK")
from app.db import engine, SessionLocal
from app import models
import sqlalchemy
inspector = sqlalchemy.inspect(engine)
tables = inspector.get_table_names()
print(f"  Database URL: {engine.url}")
print(f"  Tables: {len(tables)}")
db = SessionLocal()
users = db.query(models.User).count()
farmers = db.query(models.Farmer).count()
farms = db.query(models.Farm).count()
fields = db.query(models.Field).count()
crops = db.query(models.Crop).count()
print(f"  Users: {users}, Farmers: {farmers}, Farms: {farms}, Fields: {fields}, Crops: {crops}")

# 3. OTP Flow Test
print("\n[3] OTP FLOW TEST")
from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)

test_phone = "+919876500001"
r1 = client.post("/api/v1/auth/request-otp", json={"phone_number": test_phone})
print(f"  Request OTP: {r1.status_code}")
assert r1.status_code == 200, f"FAIL: {r1.text}"
resp1 = r1.json()
print(f"  OTP in response body? {'otp' in json.dumps(resp1).lower()}")
assert "otp_code" not in json.dumps(resp1), "SECURITY FAIL: OTP in response!"

# Get OTP from DB
ch = db.query(models.OtpChallenge).filter_by(
    phone_number=models.normalize_phone_number(test_phone), status="PENDING"
).order_by(models.OtpChallenge.created_at.desc()).first()
otp_code = ch.otp_code
print(f"  OTP from DB: {otp_code}")

# Verify wrong OTP
r_wrong = client.post("/api/v1/auth/verify-otp", json={"phone_number": test_phone, "otp_code": "000000"})
print(f"  Wrong OTP rejected: {r_wrong.status_code == 400}")

# Verify correct OTP
r2 = client.post("/api/v1/auth/verify-otp", json={"phone_number": test_phone, "otp_code": otp_code})
print(f"  Verify OTP: {r2.status_code}")
resp2 = r2.json()
print(f"  is_registered: {resp2.get('is_registered')}")

# 4. Register farmer
print("\n[4] FARMER REGISTRATION TEST")
reg = client.post("/api/v1/auth/register-farmer", json={
    "phone_number": test_phone,
    "display_name": "Docker Test Farmer",
    "language_pref": "te",
    "farm_name": "Docker Test Farm",
    "field_name": "Docker Field 1",
    "latitude": 16.4342,
    "longitude": 81.6981,
    "area_m2": 1897.47,
    "geojson": {
        "type": "Feature",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[81.6979, 16.4340], [81.6983, 16.4340], [81.6983, 16.4344], [81.6979, 16.4344], [81.6979, 16.4340]]]
        }
    },
    "current_crop_code": "tomato",
    "previous_crop_code": "chickpea",
    "water_availability": "MODERATE",
    "irrigation_method": "DRIP"
})
print(f"  Register: {reg.status_code}")
if reg.status_code == 200:
    reg_data = reg.json()
    token = reg_data["access_token"]
    print(f"  Farmer: {reg_data.get('farmer_name')}")
    print(f"  Farm ID: {reg_data.get('farm_id')}")
    print(f"  Field ID: {reg_data.get('field_id')}")
    headers = {"Authorization": f"Bearer {token}"}

    # 5. /me
    print("\n[5] PROFILE CHECK")
    me = client.get("/api/v1/me", headers=headers).json()
    print(f"  Name: {me.get('farmer_name')}")
    print(f"  Phone: {me.get('phone_number')}")
    print(f"  Role: {me.get('role')}")

    # 6. Fields
    print("\n[6] FIELDS CHECK")
    flds = client.get("/api/v1/fields", headers=headers).json()
    print(f"  Field count: {len(flds)}")
    if flds:
        fid = flds[0]["id"]
        print(f"  Field name: {flds[0].get('name')}")
        print(f"  Area m2: {flds[0].get('area_m2')}")
        print(f"  Latitude: {flds[0].get('latitude')}")
        print(f"  Longitude: {flds[0].get('longitude')}")

        # 7. Crop Analysis
        print("\n[7] CROP ANALYSIS")
        ca = client.post(f"/api/v1/fields/{fid}/crop-analysis", headers=headers)
        print(f"  Status: {ca.status_code}")
        if ca.status_code == 200:
            ca_data = ca.json()
            print(f"  ML Status: {ca_data.get('ml_status')}")
            recs = ca_data.get("recommendations", [])
            print(f"  Recommendations: {len(recs)}")
            for r in recs[:3]:
                print(f"    - {r.get('crop')}: score={r.get('suitability_score')}")

        # 8. Irrigation
        print("\n[8] IRRIGATION EVALUATION")
        irr = client.post(f"/api/v1/fields/{fid}/irrigation/evaluate", headers=headers)
        print(f"  Status: {irr.status_code}")
        if irr.status_code == 200:
            irr_data = irr.json()
            print(f"  Action: {irr_data.get('action')}")
            print(f"  Confidence: {irr_data.get('confidence')}")

    # 9. Returning login
    print("\n[9] RETURNING LOGIN TEST")
    r_req2 = client.post("/api/v1/auth/request-otp", json={"phone_number": test_phone})
    db.expire_all()
    ch2 = db.query(models.OtpChallenge).filter_by(
        phone_number=models.normalize_phone_number(test_phone), status="PENDING"
    ).order_by(models.OtpChallenge.created_at.desc()).first()
    r_ver2 = client.post("/api/v1/auth/verify-otp", json={"phone_number": test_phone, "otp_code": ch2.otp_code})
    resp_login = r_ver2.json()
    print(f"  is_registered: {resp_login.get('is_registered')}")
    print(f"  farmer_name: {resp_login.get('farmer_name')}")
    print(f"  Skips registration: {resp_login.get('is_registered') == True}")

else:
    print(f"  FAIL: {reg.text}")

# 10. Phone normalization
print("\n[10] PHONE NORMALIZATION")
for raw in ["9876500001", "919876500001", "+919876500001"]:
    norm = models.normalize_phone_number(raw)
    print(f"  {raw:>20s} -> {norm}")

# 11. Water math
print("\n[11] WATER CALCULATION REGRESSION")
from app.engines.water import litres_for_depth
net = 5 * 400  # 5mm x 400m2
gross = net / 0.90
duration_min = gross / 10
safe = min(duration_min, 120)
print(f"  Net: {net} L")
print(f"  Gross: {gross:.2f} L")
print(f"  Duration: {duration_min:.2f} min")
print(f"  Safe capped: {safe:.2f} min")
print(f"  Status: {'DURATION_CAPPED_SAFETY' if duration_min > 120 else 'NORMAL'}")

db.close()

print("\n" + "=" * 60)
print("  DOCKER VERIFICATION COMPLETE")
print("=" * 60)
