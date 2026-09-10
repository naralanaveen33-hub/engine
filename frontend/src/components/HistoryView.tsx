import React, { useEffect, useState } from "react";
import { History, CheckCircle2, Clock, AlertCircle, Droplets } from "lucide-react";
import { api } from "../api";
import { SourceBadge } from "./SourceBadge";

export function HistoryView({ fieldId }: { fieldId: string }) {
  const [historyRows, setHistoryRows] = useState<any[]>([]);

  useEffect(() => {
    if (fieldId) {
      api(`/fields/${fieldId}/irrigation/history`)
        .then((d) => setHistoryRows(d as any[]))
        .catch(console.error);
    }
  }, [fieldId]);

  return (
    <div>
      <div className="greeting-hero">
        <div>
          <h1 className="greeting-title">Irrigation Audit History</h1>
          <p className="greeting-sub">Immutable decision traces, farmer confirmations, and execution logs</p>
        </div>
      </div>

      <div className="card-panel">
        <div className="card-title-row">
          <div className="card-title">
            <History size={20} style={{ color: "var(--primary)" }} />
            <span>Decision & Execution Audit Logs</span>
          </div>
        </div>

        {historyRows.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
            No historical irrigation decisions logged for this field yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {historyRows.map((row) => (
              <div key={row.decision_id} style={{ padding: "18px", background: "var(--bg-app)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>{row.public_code}</span>
                    <span className={`decision-action-badge ${row.action}`} style={{ fontSize: "0.75rem", padding: "4px 12px" }}>
                      {row.action}
                    </span>
                  </div>

                  <SourceBadge source={row.mode === "SIMULATION" ? "SIMULATION" : "REAL_SENSOR"} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginTop: "12px", fontSize: "0.82rem" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Estimated Volume:</span>{" "}
                    <strong>{row.estimated_water_litres?.value ?? 0} Litres</strong>
                  </div>

                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Execution Status:</span>{" "}
                    <strong style={{ color: row.execution?.status === "EXECUTED" ? "var(--accent-emerald)" : "var(--text-main)" }}>
                      {row.execution?.status || "PENDING"}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Created At:</span>{" "}
                    <span>{row.created_at ? new Date(row.created_at).toLocaleString() : "Today"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
