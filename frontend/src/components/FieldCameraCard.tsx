import React from "react";
import { Camera, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

export function FieldCameraCard() {
  return (
    <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Camera size={20} color="#2563EB" />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>ESP32-CAM Field Camera</h3>
        </div>
        <SourceBadge source="SIMULATION" />
      </div>

      <div style={{ width: "100%", height: "240px", background: "#0F172A", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", position: "relative", overflow: "hidden" }}>
        <Camera size={48} color="#64748B" />
        <div style={{ marginTop: "12px", fontWeight: 700, fontSize: "0.9rem" }}>ESP32-CAM Stream Snapshot</div>
        <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px" }}>Software API Endpoint: `/api/cam/snapshot`</div>
        
        <div style={{ position: "absolute", bottom: "12px", left: "12px", background: "rgba(0,0,0,0.7)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.7rem", color: "#FBBF24", fontWeight: 700 }}>
          ⚠ Physical Camera Stream Verification Pending
        </div>
      </div>

      <div style={{ marginTop: "16px", padding: "12px 16px", background: "#F8FAFC", borderRadius: "10px", fontSize: "0.8rem", color: "#475569" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Backend Snapshot Proxy (`/api/cam/snapshot`):</span>
          <span style={{ color: "#059669", fontWeight: 700 }}>✓ PASS</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Physical Camera Hardware:</span>
          <span style={{ color: "#D97706", fontWeight: 700 }}>⚠ Verification Pending</span>
        </div>
      </div>
    </div>
  );
}
