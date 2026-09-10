import requests
import random

BASE_URL = "http://localhost:8000/api/v1"

def test_full_regression():
    print("[1] Testing Health Endpoint...")
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Health failed: {r.text}"
    print("  -> Health OK")

    print("[2] Testing Request OTP Endpoint...")
    phone = f"+9199{random.randint(100000, 999999)}"
    r = requests.post(f"{BASE_URL}/auth/request-otp", json={"phone_number": phone})
    assert r.status_code == 200, f"Request OTP failed: {r.text}"
    data = r.json()
    assert data["status"] == "SUCCESS", f"Invalid OTP status: {data}"
    print("  -> Request OTP OK")

    print("[3] Testing Farmer Registration...")
    r = requests.post(
        f"{BASE_URL}/auth/register-farmer",
        json={
            "phone_number": phone,
            "display_name": "Test Regression Farmer",
            "language_pref": "te",
            "farm_name": "Swarnandhra Farm",
            "field_name": "Field 1 - Tomato",
            "latitude": 16.4342,
            "longitude": 81.6883,
            "crop_code": "tomato",
            "crop_stage": "FLOWERING",
            "previous_crop_code": "chickpea",
            "water_availability": "ADEQUATE",
            "irrigation_method": "DRIP",
        },
    )
    assert r.status_code == 200, f"Registration failed: {r.text}"
    reg_data = r.json()
    token = reg_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  -> Farmer Registration OK (Token received)")

    print("[4] Testing Current User Profile (/me)...")
    r = requests.get(f"{BASE_URL}/me", headers=headers)
    assert r.status_code == 200, f"GET /me failed: {r.text}"
    print("  -> User Profile OK")

    print("[5] Testing Fields List & Field Details...")
    r = requests.get(f"{BASE_URL}/fields", headers=headers)
    assert r.status_code == 200, f"GET /fields failed: {r.text}"
    fields = r.json()
    assert len(fields) > 0, "No fields returned!"
    field_id = fields[0]["id"]
    print(f"  -> Fields List OK (Field ID: {field_id})")

    print("[6] Testing Irrigation Evaluation Engine...")
    r = requests.post(f"{BASE_URL}/fields/{field_id}/irrigation/evaluate", headers=headers, json={})
    assert r.status_code == 200, f"Irrigation evaluation failed: {r.text}"
    eval_data = r.json()
    assert "action" in eval_data, f"Invalid evaluation response: {eval_data}"
    assert "public_code" in eval_data, f"Invalid public_code: {eval_data}"
    print(f"  -> Irrigation Evaluation Engine OK (Decision: {eval_data['action']} [{eval_data['public_code']}])")

    print("[7] Testing Crop Analysis Engine...")
    r = requests.post(f"{BASE_URL}/fields/{field_id}/crop-analysis", headers=headers)
    assert r.status_code == 200, f"Crop analysis failed: {r.text}"
    crop_data = r.json()
    assert "recommendations" in crop_data, f"Invalid crop analysis response: {crop_data}"
    print("  -> Crop Analysis Engine OK")

    print("[8] Testing Market Endpoint...")
    r = requests.get(f"{BASE_URL}/fields/{field_id}/market", headers=headers)
    assert r.status_code == 200, f"Market endpoint failed: {r.text}"
    mkt = r.json()
    assert mkt["source"] == "DEMO_DATA", f"Market source should be DEMO_DATA: {mkt}"
    assert mkt["is_live"] is False, f"Market is_live should be False: {mkt}"
    print("  -> Market Endpoint OK (Truthful DEMO_DATA classification)")

    print("[9] Testing AI Chat Endpoint...")
    r = requests.post(
        f"{BASE_URL}/ai/chat",
        headers=headers,
        json={"message": "What is the tomato market price today?", "field_id": field_id, "language": "en"},
    )
    assert r.status_code == 200, f"AI Chat failed: {r.text}"
    chat_res = r.json()
    assert "reply" in chat_res, f"Invalid AI chat response: {chat_res}"
    print("  -> AI Chat Endpoint OK")

    print("\n============================================================")
    print("  ALL 9 END-TO-END REGRESSION TESTS PASSED CLEANLY!  ")
    print("============================================================\n")

if __name__ == "__main__":
    test_full_regression()
