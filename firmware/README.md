# Hardware safety (hackathon)

- Use a **low-voltage** LED, servo, or small pump with a **relay/MOSFET driver**.
- Never put 13V or mains on an ESP32 GPIO.
- Capacitive soil moisture analog pin through the sensor module only.
- Optional DHT22 on a data pin with 3.3V.
- Demo actuator on GPIO2 (onboard LED) is enough to prove the command path.
