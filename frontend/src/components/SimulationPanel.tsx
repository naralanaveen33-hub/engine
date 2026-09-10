import React from "react";
import { Play, CloudRain, Sun, Flame, Wind, ArrowRight } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface SimulationPanelProps {
  field: any;
  currentDecision: any;
  onRunSimulation: (scenario: string) => Promise<void>;
  simResult: any;
}

export function SimulationPanel({ field, currentDecision, onRunSimulation, simResult }: SimulationPanelProps) {
  const scenarios = [
    { id: "HEAVY_RAIN", label: "Heavy Rain Tomorrow", icon: <CloudRain size={16} />, color: "#0284C7" },
    { id: "DROUGHT", label: "Extended Drought", icon: <Sun size={16} />, color: "#D97706" },
    { id: "HEAT_WAVE", label: "Heat Wave Alert", icon: <Flame size={16} />, color: "#DC2626" },
    { id: "DRY_DAY", label: "Clear Dry Day", icon: <Wind size={16} />, color: "#059669" },
  ];

  return (
    <div>
      <div className="greeting-hero">
        <div>
          <h1 className="greeting-title">Simulation Scenario Engine</h1>
          <p className="greeting-sub">Test context-aware decision shifts without modifying real hardware or weather forecasts</p>
        </div>
      </div>

      <div className="sim-banner">
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>⚡ SIMULATION MODE ACTIVE</div>
          <div style={{ fontSize: "0.85rem", marginTop: "2px" }}>
            Scenarios simulate synthetic environmental overlays. Simulation mode never issues commands to physical ESP32 hardware.
          </div>
        </div>
        <SourceBadge source="SIMULATION" />
      </div>

      <div className="card-panel">
        <div className="card-title-row">
          <div className="card-title">
            <Play size={20} style={{ color: "var(--warning)" }} />
            <span>Select Simulation Scenario</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              className="stat-card"
              style={{ textAlign: "left", cursor: "pointer", border: "1.5px solid var(--border)" }}
              onClick={() => onRunSimulation(sc.id)}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800 }}>{sc.label}</span>
                <div style={{ color: sc.color }}>{sc.icon}</div>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Scenario: <code>{sc.id}</code></div>
            </button>
          ))}
        </div>

        {simResult && (
          <div style={{ padding: "20px", background: "var(--bg-app)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ fontWeight: 800, fontSize: "1rem" }}>Simulation Result: {simResult.scenario}</div>
              <SourceBadge source="SIMULATION" />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <div style={{ padding: "8px 16px", background: "white", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>REAL DECISION</span>
                <div style={{ fontSize: "1rem", fontWeight: 800 }}>{currentDecision?.action || "IRRIGATE"}</div>
              </div>

              <ArrowRight size={20} style={{ color: "var(--text-muted)" }} />

              <div style={{ padding: "8px 16px", background: "#FEF3C7", borderRadius: "var(--radius-md)", border: "1px solid #FDE68A" }}>
                <span style={{ fontSize: "0.7rem", color: "#92400E", fontWeight: 700 }}>SIMULATED DECISION</span>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#92400E" }}>
                  {simResult.decision?.action || "DELAY"}
                </div>
              </div>
            </div>

            <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>
              <strong>Context-Aware Shift Reason:</strong> {simResult.decision?.reason_codes?.join(", ") || "Rain probability override applied in heavy rain scenario."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
