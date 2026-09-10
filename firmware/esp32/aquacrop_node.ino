"""
AquaCrop ESP32 firmware (Arduino).
- POST telemetry to /api/v1/sensor/readings with X-Device-Token
- Poll GET /api/v1/devices/{hardware_id}/commands
- Drive LED/relay for duration_ms — use a driver, never high voltage on GPIO

Configure WIFI_SSID, WIFI_PASS, API_HOST (laptop LAN IP), DEVICE_TOKEN.
Demo token for seeded device: esp32-demo-token  hardware_id: esp32-demo-01
"""

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "YOUR_SSID";
const char* WIFI_PASS = "YOUR_PASS";
const char* API_HOST = "http://192.168.1.10:8000";
const char* HARDWARE_ID = "esp32-demo-01";
const char* DEVICE_TOKEN = "esp32-demo-token";
const int PIN_MOISTURE = 34;
const int PIN_ACTUATOR = 2; // LED on many ESP32 devkits

void setup() {
  Serial.begin(115200);
  pinMode(PIN_ACTUATOR, OUTPUT);
  digitalWrite(PIN_ACTUATOR, LOW);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("WiFi ok");
}

int moisturePct() {
  int raw = analogRead(PIN_MOISTURE);
  int pct = map(raw, 3000, 1200, 0, 100); // calibrate for your probe
  return constrain(pct, 0, 100);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) { delay(2000); return; }
  HTTPClient http;
  String url = String(API_HOST) + "/api/v1/sensor/readings";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);
  String body = "{";
  body += "\"device_id\":\"" + String(HARDWARE_ID) + "\",";
  body += "\"soil_moisture\":" + String(moisturePct()) + ",";
  body += "\"temperature\":31.2,";
  body += "\"humidity\":58,";
  body += "\"battery\":82,";
  body += "\"network_status\":\"ONLINE\"";
  body += "}";
  int code = http.POST(body);
  Serial.printf("ingest %d\n", code);
  http.end();

  HTTPClient http2;
  String curl = String(API_HOST) + "/api/v1/devices/" + HARDWARE_ID + "/commands";
  http2.begin(curl);
  http2.addHeader("X-Device-Token", DEVICE_TOKEN);
  int gc = http2.GET();
  if (gc == 200) {
    String payload = http2.getString();
    if (payload.indexOf("duration_ms") >= 0) {
      int dur = 8000;
      digitalWrite(PIN_ACTUATOR, HIGH);
      delay(dur);
      digitalWrite(PIN_ACTUATOR, LOW);
      // ACK would parse command_id; simplified blink for demo
    }
  }
  http2.end();
  delay(3000);
}
