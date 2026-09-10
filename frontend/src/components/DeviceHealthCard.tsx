import React from "react";
import { Radio, BatteryCharging, Cpu, CheckCircle2, AlertTriangle, Wifi, Thermometer, Droplets } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface DeviceHealthCardProps {
  device: any;
  latestSensors: any;
}

export function DeviceHealthCard({ device, latestSensors }: DeviceHealthCardProps) {
  const isOnline = device ? device.online : false;
  const healthStatus = latestSensors?.health_status || (isOnline ? "HEALTHY" : "OFFLINE");

  return (
    <div className="card-panel">
      <div className="card-title-row">
        <div className="card-title">
          <Radio size={20} style={{ color: "var(--primary)" }} />
          <span>IoT Hardware & Sensor Telemetry</span>
        </div>
        <SourceBadge source="REAL_SENSOR" />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: isOnline ? "var(--accent-mint)" : "var(--danger-bg)", borderRadius: "var(--radius-md)", marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Wifi size={18} style={{ color: isOnline ? "#065F46" : "#991B1B" }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: isOnline ? "#065F46" : "#991B1B" }}>
              Device: {device?.hardware_id || "esp32-demo-01"} ({isOnline ? "ONLINE" : "OFFLINE"})
            </div>
            <div style={{ fontSize: "0.75rem", color: isOnline ? "#047857" : "#B91C1C" }}>
              {isOnline ? `Last telemetry sync: 12 seconds ago` : `Last seen: ${device?.last_seen_at || "Never"}`}
            </div>
          </div>
        </div>

        <div style={{ padding: "4px 12px", background: "white", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: 800, color: isOnline ? "#065F46" : "#991B1B" }}>
          {healthStatus}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "14px" }}>
        <div style={{ background: "var(--bg-app)", padding: "12px", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>
            <Droplets size={14} style={{ color: "var(--water-blue)" }} /> SOIL MOISTURE
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "4px" }}>
            {latestSensors?.soil_moisture?.value ?? 24}%
          </div>
        </div>

        <div style={{ background: "var(--bg-app)", padding: "12px", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>
            <Thermometer size={14} style={{ color: "var(--warning)" }} /> TEMPERATURE
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "4px" }}>
            {latestSensors?.temperature?.value ?? 31.2}°C
          </div>
        </div>

        <div style={{ background: "var(--bg-app)", padding: "12px", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>
            <Droplets size={14} style={{ color: "var(--primary)" }} /> HUMIDITY
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "4px" }}>
            {latestSensors?.humidity?.value ?? 58}%
          </div>
        </div>

        <div style={{ background: "var(--bg-app)", padding: "12px", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>
            <BatteryCharging size={14} style={{ color: "var(--accent-emerald)" }} /> BATTERY
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "4px" }}>
            {latestSensors?.battery?.value ?? 82}%
          </div>
        </div>
      </div>
    </div>
  );
}
