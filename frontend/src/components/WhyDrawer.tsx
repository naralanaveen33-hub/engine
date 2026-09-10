import React from "react";
import { X, CheckCircle2, AlertCircle, Cpu, Database, Compass } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface WhyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  decision: any;
}

export function WhyDrawer({ isOpen, onClose, decision }: WhyDrawerProps) {
  if (!isOpen || !decision) return null;

  const explanation = decision.explanation || {};
  const whyList: string[] = explanation.why || [];
  const dataUsed: string[] = explanation.data_used || [];
  const couldChange: string[] = explanation.could_change || [];

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Explainable Decision Intelligence
            </span>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>Why AquaCrop Recommends This</h2>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle2 size={16} style={{ color: "var(--accent-emerald)" }} />
            <span>PRIMARY REASON CODES</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {whyList.map((reason, idx) => (
              <div key={idx} style={{ padding: "12px 16px", background: "var(--bg-app)", borderRadius: "var(--radius-md)", borderLeft: "4px solid var(--accent-emerald)", fontSize: "0.9rem", fontWeight: 600 }}>
                {reason}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Database size={16} style={{ color: "var(--water-blue)" }} />
            <span>DATA SOURCES UTILIZED</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {dataUsed.map((item, idx) => (
              <span key={idx} style={{ padding: "6px 12px", background: "var(--bg-app)", borderRadius: "var(--radius-md)", fontSize: "0.8rem", fontWeight: 700, border: "1px solid var(--border)" }}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {couldChange.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Compass size={16} style={{ color: "var(--warning)" }} />
              <span>WHAT COULD CHANGE THIS DECISION?</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {couldChange.map((item, idx) => (
                <div key={idx} style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--warning)" }}>•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: "auto", padding: "16px", background: "var(--primary-bg)", borderRadius: "var(--radius-md)", fontSize: "0.8rem", color: "var(--primary-dark)" }}>
          <div style={{ fontWeight: 800, marginBottom: "2px" }}>Engine Architecture Notice</div>
          This decision was computed deterministically by <code>{decision.rule_version || "irrigation-engine-v1"}</code>. The conversational LLM does not independently calculate water quantities or activate physical hardware.
        </div>
      </div>
    </div>
  );
}
