import React, { useState } from "react";
import { Sprout, Cpu, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface CropAnalysisViewProps {
  analysis: any;
  field: any;
  onAnalyze: () => void;
}

export function CropAnalysisView({ analysis, field, onAnalyze }: CropAnalysisViewProps) {
  const [showModelDetails, setShowModelDetails] = useState(false);

  if (!analysis) {
    return (
      <div className="card-panel" style={{ textAlign: "center", padding: "48px 24px" }}>
        <Sprout size={48} style={{ color: "var(--primary)", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Crop Suitability Intelligence</h2>
        <p style={{ color: "var(--text-muted)", maxWidth: "480px", margin: "8px auto 24px" }}>
          Run Crop Analysis for <strong>{field?.name}</strong> to evaluate crop suitability using Random Forest ML model predictions fused with local soil, weather, water, and crop rotation rules.
        </p>
        <button className="btn-primary" style={{ margin: "0 auto" }} onClick={onAnalyze}>
          <Sprout size={18} />
          <span>Run Crop Analysis</span>
        </button>
      </div>
    );
  }

  const recs = analysis.recommendations || [];

  return (
    <div>
      <div className="greeting-hero">
        <div>
          <h1 className="greeting-title">Crop Intelligence</h1>
          <p className="greeting-sub">Ranked suitability for {field?.name} · Model: {analysis.model_version || "crop_rf_v1"}</p>
        </div>
        <button className="btn-secondary" onClick={onAnalyze}>
          <Sprout size={16} />
          <span>Re-analyze</span>
        </button>
      </div>

      <div style={{ padding: "14px 20px", background: "var(--primary-bg)", borderRadius: "var(--radius-md)", color: "var(--primary-dark)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "24px" }}>
        💡 {analysis.disclaimer || "Suitability is a decision-support score, not guaranteed yield or profit."}
      </div>

      <div className="card-panel">
        <div className="card-title-row">
          <div className="card-title">
            <Cpu size={20} style={{ color: "var(--primary)" }} />
            <span>Ranked Crop Suitability Recommendations</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <SourceBadge source="MODEL_OUTPUT" />
            <SourceBadge source="FARMER_INPUT" />
          </div>
        </div>

        {recs.map((item: any) => (
          <div key={item.crop} className="rec-card">
            <div className="rec-rank">
              <div style={{ display: "flex", alignItem: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)" }}>#{item.rank}</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>{item.name_en} ({item.name_te})</span>
              </div>

              <div className="rec-score-pill">
                Suitability: {item.suitability_score}/100
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginTop: "12px" }}>
              {item.positive_factors?.length > 0 && (
                <div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--accent-emerald)", textTransform: "uppercase" }}>POSITIVE FACTORS</span>
                  <ul style={{ listStyle: "none", fontSize: "0.82rem", color: "var(--text-main)", marginTop: "4px" }}>
                    {item.positive_factors.map((pos: string, idx: number) => (
                      <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "3px" }}>
                        <CheckCircle2 size={14} style={{ color: "var(--accent-emerald)", flexShrink: 0, marginTop: "2px" }} />
                        <span>{pos}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.negative_factors?.length > 0 && (
                <div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--warning)", textTransform: "uppercase" }}>RISKS & CONSTRAINTS</span>
                  <ul style={{ listStyle: "none", fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {item.negative_factors.map((neg: string, idx: number) => (
                      <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "3px" }}>
                        <AlertTriangle size={14} style={{ color: "var(--warning)", flexShrink: 0, marginTop: "2px" }} />
                        <span>{neg}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Expandable Model Card */}
      <div className="card-panel">
        <div className="card-title-row" style={{ cursor: "pointer" }} onClick={() => setShowModelDetails(!showModelDetails)}>
          <div className="card-title">
            <Cpu size={18} style={{ color: "var(--primary)" }} />
            <span>ML Model Specifications & Verification (`crop_rf_v1`)</span>
          </div>
          <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
            {showModelDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{showModelDetails ? "Hide Technical Details" : "View Technical Metrics"}</span>
          </button>
        </div>

        {showModelDetails && (
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)", animation: "fadeIn 0.2s ease-out" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "16px" }}>
              <div style={{ background: "var(--bg-app)", padding: "12px", borderRadius: "var(--radius-md)" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>ALGORITHM</span>
                <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>Random Forest Classifier</div>
              </div>
              <div style={{ background: "var(--bg-app)", padding: "12px", borderRadius: "var(--radius-md)" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>HELD-OUT ACCURACY</span>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--accent-emerald)" }}>99.32%</div>
              </div>
              <div style={{ background: "var(--bg-app)", padding: "12px", borderRadius: "var(--radius-md)" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>DATASET SIZE</span>
                <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>2,200 Rows (22 Crops)</div>
              </div>
              <div style={{ background: "var(--bg-app)", padding: "12px", borderRadius: "var(--radius-md)" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>MODEL STATUS</span>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--primary)" }}>{analysis.ml_status}</div>
              </div>
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              <strong>Inference Features (7):</strong> Nitrogen (N), Phosphorus (P), Potassium (K), Temperature (°C), Humidity (%), Soil pH, Rainfall (mm). Extra application variables (location, crop rotation, water availability, market prices) are intentionally evaluated in downstream rule layers to maintain scientific honesty.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
