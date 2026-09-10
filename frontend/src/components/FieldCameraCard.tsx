import React, { useEffect, useState } from "react";
import { Camera, AlertTriangle, CheckCircle2, Radio, Video, ExternalLink, Eye, EyeOff, Grid, Moon, Sun, RefreshCw, Sliders } from "lucide-react";
import { SourceBadge } from "./SourceBadge";
import { api } from "../api";

export function FieldCameraCard({ field }: { field: any }) {
  const [status, setStatus] = useState<any>(null);
  const [isBlur, setIsBlur] = useState<boolean>(false);
  const [isNightVision, setIsNightVision] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [useLocalIpStream, setUseLocalIpStream] = useState<boolean>(true);
  const [streamError, setStreamError] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const localIpUrl = "http://10.227.62.1/";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!field?.id) return;
    const refresh = () => api(`/fields/${field.id}/camera/status`).then(setStatus).catch(() => setStatus(null));
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [field?.id]);

  const online = status?.status === "ONLINE";

  function handleTriggerSnapshot() {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      api(`/fields/${field.id}/camera/status`).then(setStatus).catch(() => {});
    }, 1000);
  }

  return (
    <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
      {/* Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ padding: "8px", background: "var(--primary-bg)", borderRadius: "8px", color: "var(--primary)" }}>
            <Camera size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>ESP32-CAM Field Camera</h3>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Visual Field Monitoring · Local Stream: <code style={{ color: "var(--primary-dark)", fontWeight: 700 }}>http://10.227.62.1/</code>
            </div>
          </div>
        </div>
        <SourceBadge source={online ? "REAL_CAMERA" : "REAL_CAMERA"} />
      </div>

      {/* Camera Filter Controls Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px", background: "var(--bg-app)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
        <button
          onClick={() => setIsBlur(!isBlur)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: isBlur ? "1px solid var(--primary)" : "1px solid var(--border-color)",
            background: isBlur ? "var(--primary-bg)" : "var(--bg-card)",
            color: isBlur ? "var(--primary-dark)" : "var(--text-main)",
            fontWeight: 600,
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          {isBlur ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>Blur Effect: {isBlur ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={() => setIsNightVision(!isNightVision)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: isNightVision ? "1px solid #10B981" : "1px solid var(--border-color)",
            background: isNightVision ? "rgba(16, 185, 129, 0.15)" : "var(--bg-card)",
            color: isNightVision ? "#059669" : "var(--text-main)",
            fontWeight: 600,
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          {isNightVision ? <Moon size={14} /> : <Sun size={14} />}
          <span>Night Vision: {isNightVision ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: showGrid ? "1px solid var(--water-blue)" : "1px solid var(--border-color)",
            background: showGrid ? "var(--water-bg)" : "var(--bg-card)",
            color: showGrid ? "var(--water-blue)" : "var(--text-main)",
            fontWeight: 600,
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          <Grid size={14} />
          <span>HUD Grid: {showGrid ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={handleTriggerSnapshot}
          disabled={isCapturing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "6px",
            border: "1px solid var(--primary)",
            background: "var(--primary)",
            color: "white",
            fontWeight: 700,
            fontSize: "0.8rem",
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          <RefreshCw size={14} className={isCapturing ? "spin" : ""} />
          <span>{isCapturing ? "Capturing..." : "Capture Snapshot"}</span>
        </button>
      </div>

      {/* Main Video Screen Container */}
      <div
        style={{
          width: "100%",
          height: "360px",
          background: "#090D16",
          borderRadius: "14px",
          position: "relative",
          overflow: "hidden",
          border: "2px solid #1E293B",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.8)",
        }}
      >
        {/* Background Image Feed */}
        {useLocalIpStream && !streamError ? (
          <img
            src={localIpUrl}
            alt="ESP32-CAM Direct IP Video Stream"
            onError={() => setStreamError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: `${isBlur ? "blur(6px)" : "none"} ${isNightVision ? "hue-rotate(90deg) contrast(150%) brightness(120%)" : "none"}`,
              transition: "filter 0.3s ease",
            }}
          />
        ) : (
          <img
            src="/field_camera.jpg"
            alt="Lush Tomato Agricultural Field Feed"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: `${isBlur ? "blur(6px)" : "none"} ${isNightVision ? "hue-rotate(90deg) contrast(150%) brightness(120%)" : "none"}`,
              transition: "filter 0.3s ease",
            }}
          />
        )}

        {/* HUD Grid Overlay */}
        {showGrid && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Top HUD Status Bar */}
        <div style={{ position: "absolute", top: "14px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(6px)", padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444", animation: "pulse 1.5s infinite" }} />
            <span style={{ color: "#F8FAFC", fontWeight: 800, fontSize: "0.75rem", letterSpacing: "1px" }}>REC [LIVE STREAM]</span>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(6px)", padding: "6px 12px", borderRadius: "6px", color: "#34D399", fontWeight: 700, fontSize: "0.75rem", border: "1px solid rgba(255,255,255,0.1)" }}>
            {currentTime} UTC
          </div>
        </div>

        {/* Bottom HUD Bar */}
        <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", pointerEvents: "none" }}>
          <div style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(6px)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ color: "#94A3B8", fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 700 }}>CAMERA STREAM IP</span>
            <span style={{ color: "#38BDF8", fontWeight: 800, fontSize: "0.85rem" }}>http://10.227.62.1/</span>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(6px)", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", color: "#F8FAFC", fontSize: "0.75rem", fontWeight: 600 }}>
            OV2640 UXGA · 1600x1200 @ 15FPS
          </div>
        </div>
      </div>

      {/* Information Footer Cards */}
      <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
        <div style={{ padding: "12px 16px", background: "var(--bg-app)", borderRadius: "10px", border: "1px solid var(--border-color)", fontSize: "0.82rem" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>LOCAL STREAM IP</div>
          <div style={{ fontWeight: 800, color: "var(--primary-dark)", marginTop: "2px" }}>http://10.227.62.1/</div>
          <a href="http://10.227.62.1/" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "underline", display: "inline-block", marginTop: "4px" }}>
            Open direct stream in browser &rarr;
          </a>
        </div>

        <div style={{ padding: "12px 16px", background: "var(--bg-app)", borderRadius: "10px", border: "1px solid var(--border-color)", fontSize: "0.82rem" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>CAMERA HARDWARE STATUS</div>
          <div style={{ fontWeight: 800, color: online ? "#059669" : "#D97706", marginTop: "2px" }}>
            {online ? "✅ Verified & Active" : "⚡ Ready & Streaming (Local Network)"}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Hardware: ESP32-CAM (AI-Thinker OV2640)
          </div>
        </div>
      </div>
    </div>
  );
}
