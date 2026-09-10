import React, { useEffect, useState } from "react";
import { SlidersHorizontal, Cpu, Database, Server, RefreshCw } from "lucide-react";
import { api } from "../api";

export function EngineerStatusView() {
  const [engData, setEngData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = () => {
    setLoading(true);
    api("/engineer/status")
      .then((d) => setEngData(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div>
      <div className="greeting-hero">
        <div>
          <h1 className="greeting-title">Engineer Status & System Diagnostics</h1>
          <p className="greeting-sub">Raw hardware telemetry, API health, decision traces, and ML metadata</p>
        </div>
        <button className="btn-secondary" onClick={fetchStatus}>
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="card-panel">
        <div className="card-title-row">
          <div className="card-title">
            <SlidersHorizontal size={20} style={{ color: "var(--primary)" }} />
            <span>Raw System Diagnostic Output</span>
          </div>
        </div>

        {engData ? (
          <pre style={{ background: "#0F172A", color: "#F8FAFC", padding: "20px", borderRadius: "var(--radius-md)", overflowX: "auto", fontSize: "0.85rem", lineHeight: 1.5 }}>
            {JSON.stringify(engData, null, 2)}
          </pre>
        ) : (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading engineer diagnostics...
          </div>
        )}
      </div>
    </div>
  );
}
