import React from "react";
import { Droplets, ShieldCheck, HelpCircle, CheckCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface IrrigationCardProps {
  decision: any;
  device?: any;
  onWhyClick: () => void;
  onConfirmClick: () => void;
}

export function IrrigationCard({ decision, device, onWhyClick, onConfirmClick }: IrrigationCardProps) {
  if (!decision) {
    return (
      <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
        <div style={{ color: "#64748B", textAlign: "center" }}>Evaluating field irrigation requirements...</div>
      </div>
    );
  }

  const rec = decision.recommendation || decision;
  const water = decision.water_requirement || {};
  const needed = rec.action === "IRRIGATE";
  const status = decision.execution_status || "DECISION_READY";
  const deviceOnline = Boolean(device?.online);

  return (
    <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: needed ? "#ECFDF5" : "#EFF6FF", color: needed ? "#059669" : "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Droplets size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>FAO-56 Irrigation Recommendation</h3>
            <span style={{ fontSize: "0.75rem", color: "#64748B" }}>Deterministically Calculated Engine Recommendation</span>
          </div>
        </div>
        <SourceBadge source="MODEL_OUTPUT" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", padding: "16px", background: "#F8FAFC", borderRadius: "12px", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}>RECOMMENDED ACTION</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: needed ? "#059669" : "#2563EB", marginTop: "2px" }}>
            {rec.action || "SKIP"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}>NET WATER VOLUME</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A", marginTop: "2px" }}>
            {water.net_water_litres != null ? `${water.net_water_litres.toLocaleString()} L` : "0 L"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}>GROSS WATER VOLUME</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A", marginTop: "2px" }}>
            {water.gross_water_litres != null ? `${water.gross_water_litres.toLocaleString()} L` : "0 L"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 700 }}>EXECUTABLE DURATION</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, color: rec.duration_capped ? "#D97706" : "#0F172A", marginTop: "2px" }}>
            {decision.estimated_duration_seconds ? `${Math.round(decision.estimated_duration_seconds / 60)} mins` : "0 mins"}
          </div>
          {rec.duration_capped && (
            <span style={{ fontSize: "0.68rem", color: "#D97706", fontWeight: 700, display: "block" }}>
              ⚠ Capped by Max 120m Safety Limit
            </span>
          )}
        </div>
      </div>

      <div style={{ fontSize: "0.85rem", color: "#334155", background: "#F1F5F9", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
        <strong>Reasoning:</strong> {rec.reason || decision.explanation?.why?.join(" ") || "Soil water depletion is within safe bounds for current crop stage."}
      </div>

      {/* HARDWARE TRUTHFULNESS STATUS BANNER */}
      <div style={{ padding: "12px 16px", borderRadius: "10px", background: deviceOnline ? "#ECFDF5" : "#FFFBEB", border: `1px solid ${deviceOnline ? "#A7F3D0" : "#FCD34D"}`, marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: deviceOnline ? "#047857" : "#B45309", fontWeight: 800, fontSize: "0.82rem" }}>
          {deviceOnline ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{deviceOnline ? "HARDWARE STATUS: PHYSICAL ACTUATOR VERIFIED & ONLINE" : "HARDWARE STATUS: PHYSICAL ACTUATOR OFFLINE"}</span>
        </div>
        <div style={{ fontSize: "0.75rem", color: deviceOnline ? "#065F46" : "#92400E", marginTop: "4px", lineHeight: "1.4" }}>
          {deviceOnline ? "ESP32 Hardware Node (GPIO 26 Relay & Submersible Motor Pump) connected and verified via Wi-Fi API." : "ESP32 Hardware Node is not sending telemetry. Connect it before running irrigation."}
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={onWhyClick}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid #CBD5E1",
            background: "white",
            fontWeight: 700,
            fontSize: "0.85rem",
            color: "#475569",
            cursor: "pointer",
          }}
        >
          <HelpCircle size={16} />
          <span>Why This Decision?</span>
        </button>

        {needed && deviceOnline && (
          <button
            onClick={onConfirmClick}
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #10B981, #059669)",
              fontWeight: 800,
              fontSize: "0.88rem",
              color: "white",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(16,185,129,0.3)",
            }}
          >
            <ShieldCheck size={18} />
            <span>Authorize Irrigation Execution</span>
          </button>
        )}
      </div>
    </div>
  );
}
