void setup() {
  // put your setup code here, to run once:

}/*
  ===================================================================================
  AquaCrop ESP32 Smart Agricultural Node Firmware
  Hardware: ESP32 DevKit V1
  Sensors: DHT11 (Temp & Humidity), Capacitive/Resistive Soil Moisture (Analog ADC)
  Actuator: 5V Relay Module driving a Submersible 5V/12V DC Water Pump
  ===================================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ===================================================================================
// HARDWARE PIN DEFINITIONS & CALIBRATION
// ===================================================================================
#define DHTPIN 4               // DHT11 Data Pin connected to GPIO 4
#define DHTTYPE DHT11          // DHT Sensor Type
#define PIN_SOIL_MOISTURE 34   // Soil Moisture Analog Pin connected to GPIO 34 (ADC1_CH6)
#define PIN_RELAY_PUMP 26      // Relay Signal Pin connected to GPIO 26
#define PIN_STATUS_LED 2       // Onboard Status Indicator LED (GPIO 2)

// Soil Moisture ADC Calibration values (Adjust based on dry air vs submerged in water)
const int DRY_AIR_ADC = 3200;  // ADC reading in completely dry soil / air (0%)
const int WET_WATER_ADC = 1300;// ADC reading in water / 100% saturated soil (100%)

// Relay Trigger Logic (Active HIGH or Active LOW depending on your Relay module)
const bool RELAY_ON = HIGH;    // Set to LOW if using Active-LOW Relay module
const bool RELAY_OFF = LOW;    // Set to HIGH if using Active-LOW Relay module

// ===================================================================================
// NETWORK & AQUACROP API CONFIGURATION
// ===================================================================================
const char* WIFI_SSID     = "Hi";         // Replace with your WiFi SSID
const char* WIFI_PASS     = "123456789";     // Replace with your WiFi Password
const char* API_HOST      = "http://10.227.62.41:8000"; // Laptop IP Address (10.227.62.41)
const char* HARDWARE_ID   = "esp32-demo-01";          // Unique Device Hardware ID
const char* DEVICE_TOKEN  = "esp32-demo-token";       // Device Token for X-Device-Token Header

const unsigned long TELEMETRY_INTERVAL_MS = 5000;     // Transmit telemetry every 5 seconds
unsigned long lastTelemetryTime = 0;

DHT dht(DHTPIN, DHTTYPE);

// ===================================================================================
// SETUP
// ===================================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[AQUACROP] Booting ESP32 Agricultural Node...");

  // Initialize Pin Modes
  pinMode(PIN_RELAY_PUMP, OUTPUT);
  digitalWrite(PIN_RELAY_PUMP, RELAY_OFF); // Ensure Pump is OFF at startup for safety

  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Initialize DHT Sensor
  dht.begin();
  Serial.println("[AQUACROP] DHT11 Sensor Initialized.");

  // Connect to Wi-Fi
  connectWiFi();
}

// ===================================================================================
// MAIN LOOP
// ===================================================================================
void loop() {
  // Keep Wi-Fi connected
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Periodic Telemetry Transmission
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = millis();
    sendTelemetry();
    pollCommands();
  }

  delay(100);
}

// ===================================================================================
// HELPER FUNCTIONS
// ===================================================================================

void connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED)); // Blink status LED
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_STATUS_LED, HIGH); // Solid ON when connected
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    digitalWrite(PIN_STATUS_LED, LOW);
    Serial.println("\n[WiFi] Connection Failed! Retrying in next loop...");
  }
}

// Read and Calibrate Soil Moisture Percentage (0% - 100%)
int readSoilMoisture() {
  int rawADC = analogRead(PIN_SOIL_MOISTURE);
  int moisturePct = map(rawADC, DRY_AIR_ADC, WET_WATER_ADC, 0, 100);
  moisturePct = constrain(moisturePct, 0, 100);
  Serial.printf("[SENSOR] Soil Moisture Raw ADC: %d -> %d%%\n", rawADC, moisturePct);
  return moisturePct;
}

// Send Sensor Telemetry to AquaCrop Backend API
void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) return;

  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  int moisture = readSoilMoisture();

  // Fallback check if DHT sensor read failed
  if (isnan(temp) || isnan(humidity)) {
    Serial.println("[SENSOR WARN] Failed to read from DHT11 sensor! Using fallback readings.");
    temp = 28.5;
    humidity = 60.0;
  }

  HTTPClient http;
  String endpoint = String(API_HOST) + "/api/v1/sensor/readings";
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);

  StaticJsonDocument<256> doc;
  doc["device_id"] = HARDWARE_ID;
  doc["soil_moisture"] = moisture;
  doc["temperature"] = temp;
  doc["humidity"] = humidity;
  doc["battery"] = 100;
  doc["network_status"] = "ONLINE";

  String jsonBody;
  serializeJson(doc, jsonBody);

  int httpCode = http.POST(jsonBody);
  Serial.printf("[API TELEMETRY] POST /sensor/readings -> HTTP %d\n", httpCode);

  http.end();
}

// Poll Pending Irrigation Commands from Backend & Control Submersible Pump
void pollCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String endpoint = String(API_HOST) + "/api/v1/devices/" + HARDWARE_ID + "/commands";
  http.begin(endpoint);
  http.addHeader("X-Device-Token", DEVICE_TOKEN);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("[API COMMANDS] Response: " + response);

    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, response);
    if (!error && doc.containsKey("commands")) {
      JsonArray commands = doc["commands"].as<JsonArray>();
      for (JsonObject cmd : commands) {
        const char* cmdId = cmd["id"];
        int durationMs = cmd["duration_ms"] | 5000;

        Serial.printf("[ACTUATOR] Running Irrigation Command ID: %s for %d ms...\n", cmdId, durationMs);
        
        // TURN PUMP ON
        digitalWrite(PIN_RELAY_PUMP, RELAY_ON);
        Serial.println("💧 SUBMERSIBLE MOTOR PUMP IS NOW ACTIVE (PUMPING WATER)...");
        
        delay(durationMs); // Run pump for duration

        // TURN PUMP OFF
        digitalWrite(PIN_RELAY_PUMP, RELAY_OFF);
        Serial.println("⛔ SUBMERSIBLE MOTOR PUMP IS NOW STOPPED.");

        // Send Execution ACK to Backend
        acknowledgeCommand(cmdId);
      }
    }
  }

  http.end();
}

// Send Command Execution Acknowledgment back to Backend
void acknowledgeCommand(const char* commandId) {
  HTTPClient http;
  String endpoint = String(API_HOST) + "/api/v1/devices/" + HARDWARE_ID + "/commands/" + commandId + "/ack";
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);

  int httpCode = http.POST("{}");
  Serial.printf("[API ACK] Command %s -> HTTP %d ACK\n", commandId, httpCode);
  http.end();
}

void loop() {
  // put your main code here, to run repeatedly:

}
