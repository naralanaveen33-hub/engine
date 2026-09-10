# 🔌 AquaCrop Hardware Implementation & Wiring Guide

This guide documents the physical hardware circuit wiring, pinout mappings, sensor calibration, and flashing steps for the **AquaCrop ESP32 Smart Agricultural Node** and **ESP32-CAM Field Camera**.

---

## 📑 1. Bill of Materials (Component List)

| Component | Quantity | Purpose |
| :--- | :--- | :--- |
| **ESP32 DevKit V1** (30-pin) | 1 | Main Microcontroller (Wi-Fi + Telemetry + Relay Control) |
| **ESP32-CAM** (AI-Thinker OV2640) | 1 | Visual Crop Inspection & Live Image Streaming |
| **DHT11 Sensor** | 1 | Ambient Air Temperature (°C) & Relative Humidity (%) |
| **Analog Soil Moisture Sensor** (Capacitive v1.2 / Resistive) | 1 | Volumetric Soil Moisture Level (0% - 100%) |
| **5V Single-Channel Relay Module** | 1 | High-Current Switching Interface for Water Pump |
| **5V / 12V DC Submersible Water Pump** | 1 | Precision Field Irrigation Motor Pump |
| **5V 2A DC Adapter / Power Supply** | 1 | Main System Power Supply |
| **1N4007 Flyback Diode** | 1 | Inductive Voltage Spike Protection across Pump Terminals |

---

## ⚡ 2. ESP32 Main Node Wiring Schematic & Pinout Table

### **ESP32 Pinout Connections**

```text
               +----------------------------------+
               |          ESP32 DevKit V1         |
               +----------------------------------+
               | GPIO 4  <--> DHT11 Data Pin      |
               | GPIO 34 <--> Soil Moisture (AOUT)|
               | GPIO 26 <--> Relay Signal (IN)   |
               | GPIO 2  <--> Status LED (Built-in)|
               | 3V3     <--> DHT11 VCC           |
               | 5V/VIN  <--> Relay VCC & Soil VCC|
               | GND     <--> Common System Ground|
               +----------------------------------+
```

### **Detailed Wiring Table**

| Component | Component Pin | ESP32 Pin | Power / Voltage | Note |
| :--- | :--- | :--- | :--- | :--- |
| **DHT11 Sensor** | VCC | `3V3` | 3.3V DC | Add 10kΩ pull-up resistor between VCC & DATA if using raw 3-pin breakout |
| | DATA | `GPIO 4` | Signal | Digital Input |
| | GND | `GND` | Ground | Common Ground |
| **Soil Moisture Sensor** | VCC | `5V` (or `VIN`) | 5.0V DC | Power supply for sensor board |
| | AOUT (Analog Out) | `GPIO 34` | ADC1_CH6 | Analog Input (Input-Only Pin on ESP32) |
| | GND | `GND` | Ground | Common Ground |
| **5V Relay Module** | VCC | `5V` (or `VIN`) | 5.0V DC | Power for relay coil |
| | IN (Signal) | `GPIO 26` | Signal | Digital Output (`HIGH` = Pump ON, `LOW` = Pump OFF) |
| | GND | `GND` | Ground | Common Ground |
| **Submersible Water Pump** | Positive (+) | Relay `NO` (Normally Open) | External Power + | Switched through Relay contact |
| | Negative (-) | Power Supply (-) | Ground | Connect to power supply ground |
| | Relay `COM` | Power Supply (+) | 5V / 12V DC | Power supply positive line |

> ⚠️ **SAFETY WARNING**: Always connect a **1N4007 diode** in parallel across the pump motor terminals (cathode to +, anode to -) to absorb reverse EMF inductive voltage spikes when the pump turns off.

---

## 📷 3. ESP32-CAM Field Camera Setup

### **ESP32-CAM Pinout Mappings**
- Internal Camera Board: AI-Thinker OV2640.
- Stream URL: `http://<ESP32_CAM_IP>/capture`
- Photo Ingestion API: `POST http://<API_HOST>:8000/api/v1/devices/esp32-cam-01/camera`

---

## 🎯 4. Soil Moisture ADC Calibration Procedure

1. **Air Calibration (Dry 0%)**:
   - Hold the soil sensor probe in dry air.
   - Observe the `rawADC` reading in Arduino Serial Monitor (typically `~3200`).
   - Update `DRY_AIR_ADC` in `aquacrop_node.ino`.

2. **Water Calibration (Wet 100%)**:
   - Submerge probe up to the stop line in a cup of water.
   - Observe `rawADC` reading (typically `~1300`).
   - Update `WET_WATER_ADC` in `aquacrop_node.ino`.

---

## 🚀 5. How to Flash Code via Arduino IDE

1. **Install Libraries**:
   - In Arduino IDE: **Tools -> Manage Libraries**
   - Search & install:
     - `DHT sensor library` by Adafruit
     - `ArduinoJson` (v6 or v7) by Benoit Blanchon

2. **Select Board**:
   - **Tools -> Board -> ESP32 Arduino -> DOIT ESP32 DEVKIT V1**

3. **Set Configuration**:
   - Open [firmware/esp32/aquacrop_node.ino](file:///d:/engine/firmware/esp32/aquacrop_node.ino).
   - Set `WIFI_SSID` and `WIFI_PASS` to your local Wi-Fi router.
   - Set `API_HOST` to your laptop's Local IP (e.g. `http://192.168.1.10:8000`).

4. **Upload & Monitor**:
   - Click **Upload**.
   - Open Serial Monitor at **115200 baud** to monitor live Wi-Fi connection, DHT11 readings, soil moisture, and relay pump switching!
