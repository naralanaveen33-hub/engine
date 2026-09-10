import React, { useState, useEffect } from "react";
import { Camera, RefreshCw, Maximize2, ShieldAlert, CheckCircle, AlertTriangle, Radio } from "lucide-react";
import { SourceBadge } from "./SourceBadge";
import { api } from "../api";

interface FieldCameraCardProps {
  field: any;
}

export function FieldCameraCard({ field }: FieldCameraCardProps) {
  const [camStatus, setCamStatus] = useState<any>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  async function fetchCameraData() {
    if (!field) return;
    setLoading(true);
    try {
      const status = await api(`/fields/${field.id}/camera/status`);
      setCamStatus(status);
      const snap = await api(`/fields/${field.id}/camera/snapshot`);
      setSnapshotUrl(snap.image_url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCameraData();
  }, [field?.id]);

  const isOnline = camStatus?.status === "ONLINE";

  return (
    <div className="card-panel" style={{ position: "relative" }}>
      <div className="card-title-row">
        <div className="card-title">
          <Camera size={20} style={{ color: "var(--primary)" }} />
          <span>Field Visual Monitoring (ESP32-CAM)</span>
        </div>
        <SourceBadge source={camStatus?.source || "REAL_CAMERA"} />
      </div>

      <div style={{ position: "relative", marginBottom: "16px", borderRadius: "var(--radius-md)", overflow: "hidden", background: "#0F172A", height: fullScreen ? "480px" : "280px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {snapshotUrl ? (
          <img
            src={snapshotUrl}
            alt="ESP32-CAM Field View"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ textAlign: "center", color: "#94A3B8" }}>
            <Camera size={40} style={{ marginBottom: "8px", opacity: 0.5 }} />
            <p style={{ fontSize: "0.85rem" }}>Camera stream connecting...</p>
          </div>
        )}

        <div style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(15, 23, 42, 0.8)", padding: "4px 10px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: 700, color: "white", backdropFilter: "blur(4px)" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isOnline ? "#10B981" : "#EF4444" }}></span>
          <span>{isOnline ? "LIVE FEED" : "SIMULATION / OFFLINE"}</span>
        </div>

        <button
          onClick={() => setFullScreen(!fullScreen)}
          style={{ position: "absolute", bottom: "12px", right: "12px", background: "rgba(15, 23, 42, 0.8)", border: "none", color: "white", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", fontWeight: 600, backdropFilter: "blur(4px)" }}
        >
          <Maximize2 size={14} />
          <span>{fullScreen ? "Exit Fullscreen" : "Full Screen"}</span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)", marginBottom: "14px" }}>
        <div>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>DEVICE STATUS</span>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: isOnline ? "var(--primary-dark)" : "var(--warning)" }}>
            {camStatus?.status || "CONNECTED"}
          </div>
        </div>

        <div>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>MODEL</span>
          <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{camStatus?.camera_model || "ESP32-CAM (OV2640)"}</div>
        </div>

        <div>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>RESOLUTION</span>
          <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{camStatus?.resolution || "1600x1200"}</div>
        </div>

        <div>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>CAPTURED AT</span>
          <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{camStatus?.last_snapshot_at ? new Date(camStatus.last_snapshot_at).toLocaleTimeString() : "Just now"}</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
          🛡 Visual monitoring node — isolated from pump actuators
        </span>
        <button className="btn-secondary" onClick={fetchCameraData} disabled={loading} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          <span>Refresh Snapshot</span>
        </button>
      </div>
    </div>
  );
}
