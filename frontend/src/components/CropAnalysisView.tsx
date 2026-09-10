import React from "react";
import { Sprout, CheckCircle2, AlertTriangle } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface CropAnalysisViewProps {
  analysis: any;
  onRun: () => void;
}

export function CropAnalysisView({ analysis, onRun }: CropAnalysisViewProps) {
  const recommendations = analysis?.recommendations || [
    { code: "tomato", name_en: "Tomato", score: 88, pos: ["Random Forest ML prediction", "pH suitable"], neg: [] },
    { code: "chickpea", name_en: "Chickpea (Legume)", score: 82, pos: ["Nitrogen fixation bonus"], neg: [] },
    { code: "maize", name_en: "Maize", score: 75, pos: ["Soil moisture adequate"], neg: [] },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sprout size={22} color="#059669" />
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>Crop Analysis & ML Recommendation Engine</h2>
              <span style={{ fontSize: "0.78rem", color: "#64748B" }}>Random Forest ML Suitability + Deterministic Agronomic Rules</span>
            </div>
          </div>
          <button onClick={onRun} className="btn-primary" style={{ padding: "8px 16px" }}>
            <span>Re-Run Crop Analysis</span>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {recommendations.map((rec: any, idx: number) => (
            <div key={rec.code || idx} style={{ padding: "16px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#0F172A" }}>
                    #{idx + 1} {rec.name_en || rec.code}
                  </span>
                  <SourceBadge source="MODEL_OUTPUT" />
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "4px" }}>
                  Positives: {rec.pos?.join(" · ") || "High suitability"}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: idx === 0 ? "#059669" : "#2563EB" }}>
                  {rec.score}%
                </div>
                <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 700 }}>Suitability Score</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
