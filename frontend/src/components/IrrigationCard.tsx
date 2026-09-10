import React from "react";
import { Droplets, AlertTriangle, CheckCircle, Clock, Info, ArrowRight, ShieldCheck } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface IrrigationCardProps {
  decision: any;
  onOpenWhy: () => void;
  onOpenConfirm: () => void;
  isSimulated?: boolean;
}

export function IrrigationCard({ decision, onOpenWhy, onOpenConfirm, isSimulated }: IrrigationCardProps) {
  if (!decision) {
    return (
      <div className="hero-decision-card">
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <Droplets size={48} style={{ color: "var(--primary-light)", marginBottom: "12px" }} />
          <h3>Irrigation Engine Ready</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Select a field to evaluate current water requirement based on real sensors and weather forecasts.</p>
        </div>
      </div>
    );
  }

  const action = decision.action || "DELAY";

  const getActionIcon = () => {
    switch (action) {
      case "IRRIGATE":
        return <Droplets size={24} />;
      case "DELAY":
        return <Clock size={24} />;
      case "DO_NOT_IRRIGATE":
        return <CheckCircle size={24} />;
      default:
        return <Info size={24} />;
    }
  };

  return (
    <div className="hero-decision-card">
      {isSimulated && (
        <div style={{ position: "absolute", top: "12px", right: "16px" }}>
          <SourceBadge source="SIMULATION" />
        </div>
      )}

      <div className="hero-decision-header">
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)" }}>
            Deterministic Operational Decision
          </span>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "2px" }}>Irrigation Recommendation</h2>
        </div>

        <div className={`decision-action-badge ${action}`}>
          {getActionIcon()}
          <span>{action.replace("_", " ")}</span>
        </div>
      </div>

      <p className="decision-summary-text">
        {action === "IRRIGATE" && "Soil moisture is below threshold and significant rainfall is not expected."}
        {action === "DELAY" && "Delay recommended due to high rain forecast or adequate current moisture."}
        {action === "DO_NOT_IRRIGATE" && "Soil moisture is optimal for current crop growth stage."}
      </p>

      <div className="decision-metrics-bar">
        <div className="decision-metric-item">
          <span className="metric-item-label">Estimated Water</span>
          <span className="metric-item-val">{decision.estimated_water_litres?.value ?? decision.litres_estimated ?? 0} L</span>
          <SourceBadge source="ESTIMATED" />
        </div>

        <div className="decision-metric-item">
          <span className="metric-item-label">Soil Moisture</span>
          <span className="metric-item-val">{decision.inputs?.moisture_pct ?? "—"}%</span>
          <SourceBadge source={decision.sources?.moisture || "REAL_SENSOR"} />
        </div>

        <div className="decision-metric-item">
          <span className="metric-item-label">Rain Forecast (24h)</span>
          <span className="metric-item-val">{decision.inputs?.rain_prob_24h ?? 0}%</span>
          <SourceBadge source="WEATHER_API" />
        </div>

        <div className="decision-metric-item">
          <span className="metric-item-label">Engine Confidence</span>
          <span className="metric-item-val">{Math.round((decision.confidence || 0.9) * 100)}%</span>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700 }}>{decision.rule_version}</span>
        </div>
      </div>

      <div className="decision-actions-row">
        {action === "IRRIGATE" && !isSimulated && (
          <button className="btn-primary" onClick={onOpenConfirm} disabled={decision.explanation?.execute_blocked}>
            <ShieldCheck size={18} />
            <span>Review & Confirm Irrigation</span>
          </button>
        )}

        <button className="btn-secondary" onClick={onOpenWhy}>
          <Info size={16} />
          <span>Why This Decision?</span>
        </button>

        {decision.public_code && (
          <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>
            Trace ID: {decision.public_code}
          </span>
        )}
      </div>
    </div>
  );
}
