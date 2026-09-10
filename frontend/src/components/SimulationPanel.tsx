import React, { useState } from "react";
import { Play, AlertTriangle, CheckCircle2, Clock, Code, ChevronDown, ChevronUp } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface SimulationPanelProps {
  field: any;
  currentDecision: any;
  onRunSimulation: (scenario: string) => void;
  simResult: any;
}

export function SimulationPanel({ field, currentDecision, onRunSimulation, simResult }: SimulationPanelProps) {
  const [showJson, setShowJson] = useState(false);

  const dec = simResult?.decision;
  const action = dec?.action || "NO_DATA";
  const estimatedLitres = dec?.estimated_water_litres;
  const liters = typeof estimatedLitres === "object" && estimatedLitres !== null
    ? (estimatedLitres.value ?? 0)
    : (estimatedLitres ?? dec?.litres_estimated ?? 0);
  const durSec = dec?.estimated_duration_seconds ?? dec?.duration_seconds ?? 0;
  const durMins = Math.round(durSec / 60);

  let actionColor = "#059669";
  let actionBg = "#ECFDF5";
  if (action === "IRRIGATE") {
    actionColor = "#2563EB";
    actionBg = "#EFF6FF";
  } else if (action === "DELAY") {
    actionColor = "#D97706";
    actionBg = "#FFFBEB";
  }

  return (
    <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Play size={22} color="#D97706" />
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>What-If Simulation Sandbox</h2>
            <span style={{ fontSize: "0.78rem", color: "#64748B" }}>Test Extreme Weather & Soil Moisture Scenarios</span>
          </div>
        </div>
        <SourceBadge source="SIMULATION" />
      </div>

      <div style={{ padding: "12px 14px", background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: "10px", color: "#B45309", fontSize: "0.78rem", fontWeight: 700, marginBottom: "20px" }}>
        ⚠ <strong>SIMULATION MODE:</strong> Runs scenarios in an isolated sandbox without altering live field telemetry.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <button
          onClick={() => onRunSimulation("drought_20pct")}
          style={{ padding: "14px", borderRadius: "10px", border: "1px solid #CBD5E1", background: "#F8FAFC", cursor: "pointer", textAlign: "left" }}
        >
          <div style={{ fontWeight: 800, color: "#B91C1C" }}>🔥 Severe Drought (20% Moisture)</div>
          <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "4px" }}>Simulate extreme soil water depletion</div>
        </button>

        <button
          onClick={() => onRunSimulation("heavy_rain_50mm")}
          style={{ padding: "14px", borderRadius: "10px", border: "1px solid #CBD5E1", background: "#F8FAFC", cursor: "pointer", textAlign: "left" }}
        >
          <div style={{ fontWeight: 800, color: "#1D4ED8" }}>🌧 Heavy Rain (50mm Expected)</div>
          <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "4px" }}>Simulate intense storm forecast</div>
        </button>

        <button
          onClick={() => onRunSimulation("heatwave_38c")}
          style={{ padding: "14px", borderRadius: "10px", border: "1px solid #CBD5E1", background: "#F8FAFC", cursor: "pointer", textAlign: "left" }}
        >
          <div style={{ fontWeight: 800, color: "#D97706" }}>☀️ Heatwave (38°C Peak)</div>
          <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "4px" }}>Simulate elevated ET0 demand</div>
        </button>
      </div>

      {simResult && (
        <div style={{ padding: "20px", background: "#F8FAFC", borderRadius: "14px", border: "1px solid #CBD5E1" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0F172A" }}>
                Simulation Evaluated Decision
              </span>
              <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                Scenario: <strong>{simResult.scenario}</strong> · Code: <code>{dec?.public_code || "SIM-DEC"}</code>
              </div>
            </div>
            <SourceBadge source="SIMULATION" />
          </div>

          {/* VISUAL EXECUTIVE SUMMARY CARD */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            <div style={{ padding: "14px", background: actionBg, borderRadius: "10px", border: `1px solid ${actionColor}40` }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: actionColor, textTransform: "uppercase" }}>RECOMMENDED ACTION</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: actionColor, marginTop: "4px" }}>{action}</div>
            </div>

            <div style={{ padding: "14px", background: "white", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>NET WATER VOLUME</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0F172A", marginTop: "4px" }}>{liters ? `${liters.toLocaleString()} L` : "0 L"}</div>
            </div>

            <div style={{ padding: "14px", background: "white", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>RUN DURATION</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#0F172A", marginTop: "4px" }}>{durMins} mins</div>
            </div>
          </div>

          {/* REASONING & WHY */}
          {dec?.explanation?.why && (
            <div style={{ padding: "12px 14px", background: "white", borderRadius: "10px", border: "1px solid #E2E8F0", marginBottom: "14px", fontSize: "0.85rem" }}>
              <strong>Reasoning:</strong> {Array.isArray(dec.explanation.why) ? dec.explanation.why.join(" ") : dec.explanation.why}
            </div>
          )}

          {/* TOGGLE FULL JSON DEVELOPER VIEW */}
          <button
            onClick={() => setShowJson(!showJson)}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, padding: 0 }}
          >
            <Code size={16} />
            <span>{showJson ? "Hide Raw Payload JSON" : "View Raw Payload JSON"}</span>
            {showJson ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showJson && (
            <pre style={{ marginTop: "12px", padding: "14px", background: "#0F172A", color: "#38BDF8", borderRadius: "10px", fontSize: "0.78rem", overflowX: "auto" }}>
              {JSON.stringify(simResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
