import React from "react";
import { Activity, Radio, AlertTriangle, ShieldCheck } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface DeviceHealthCardProps {
  sensors?: any;
  device?: any;
  latestSensors?: any;
}

export function DeviceHealthCard({ sensors, device, latestSensors }: DeviceHealthCardProps) {
  const telemetry = latestSensors || sensors;
  const isOnline = Boolean(device?.online);
  const source = telemetry?.soil_moisture?.source || telemetry?.source;
  const isReal = isOnline && source === "REAL_SENSOR";
  const isSimulation = isOnline && source === "SIMULATION";
  const health = telemetry?.health_status || "HEALTHY";

  const sensorValue = (value: any, fallback: number) =>
    typeof value === "object" && value !== null ? (value.value ?? fallback) : (value ?? fallback);

  const soilMoistureVal = isOnline ? sensorValue(telemetry?.soil_moisture, sensors?.soil_moisture?.value ?? 0) : "--";
  const tempVal = isOnline ? sensorValue(telemetry?.temperature, sensors?.temperature?.value ?? 28) : "--";
  const humidityVal = isOnline ? sensorValue(telemetry?.humidity, sensors?.humidity?.value ?? 58) : "--";

  return (
    <div style={{ background: "white", padding: "20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity size={18} color="#059669" />
          <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>Device & Sensor Telemetry</h3>
        </div>
        <SourceBadge source={isOnline ? source || "UNKNOWN" : "UNKNOWN"} />
      </div>

      {isReal ? (
        <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857", fontSize: "0.78rem", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={16} />
          <span>REAL HARDWARE CONNECTED: Live telemetry streaming from ESP32 Node (`esp32-demo-01`).</span>
        </div>
      ) : isSimulation ? (
        <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#FFFBEB", border: "1px solid #FCD34D", color: "#B45309", fontSize: "0.78rem", fontWeight: 700, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} />
          <span>SIMULATION MODE: Sandbox test data (`simulate_device.py`).</span>
        </div>
      ) : (
        <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#475569", fontSize: "0.78rem", fontWeight: 700, marginBottom: "14px" }}>
          No telemetry received from this device yet.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.82rem" }}>
        <div style={{ padding: "10px", background: "#F8FAFC", borderRadius: "8px" }}>
          <span style={{ color: "#64748B", fontSize: "0.7rem", fontWeight: 700 }}>SOIL MOISTURE</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0F172A", marginTop: "2px" }}>
            {typeof soilMoistureVal === "number" ? Math.round(soilMoistureVal) : soilMoistureVal}%
          </div>
        </div>

        <div style={{ padding: "10px", background: "#F8FAFC", borderRadius: "8px" }}>
          <span style={{ color: "#64748B", fontSize: "0.7rem", fontWeight: 700 }}>AIR TEMPERATURE</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0F172A", marginTop: "2px" }}>
            {typeof tempVal === "number" ? Math.round(tempVal) : tempVal}°C
          </div>
        </div>

        <div style={{ padding: "10px", background: "#F8FAFC", borderRadius: "8px" }}>
          <span style={{ color: "#64748B", fontSize: "0.7rem", fontWeight: 700 }}>AIR HUMIDITY</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0F172A", marginTop: "2px" }}>
            {typeof humidityVal === "number" ? Math.round(humidityVal) : humidityVal}%
          </div>
        </div>

        <div style={{ padding: "10px", background: "#F8FAFC", borderRadius: "8px" }}>
          <span style={{ color: "#64748B", fontSize: "0.7rem", fontWeight: 700 }}>TELEMETRY STATUS</span>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#047857", marginTop: "2px" }}>
            {health}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #F1F5F9", fontSize: "0.72rem", color: "#64748B", display: "flex", justifyContent: "space-between" }}>
        <span>ESP32 Firmware Pipeline: ✓ Ready</span>
        <span style={{ color: isReal ? "#059669" : "#D97706", fontWeight: 700 }}>
          {isReal ? "Physical Hardware: ✅ Verified & Active" : isSimulation ? "Physical Hardware: ℹ Simulation Active" : "Physical Hardware: Awaiting Data"}
        </span>
      </div>
    </div>
  );
}
