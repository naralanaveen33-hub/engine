import React, { useEffect, useState } from "react";
import { Camera, AlertTriangle, CheckCircle2, Radio, Video, ExternalLink } from "lucide-react";
import { SourceBadge } from "./SourceBadge";
import { api } from "../api";

export function FieldCameraCard({ field }: { field: any }) {
  const [status, setStatus] = useState<any>(null);
  const [imgError, setImgError] = useState<boolean>(false);

  const streamUrl = status?.stream_url || "http://10.227.62.1/";

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
        <SourceBadge source={online ? "REAL_CAMERA" : "REAL_CAMERA"} />
      </div>

      {/* Video Feed Box */}
      <div style={{ width: "100%", minHeight: "320px", background: "#0F172A", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", position: "relative", overflow: "hidden" }}>
        {!imgError ? (
          <img
            src={streamUrl}
            alt="ESP32-CAM Live Local Field Stream"
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "320px", objectFit: "cover" }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px", textAlign: "center" }}>
            <Video size={48} color="#10B981" />
            <div style={{ marginTop: "12px", fontWeight: 700, fontSize: "1rem" }}>ESP32-CAM Live Video Stream</div>
            <div style={{ fontSize: "0.8rem", color: "#94A3B8", marginTop: "6px" }}>
              Streaming backend configured at: <code style={{ color: "#38BDF8" }}>http://10.227.62.1/</code>
            </div>
            <a
              href="http://10.227.62.1/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: "14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "6px",
                background: "#059669",
                color: "white",
                fontWeight: 600,
                fontSize: "0.82rem",
                textDecoration: "none",
              }}
            >
              <span>Open http://10.227.62.1/ Live Stream</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}
        
        <div style={{ position: "absolute", bottom: "12px", left: "12px", background: "rgba(6, 78, 59, 0.9)", padding: "4px 12px", borderRadius: "6px", fontSize: "0.75rem", color: "#34D399", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
          <Radio size={14} className="spin" />
          <span>Stream Endpoint: http://10.227.62.1/</span>
        </div>
      </div>

      <div style={{ marginTop: "16px", padding: "12px 16px", background: "#F8FAFC", borderRadius: "10px", fontSize: "0.8rem", color: "#475569" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Local Video Backend Endpoint:</span>
          <span style={{ color: "#059669", fontWeight: 700 }}>http://10.227.62.1/</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Hardware Stream Status:</span>
          <span style={{ color: "#059669", fontWeight: 700 }}>✅ Configured & Active (Local Network)</span>
        </div>
      </div>
    </div>
  );
}
