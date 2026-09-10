import React, { useEffect, useState } from "react";
import { Camera, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SourceBadge } from "./SourceBadge";
import { api } from "../api";

export function FieldCameraCard({ field }: { field: any }) {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (!field?.id) return;
    const refresh = () => api(`/fields/${field.id}/camera/status`).then(setStatus).catch(() => setStatus(null));
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [field?.id]);

  const online = status?.status === "ONLINE";
  return (
    <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Camera size={20} color="#2563EB" />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>ESP32-CAM Field Camera</h3>
        </div>
        <SourceBadge source={online ? "REAL_CAMERA" : "UNKNOWN"} />
      </div>

      <div style={{ width: "100%", height: "240px", background: "#0F172A", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", position: "relative", overflow: "hidden" }}>
        <Camera size={48} color="#10B981" />
        <div style={{ marginTop: "12px", fontWeight: 700, fontSize: "0.9rem" }}>{online ? "ESP32-CAM Snapshot Active" : "ESP32-CAM Not Connected"}</div>
        <div style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "4px" }}>{online ? `Last snapshot: ${new Date(status.last_snapshot_at).toLocaleTimeString()}` : "Waiting for a camera snapshot"}</div>
        
        <div style={{ position: "absolute", bottom: "12px", left: "12px", background: "rgba(6, 78, 59, 0.85)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.7rem", color: "#34D399", fontWeight: 700 }}>
          {online ? "✅ Hardware Snapshot Received" : "⚠ No Recent Camera Data"}
        </div>
      </div>

      <div style={{ marginTop: "16px", padding: "12px 16px", background: "#F8FAFC", borderRadius: "10px", fontSize: "0.8rem", color: "#475569" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Backend Snapshot Proxy (`/api/cam/snapshot`):</span>
          <span style={{ color: online ? "#059669" : "#B45309", fontWeight: 700 }}>{online ? "✓ PASS" : "— WAITING"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Physical Camera Hardware:</span>
          <span style={{ color: online ? "#059669" : "#B45309", fontWeight: 700 }}>{online ? "✅ Verified & Active" : "⚠ Not connected"}</span>
        </div>
      </div>
    </div>
  );
}
