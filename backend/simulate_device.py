"""LAN demo without hardware: posts SIMULATION telemetry as a virtual ESP32 device simulator."""
import time
import os
import httpx

API = os.environ.get("API", "http://127.0.0.1:8000/api/v1")
TOKEN = os.environ.get("DEVICE_TOKEN", "esp32-demo-token")
DEVICE = "esp32-demo-01"
MOISTURE = float(os.environ.get("MOISTURE", "18"))


def main():
    while True:
        r = httpx.post(
            f"{API}/sensor/readings",
            headers={"X-Device-Token": TOKEN},
            json={"device_id": DEVICE, "soil_moisture": MOISTURE, "temperature": 31.2, "humidity": 58, "battery": 82},
            timeout=5,
        )
        print("ingest", r.status_code, r.text[:200])
        c = httpx.get(f"{API}/devices/{DEVICE}/commands", headers={"X-Device-Token": TOKEN}, timeout=5)
        print("poll", c.status_code, c.text[:300])
        data = c.json() if c.status_code == 200 else {}
        for cmd in data.get("commands") or []:
            cid = cmd["command_id"]
            print("ACTUATOR ON", cmd["payload"])
            time.sleep((cmd["payload"].get("duration_ms") or 2000) / 1000)
            httpx.post(f"{API}/devices/{DEVICE}/commands/{cid}/ack", headers={"X-Device-Token": TOKEN}, timeout=5)
            print("ACTUATOR OFF acked")
        time.sleep(3)


if __name__ == "__main__":
    main()
