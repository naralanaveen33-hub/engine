import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Cpu, Database, Cloud, Radio, Activity } from "lucide-react";

export function EngineerStatusView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* SYSTEM STATUS BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F291E, #1E3A8A)",
          color: "white",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#93C5FD", letterSpacing: "1px", textTransform: "uppercase" }}>
              SYSTEM REALITY & VERIFICATION MATRIX
            </div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginTop: "4px", margin: 0 }}>
              AQUACROP STATUS: <span style={{ color: "#FBBF24" }}>PARTIALLY REAL</span>
            </h1>
            <p style={{ fontSize: "0.88rem", color: "#E2E8F0", marginTop: "6px" }}>
              Software Integration & Live External APIs Complete · Physical ESP32 Hardware Verification Pending
            </p>
          </div>
          <div style={{ padding: "10px 18px", borderRadius: "12px", background: "rgba(251, 191, 36, 0.15)", border: "1px solid #FBBF24", color: "#FBBF24", fontWeight: 800, fontSize: "0.85rem" }}>
            ⚠ HARDWARE VERIFICATION PENDING
          </div>
        </div>
      </div>

      {/* THREE-TIER VERIFICATION MATRIX */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        
        {/* TIER 1: SOFTWARE ENGINES */}
        <div style={{ background: "white", padding: "20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #F1F5F9" }}>
            <Cpu size={20} color="#059669" />
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>Software Engines</h3>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>Backend, GIS, ML & FAO-56 Algorithms</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem" }}>
            <StatusRow label="FastAPI Backend Core" status="VERIFIED" note="All endpoints functional" />
            <StatusRow label="SQLite Database" status="VERIFIED" note="Persists users, farms, fields & logs" />
            <StatusRow label="Backend GIS Math Engine" status="VERIFIED" note="Calculates field area from polygon" />
            <StatusRow label="Random Forest Crop ML" status="VERIFIED" note="Loaded from crop_rf_v1.joblib" />
            <StatusRow label="FAO-56 Irrigation Engine" status="VERIFIED" note="Penman-Monteith ET0 calculations" />
            <StatusRow label="Safety Duration Capper" status="VERIFIED" note="Caps runtime at max 120 mins" />
            <StatusRow label="Sensor Health Engine" status="VERIFIED" note="Fresh, Stale, Offline, Abnormal" />
            <StatusRow label="AI Telugu Voice Agent" status="VERIFIED" note="Gemini 1.5 Flash + DB Tools" />
          </div>
        </div>

        {/* TIER 2: EXTERNAL SERVICES */}
        <div style={{ background: "white", padding: "20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #F1F5F9" }}>
            <Cloud size={20} color="#2563EB" />
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>External Services</h3>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>Third-party APIs & Datasets</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem" }}>
            <StatusRow label="Open-Meteo Forecast API" status="CONNECTED" note="Live weather telemetry" />
            <StatusRow label="Open-Meteo Archive API" status="CONNECTED" note="Historical climate statistics" />
            <StatusRow label="ISRIC SoilGrids API" status="CONNECTED" note="pH, N, Organic Carbon, Texture" />
            <StatusRow label="Google Gemini LLM API" status="CONNECTED" note="Natural language processing" />
            <StatusRow label="Live Mandi Market API" status="NOT_CONNECTED" note="Fallback demo dataset active" isWarning />
          </div>
        </div>

        {/* TIER 3: PHYSICAL HARDWARE */}
        <div style={{ background: "white", padding: "20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #F1F5F9" }}>
            <Radio size={20} color="#D97706" />
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>Physical Hardware</h3>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>ESP32 Sensors & Actuator Loop</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem" }}>
            <StatusRow label="ESP32 Telemetry API" status="VERIFIED" note="Software endpoint ready" />
            <StatusRow label="Soil Moisture Sensor" status="NOT_VERIFIED" note="Physical hardware test pending" isWarning />
            <StatusRow label="DHT11/22 Temp & Humidity" status="NOT_VERIFIED" note="Physical hardware test pending" isWarning />
            <StatusRow label="RFID / IR / Tilt Sensors" status="NOT_VERIFIED" note="Physical hardware test pending" isWarning />
            <StatusRow label="Relay Module & Pump" status="NOT_VERIFIED" note="Physical actuator test pending" isWarning />
            <StatusRow label="ESP32-CAM Camera Board" status="NOT_VERIFIED" note="Physical stream test pending" isWarning />
          </div>
        </div>

      </div>
    </div>
  );
}

function StatusRow({ label, status, note, isWarning }: { label: string; status: string; note: string; isWarning?: boolean }) {
  let badgeBg = "#ECFDF5";
  let badgeColor = "#047857";
  let icon = <CheckCircle2 size={14} />;

  if (status === "NOT_CONNECTED" || status === "NOT_VERIFIED" || isWarning) {
    badgeBg = "#FFFBEB";
    badgeColor = "#B45309";
    icon = <AlertTriangle size={14} />;
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#F8FAFC", borderRadius: "8px" }}>
      <div>
        <div style={{ fontWeight: 700, color: "#1E293B" }}>{label}</div>
        <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{note}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 8px", borderRadius: "12px", background: badgeBg, color: badgeColor, fontSize: "0.7rem", fontWeight: 800 }}>
        {icon}
        <span>{status}</span>
      </div>
    </div>
  );
}
