# 📷 AquaCrop ESP32-CAM Field Camera Firmware

## Overview
The ESP32-CAM board serves as a dedicated **visual field monitoring node** for the AquaCrop platform.

> 🚨 **SAFETY RULE:** The ESP32-CAM is strictly an observation device. It contains **no pump/actuator controls** and CANNOT execute irrigation commands.

## Features
- **Sensor:** OV2640 2MP Camera module.
- **Output:** MJPEG live stream (`/stream`) and high-resolution JPEG snapshots (`/snapshot`).
- **Resolution:** UXGA ($1600 \times 1200$) with PSRAM, or SVGA ($800 \times 600$) without PSRAM.
- **Source Label:** Tagged with `REAL_CAMERA` in the AquaCrop backend.

## Flashing Instructions
1. Select board `AI Thinker ESP32-CAM` in Arduino IDE.
2. Set Partition Scheme to `Huge APP (3MB No OTA/1MB SPIFFS)`.
3. Set PSRAM to `Enabled`.
4. Connect GPIO0 to GND during flashing, then disconnect to run.
