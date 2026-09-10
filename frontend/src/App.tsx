import { useEffect, useState } from "react";
import { api, setToken, token } from "./api";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { SourceBadge } from "./components/SourceBadge";
import { StatCard } from "./components/StatCard";
import { IrrigationCard } from "./components/IrrigationCard";
import { WhyDrawer } from "./components/WhyDrawer";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { FieldMapCard } from "./components/FieldMapCard";
import { CropAnalysisView } from "./components/CropAnalysisView";
import { AskAquaCropView } from "./components/AskAquaCropView";
import { SimulationPanel } from "./components/SimulationPanel";
import { DeviceHealthCard } from "./components/DeviceHealthCard";
import { HistoryView } from "./components/HistoryView";
import { EngineerStatusView } from "./components/EngineerStatusView";
import { FieldCameraCard } from "./components/FieldCameraCard";

import { Sprout, Droplets, CloudSun, Radio, ShieldAlert, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import "./styles.css";

export default function App() {
  const [email, setEmail] = useState("demo@aquacrop.local");
  const [password, setPassword] = useState("demo1234");
  const [authed, setAuthed] = useState(!!token());
  const [me, setMe] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [field, setField] = useState<any>(null);
  const [tab, setTab] = useState<string>("home");

  const [analysis, setAnalysis] = useState<any>(null);
  const [decision, setDecision] = useState<any>(null);
  const [simResult, setSimResult] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatReply, setChatReply] = useState<any>(null);
  const [err, setErr] = useState("");

  const [showWhy, setShowWhy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [phone, setPhone] = useState("+919876543210");
  const [otpStep, setOtpStep] = useState<"PHONE" | "OTP" | "REGISTER">("PHONE");
  const [otpCode, setOtpCode] = useState("");
  const [otpMsg, setOtpMsg] = useState("");

  const [farmerName, setFarmerName] = useState("Demo Farmer");
  const [farmName, setFarmName] = useState("Swarnandhra Demo Farm");
  const [fieldName, setFieldName] = useState("Tomato Field 1");
  const [cropCode, setCropCode] = useState("tomato");
  const [prevCropCode, setPrevCropCode] = useState("chickpea");

  async function refreshField(id: string) {
    try {
      const f = await api(`/fields/${id}`);
      setField(f);
      const dec = await api(`/fields/${id}/irrigation/evaluate`, { method: "POST", body: "{}" });
      setDecision(dec);
    } catch (e) {
      console.error(e);
    }
  }

  async function boot() {
    try {
      const m = await api("/me");
      setMe(m);
      const fs = (await api("/fields")) as any[];
      setFields(fs);
      if (fs[0]) await refreshField(fs[0].id);
      try {
        setAlerts((await api("/alerts")) as any[]);
      } catch {
        /* farmer role ok */
      }
    } catch (e) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    if (authed) boot();
  }, [authed]);

  async function handleRequestOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErr("");
    setOtpMsg("");
    try {
      const res = await api("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ phone_number: phone }),
      });
      setOtpMsg(res.message);
      setOtpStep("OTP");
    } catch (e: any) {
      setErr(e.message || "Failed to send OTP");
    }
  }

  async function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErr("");
    try {
      const res = await api("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone_number: phone, otp_code: otpCode }),
      });
      if (res.is_registered && res.access_token) {
        setToken(res.access_token);
        setAuthed(true);
      } else {
        setOtpStep("REGISTER");
        setOtpMsg("OTP verified! Complete registration to set up your farm and field.");
      }
    } catch (e: any) {
      setErr(e.message || "Invalid OTP code");
    }
  }

  async function handleRegisterFarmer(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const res = await api("/auth/register-farmer", {
        method: "POST",
        body: JSON.stringify({
          phone_number: phone,
          display_name: farmerName,
          language_pref: "te",
          farm_name: farmName,
          field_name: fieldName,
          latitude: 16.4342,
          longitude: 81.6981,
          current_crop_code: cropCode,
          previous_crop_code: prevCropCode,
          water_availability: "MODERATE",
          irrigation_method: "DRIP",
        }),
      });
      if (res.access_token) {
        setToken(res.access_token);
        setAuthed(true);
      }
    } catch (e: any) {
      setErr(e.message || "Registration failed");
    }
  }

  async function runAnalyze() {
    if (!field) return;
    setErr("");
    try {
      const res = await api(`/fields/${field.id}/crop-analysis`, { method: "POST", body: "{}" });
      setAnalysis(res);
      setTab("crop");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function handleConfirmExec() {
    if (!decision) return;
    await api(`/irrigation/${decision.decision_id}/confirm`, { method: "POST", body: "{}" });
    const ex = await api(`/irrigation/${decision.decision_id}/execute`, { method: "POST", body: "{}" });
    setDecision({ ...decision, confirmed: true, execution: ex });
  }

  async function runSim(scenario: string) {
    if (!field) return;
    try {
      const res = await api("/simulation/scenario", { method: "POST", body: JSON.stringify({ field_id: field.id, scenario }) });
      setSimResult(res);
      setTab("simulation");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function handleAskChat(text?: string) {
    if (!field) return;
    const msg = text ?? chatInput;
    if (!msg.trim()) return;
    try {
      const res = await api("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: msg, field_id: field.id, language: /[\u0C00-\u0C7F]/.test(msg) ? "te" : "en" }),
      });
      setChatReply(res);
      if (res.decision) setDecision(res.decision);
      setTab("ask");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0F291E, #1B4332)", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: "440px", background: "white", padding: "36px", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ width: "52px", height: "52px", background: "linear-gradient(135deg, #10B981, #059669)", borderRadius: "12px", color: "white", display: "flex", alignItems: "center", justify: "center", margin: "0 auto 12px" }}>
              <Sprout size={28} />
            </div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0F172A" }}>AquaCrop</h1>
            <p style={{ fontSize: "0.85rem", color: "#64748B", marginTop: "4px" }}>Location-Aware Agricultural Intelligence & Water Platform</p>
          </div>

          {err && <div style={{ padding: "12px", background: "#FEE2E2", color: "#DC2626", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", fontWeight: 600 }}>⚠ {err}</div>}
          {otpMsg && <div style={{ padding: "12px", background: "#ECFDF5", color: "#059669", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "16px", fontWeight: 600 }}>ℹ {otpMsg}</div>}

          {/* STEP 1: PHONE NUMBER */}
          {otpStep === "PHONE" && (
            <form onSubmit={handleRequestOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>FARMER PHONE NUMBER</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919876543210" style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "1rem", fontWeight: 600 }} />
                <span style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: "4px", display: "block" }}>Enter 10-digit Indian mobile number (+91 format)</span>
              </div>

              <button type="submit" className="btn-primary" style={{ width: "100%", padding: "12px", marginTop: "4px" }}>
                <span>Send Verification OTP</span>
              </button>
            </form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {otpStep === "OTP" && (
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>ENTER 6-DIGIT OTP</label>
                <input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="e.g. 483921" maxLength={6} style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "1.2rem", fontWeight: 800, letterSpacing: "4px", textAlign: "center" }} />
                <span style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "6px", display: "block" }}>
                  💡 <strong>Hackathon Dev Mode:</strong> Check backend/Docker terminal log for printed OTP!
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" className="btn-secondary" onClick={() => setOtpStep("PHONE")} style={{ flex: 1, padding: "10px" }}>
                  Change Number
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: "10px" }}>
                  Verify OTP & Log In
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: FARMER & FIELD REGISTRATION */}
          {otpStep === "REGISTER" && (
            <form onSubmit={handleRegisterFarmer} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0F172A", borderBottom: "1px solid #E2E8F0", paddingBottom: "6px" }}>NEW FARMER & FIELD SETUP</div>
              
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>FARMER NAME</label>
                <input value={farmerName} onChange={(e) => setFarmerName(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.9rem" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>FARM NAME</label>
                <input value={farmName} onChange={(e) => setFarmName(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.9rem" }} />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>FIELD NAME</label>
                <input value={fieldName} onChange={(e) => setFieldName(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.9rem" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>CURRENT CROP</label>
                  <select value={cropCode} onChange={(e) => setCropCode(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1" }}>
                    <option value="tomato">Tomato</option>
                    <option value="chilli">Chilli</option>
                    <option value="rice">Rice</option>
                    <option value="maize">Maize</option>
                    <option value="chickpea">Chickpea</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>PREVIOUS CROP</label>
                  <select value={prevCropCode} onChange={(e) => setPrevCropCode(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1" }}>
                    <option value="chickpea">Chickpea (Legume)</option>
                    <option value="groundnut">Groundnut</option>
                    <option value="tomato">Tomato (Monoculture)</option>
                    <option value="">Unknown</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: "100%", padding: "12px", marginTop: "10px" }}>
                <span>Complete Registration & Enter Platform</span>
              </button>
            </form>
          )}

          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #E2E8F0", fontSize: "0.75rem", color: "#64748B", textAlign: "center" }}>
            Demo Farmer: <code>+919876543210</code> · Engineer: <code>+919999999999</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar activeTab={tab} onTabChange={setTab} userRole={me?.role || "farmer"} />

      <div className="main-wrapper">
        <Topbar
          user={me}
          fields={fields}
          currentField={field}
          onSelectField={refreshField}
          alertCount={alerts.length}
        />

        <main className="content-area">
          {err && (
            <div style={{ padding: "14px 20px", background: "var(--danger-bg)", color: "var(--danger)", borderRadius: "var(--radius-md)", marginBottom: "20px", fontWeight: 600 }}>
              ⚠ {err}
            </div>
          )}

          {/* DASHBOARD TAB (HERO SCREEN) */}
          {tab === "home" && field && (
            <>
              <div className="greeting-hero">
                <div>
                  <h1 className="greeting-title">Good afternoon 👋</h1>
                  <p className="greeting-sub">Your farm is being actively monitored · Selected: <strong>{field.name}</strong></p>
                </div>
                <button className="btn-primary" onClick={runAnalyze}>
                  <Sprout size={18} />
                  <span>Analyze Crop Suitability</span>
                </button>
              </div>

              {/* KPI Stat Cards */}
              <div className="stats-grid">
                <StatCard
                  label="ACTIVE CROPS"
                  value={field.current_crops?.[0]?.name_en || "Tomato"}
                  icon={<Sprout size={20} />}
                  iconBg="var(--primary-bg)"
                  iconColor="var(--primary)"
                  footerText={`Stage: ${field.current_crops?.[0]?.stage || "FLOWERING"}`}
                  source="FARMER_INPUT"
                />

                <StatCard
                  label="SOIL MOISTURE"
                  value={`${field.latest_sensors?.soil_moisture?.value ?? 24}%`}
                  icon={<Droplets size={20} />}
                  iconBg="var(--accent-mint)"
                  iconColor="var(--primary-dark)"
                  footerText={`Health: ${field.latest_sensors?.health_status || "HEALTHY"}`}
                  source={field.latest_sensors?.soil_moisture?.source || "REAL_SENSOR"}
                />

                <StatCard
                  label="OPEN-METEO WEATHER"
                  value="31°C"
                  icon={<CloudSun size={20} />}
                  iconBg="var(--water-bg)"
                  iconColor="var(--water-blue)"
                  footerText="Rain Forecast: 18%"
                  source="WEATHER_API"
                />

                <StatCard
                  label="DEVICE TELEMETRY"
                  value={field.device ? (field.device.online ? "ONLINE" : "OFFLINE") : "ONLINE"}
                  icon={<Radio size={20} />}
                  iconBg="var(--accent-mint)"
                  iconColor="var(--accent-emerald)"
                  footerText={field.device?.hardware_id || "esp32-demo-01"}
                  source="REAL_SENSOR"
                />
              </div>

              <div className="dashboard-grid">
                <div>
                  {/* Hero Irrigation Card */}
                  <IrrigationCard
                    decision={decision}
                    onOpenWhy={() => setShowWhy(true)}
                    onOpenConfirm={() => setShowConfirm(true)}
                  />

                  {/* Leaflet Field Map Card */}
                  <FieldMapCard field={field} />
                </div>

                <div>
                  {/* IoT Telemetry Card */}
                  <DeviceHealthCard device={field.device} latestSensors={field.latest_sensors} />

                  {/* Active Alerts Card */}
                  <div className="card-panel">
                    <div className="card-title-row">
                      <div className="card-title">
                        <ShieldAlert size={20} style={{ color: "var(--warning)" }} />
                        <span>System Notifications & Alerts</span>
                      </div>
                    </div>

                    {alerts.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No active alerts. All systems healthy.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {alerts.slice(0, 5).map((a) => (
                          <div key={a.id} style={{ padding: "10px 14px", background: "var(--bg-app)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", display: "flex", alignItems: "center", justify: "space-between" }}>
                            <div>
                              <strong style={{ textTransform: "uppercase", fontSize: "0.72rem", color: a.severity === "CRITICAL" ? "var(--danger)" : "var(--warning)" }}>
                                {a.severity} · {a.type}
                              </strong>
                              <div style={{ fontWeight: 600 }}>{a.message}</div>
                            </div>
                            <SourceBadge source={a.source} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CROP ANALYSIS TAB */}
          {tab === "crop" && (
            <CropAnalysisView analysis={analysis} field={field} onAnalyze={runAnalyze} />
          )}

          {/* IRRIGATION ENGINE TAB */}
          {tab === "water" && (
            <div>
              <div className="greeting-hero">
                <div>
                  <h1 className="greeting-title">Irrigation Intelligence Engine</h1>
                  <p className="greeting-sub">Deterministic water calculations & explainable operational decisions</p>
                </div>
              </div>

              <IrrigationCard
                decision={decision}
                onOpenWhy={() => setShowWhy(true)}
                onOpenConfirm={() => setShowConfirm(true)}
              />
            </div>
          )}

          {/* FIELD CAMERA TAB */}
          {tab === "camera" && field && (
            <FieldCameraCard field={field} />
          )}

          {/* ASK AQUACROP AI TAB */}
          {tab === "ask" && (
            <AskAquaCropView
              chatInput={chatInput}
              setChatInput={setChatInput}
              reply={chatReply}
              onSend={handleAskChat}
              field={field}
            />
          )}

          {/* HISTORY TAB */}
          {tab === "history" && field && (
            <HistoryView fieldId={field.id} />
          )}

          {/* SIMULATION MODE TAB */}
          {tab === "simulation" && (
            <SimulationPanel
              field={field}
              currentDecision={decision}
              onRunSimulation={runSim}
              simResult={simResult}
            />
          )}

          {/* ENGINEER STATUS TAB */}
          {tab === "engineer" && (
            <EngineerStatusView />
          )}
        </main>
      </div>

      {/* Why Explainability Drawer */}
      <WhyDrawer isOpen={showWhy} onClose={() => setShowWhy(false)} decision={decision} />

      {/* Confirmation & Safety Approval Modal */}
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        decision={decision}
        field={field}
        onConfirm={handleConfirmExec}
      />
    </div>
  );
}
