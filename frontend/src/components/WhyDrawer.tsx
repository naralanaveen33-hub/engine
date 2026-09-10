import React from "react";
import { X, HelpCircle, CheckCircle } from "lucide-react";

interface WhyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  decision: any;
}

export function WhyDrawer({ isOpen, onClose, decision }: WhyDrawerProps) {
  if (!isOpen) return null;

  const rec = decision?.recommendation || {};
  const inputs = decision?.inputs_summary || {};

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ background: "white", width: "100%", maxWidth: "500px", height: "100%", padding: "28px", overflowY: "auto", boxShadow: "-10px 0 25px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <HelpCircle size={22} color="#059669" />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>Irrigation Explainability ("Why")</h3>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748B" }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ fontSize: "0.88rem", color: "#334155", lineHeight: "1.6", marginBottom: "20px" }}>
          AquaCrop uses the standard <strong>FAO-56 Penman-Monteith methodology</strong> combined with real-time weather forecasts from Open-Meteo and field geometry.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
          <div style={{ padding: "14px", background: "#F8FAFC", borderRadius: "10px", borderLeft: "4px solid #059669" }}>
            <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "0.85rem" }}>1. Reference Evapotranspiration (ET0)</div>
            <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "4px" }}>
              ET0 calculated from solar radiation, temperature, relative humidity, and wind speed.
            </div>
          </div>

          <div style={{ padding: "14px", background: "#F8FAFC", borderRadius: "10px", borderLeft: "4px solid #2563EB" }}>
            <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "0.85rem" }}>2. Root Zone Depletion (Dr)</div>
            <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "4px" }}>
              Measures soil moisture deficit against Total Available Water (TAW) and Readily Available Water (RAW).
            </div>
          </div>

          <div style={{ padding: "14px", background: "#F8FAFC", borderRadius: "10px", borderLeft: "4px solid #D97706" }}>
            <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "0.85rem" }}>3. Safety Capping Protocol</div>
            <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "4px" }}>
              Pump runtime is calculated from irrigation efficiency and capped at a maximum of 7,200s (120 minutes) to prevent accidental flooding.
            </div>
          </div>
        </div>

        <button onClick={onClose} style={{ marginTop: "auto", padding: "12px", borderRadius: "10px", border: "none", background: "#0F172A", color: "white", fontWeight: 800, cursor: "pointer" }}>
          Close Explainability Panel
        </button>
      </div>
    </div>
  );
}
