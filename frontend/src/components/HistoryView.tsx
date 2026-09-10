import React from "react";
import { History, Clock } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface HistoryViewProps {
  fieldId: string;
}

export function HistoryView({ fieldId }: HistoryViewProps) {
  return (
    <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <History size={22} color="#059669" />
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>Irrigation & Telemetry History Timeline</h2>
            <span style={{ fontSize: "0.78rem", color: "#64748B" }}>Audit Log of Evaluated Decisions & Executed Commands</span>
          </div>
        </div>
        <SourceBadge source="MODEL_OUTPUT" />
      </div>

      <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "12px" }}>
        <Clock size={18} color="#64748B" />
        <div style={{ fontSize: "0.85rem", color: "#334155" }}>
          No previous irrigation executions logged for this field. New decision evaluation logs will appear here in chronological order.
        </div>
      </div>
    </div>
  );
}
