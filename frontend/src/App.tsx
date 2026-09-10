import { useEffect, useMemo, useState } from "react";
import { MapContainer, Polygon, TileLayer } from "react-leaflet";
import { api, setToken, token } from "./api";

type Field = any;

function Tag({ source }: { source?: string | null }) {
  if (!source) return null;
  return <span className="tag">{source}</span>;
}

export default function App() {
  const [email, setEmail] = useState("demo@aquacrop.local");
  const [password, setPassword] = useState("demo1234");
  const [authed, setAuthed] = useState(!!token());
  const [me, setMe] = useState<any>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [field, setField] = useState<Field | null>(null);
  const [tab, setTab] = useState<"home" | "crop" | "water" | "history" | "ask" | "engineer">("home");
  const [analysis, setAnalysis] = useState<any>(null);
  const [decision, setDecision] = useState<any>(null);
  const [sim, setSim] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [chat, setChat] = useState("");
  const [reply, setReply] = useState<any>(null);
  const [err, setErr] = useState("");
  const [eng, setEng] = useState<any>(null);
  const [listening, setListening] = useState(false);

  async function refreshField(id: string) {
    const f = await api(`/fields/${id}`);
    setField(f);
  }

  async function boot() {
    const m = await api("/me");
    setMe(m);
    const fs = await api("/fields");
    setFields(fs as Field[]);
    if ((fs as Field[])[0]) await refreshField((fs as Field[])[0].id);
    try {
      setAlerts((await api("/alerts")) as any[]);
    } catch {
      /* farmer ok */
    }
  }

  useEffect(() => {
    if (authed) boot().catch((e) => setErr(String(e)));
  }, [authed]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const r: any = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setToken(r.access_token);
    setAuthed(true);
  }

  async function analyze() {
    if (!field) return;
    setErr("");
    setAnalysis(await api(`/fields/${field.id}/crop-analysis`, { method: "POST", body: "{}" }));
    setTab("crop");
  }

  async function evaluate() {
    if (!field) return;
    setErr("");
    setDecision(await api(`/fields/${field.id}/irrigation/evaluate`, { method: "POST", body: "{}" }));
    setTab("water");
  }

  async function confirmExec() {
    if (!decision) return;
    await api(`/irrigation/${decision.decision_id}/confirm`, { method: "POST", body: "{}" });
    const ex = await api(`/irrigation/${decision.decision_id}/execute`, { method: "POST", body: "{}" });
    setDecision({ ...decision, confirmed: true, execution: ex });
  }

  async function runSim(scenario: string) {
    if (!field) return;
    setSim(await api("/simulation/scenario", { method: "POST", body: JSON.stringify({ field_id: field.id, scenario }) }));
  }

  async function ask(text?: string) {
    if (!field) return;
    const message = text ?? chat;
    const r = await api("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, field_id: field.id, language: /[\u0C00-\u0C7F]/.test(message) ? "te" : "en" }),
    });
    setReply(r);
    if ((r as any).decision) setDecision((r as any).decision);
    setTab("ask");
  }

  function voice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setErr("Browser speech recognition is unavailable. Type in Telugu or English instead.");
      return;
    }
    const rec = new SR();
    rec.lang = "te-IN";
    rec.onresult = (ev: any) => {
      const t = ev.results[0][0].transcript;
      setChat(t);
      ask(t);
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  async function loadEngineer() {
    try {
      setEng(await api("/engineer/status"));
      setTab("engineer");
    } catch (e) {
      setErr("Engineer role required. Login as engineer@aquacrop.local / demo1234");
    }
  }

  const center = useMemo<[number, number]>(() => {
    if (!field) return [16.4342, 81.6981];
    return [field.latitude, field.longitude];
  }, [field]);

  const poly = field?.boundary?.coordinates?.[0]?.map((c: number[]) => [c[1], c[0]]) as [number, number][] | undefined;

  if (!authed) {
    return (
      <div className="shell login">
        <h1>AquaCrop</h1>
        <p className="lede">Location-aware crop analysis and irrigation intelligence. Sensors and APIs are labeled. The assistant cannot start a pump.</p>
        <form onSubmit={login}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Enter</button>
        </form>
        {err && <p className="err">{err}</p>}
      </div>
    );
  }

  return (
    <div className="shell">
      <header>
        <div>
          <h1>AquaCrop</h1>
          <p className="sub">Field is the unit of decision · {me?.email} · {me?.role}</p>
        </div>
        <button className="cta" onClick={() => { setTab("ask"); }}>
          Ask AquaCrop
        </button>
      </header>
      {err && <p className="err">{err}</p>}
      <div className="layout">
        <aside>
          <h2>Fields</h2>
          {fields.map((f) => (
            <button key={f.id} className={field?.id === f.id ? "sel" : ""} onClick={() => refreshField(f.id)}>
              {f.name}
            </button>
          ))}
          <nav>
            <button onClick={() => setTab("home")}>Overview</button>
            <button onClick={analyze}>Analyze crop</button>
            <button onClick={evaluate}>Evaluate irrigation</button>
            <button onClick={() => runSim("HEAVY_RAIN")}>Start simulation</button>
            <button onClick={() => setTab("history")}>View history</button>
            <button onClick={loadEngineer}>Engineer</button>
          </nav>
        </aside>
        <main>
          {tab === "home" && field && (
            <>
              <section className="hero-card">
                <h2>{field.name}</h2>
                <p>
                  {field.latitude.toFixed(4)}, {field.longitude.toFixed(4)} <Tag source="FARMER_INPUT" /> · Area {field.area_m2?.value} m²
                </p>
                <p>
                  Crop: {field.current_crops?.[0]?.name_en || "—"} · Stage {field.current_crops?.[0]?.stage || "—"}
                </p>
                <p>
                  Previous crop: {field.previous_crop?.crop || field.previous_crop?.history_status} <Tag source={field.previous_crop?.source} />
                </p>
                <p>
                  Moisture: {field.latest_sensors?.soil_moisture?.value ?? "—"}%{" "}
                  <Tag source={field.latest_sensors?.soil_moisture?.source} /> health {field.latest_sensors?.health_status || "no reading"}
                </p>
                <p>
                  Device: {field.device ? (field.device.online ? "ONLINE" : `OFFLINE last seen ${field.device.last_seen_at || "never"}`) : "none"}
                </p>
                <div className="map">
                  <MapContainer center={center} zoom={17} style={{ height: 280, width: "100%" }}>
                    <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {poly && <Polygon positions={poly} pathOptions={{ color: "#2f6f4e" }} />}
                  </MapContainer>
                </div>
              </section>
              <section>
                <h3>Active alerts</h3>
                {alerts.length === 0 && <p>No alerts stored.</p>}
                {alerts.slice(0, 6).map((a) => (
                  <p key={a.id}>
                    {a.severity} {a.type}: {a.message} <Tag source={a.source} />
                  </p>
                ))}
              </section>
            </>
          )}

          {tab === "crop" && (
            <section>
              <h2>Crop analysis</h2>
              {!analysis && <p>Run Analyze crop.</p>}
              {analysis && (
                <>
                  <p className="disclaimer">{analysis.disclaimer}</p>
                  <p>
                    ML: {analysis.ml_status} · model {analysis.model_version || "none"} · rules {analysis.rule_version}
                  </p>
                  {(analysis.recommendations || []).slice(0, 8).map((r: any) => (
                    <article key={r.crop} className="rec">
                      <h3>
                        {r.rank}. {r.name_en} ({r.name_te}) · {r.suitability_score}/100 <Tag source="MODEL_OUTPUT" />
                      </h3>
                      <p>Why suitable: {(r.positive_factors || []).join(" ")}</p>
                      <p>Risks: {(r.negative_factors || []).join(" ")}</p>
                      <p>Warnings: {(r.warnings || []).join(" ")}</p>
                    </article>
                  ))}
                </>
              )}
            </section>
          )}

          {tab === "water" && (
            <section>
              <h2>Irrigation</h2>
              {decision?.mode === "SIMULATION" || sim ? <div className="sim-banner">SIMULATION MODE — not a weather forecast, not sent to hardware</div> : null}
              {decision && (
                <>
                  <p className="action">{decision.action}</p>
                  <p>Decision {decision.public_code} · confidence {decision.confidence} · {decision.rule_version}</p>
                  <h4>Why</h4>
                  <ul>{(decision.explanation?.why || []).map((w: string) => <li key={w}>{w}</li>)}</ul>
                  <h4>Data used</h4>
                  <ul>{(decision.explanation?.data_used || []).map((w: string) => <li key={w}>{w}</li>)}</ul>
                  <h4>Could change</h4>
                  <ul>{(decision.explanation?.could_change || []).map((w: string) => <li key={w}>{w}</li>)}</ul>
                  <p>
                    Estimated water: {decision.estimated_water_litres?.value ?? "—"} L <Tag source="ESTIMATED" />
                  </p>
                  <p>Reasons: {(decision.reason_codes || []).join(", ")}</p>
                  {decision.action === "IRRIGATE" && decision.mode !== "SIMULATION" && (
                    <button className="cta" disabled={decision.explanation?.execute_blocked} onClick={confirmExec}>
                      Confirm and execute (safety + device poll)
                    </button>
                  )}
                  {decision.execution && <pre>{JSON.stringify(decision.execution, null, 2)}</pre>}
                </>
              )}
            </section>
          )}

          {tab === "history" && field && <History fieldId={field.id} />}

          {tab === "ask" && (
            <section>
              <h2>Ask AquaCrop</h2>
              <p>Telugu or English. Irrigation still needs the Confirm button.</p>
              <textarea value={chat} onChange={(e) => setChat(e.target.value)} placeholder="నా టమాటా పొలానికి నీళ్లు పెట్టాలా?" />
              <div className="row">
                <button onClick={() => ask()}>Send</button>
                <button onClick={voice}>{listening ? "Listening…" : "Voice"}</button>
              </div>
              {reply && (
                <article className="reply">
                  <p>{reply.reply}</p>
                  <p>
                    {(reply.categories || []).map((c: string) => (
                      <Tag key={c} source={c} />
                    ))}
                  </p>
                </article>
              )}
            </section>
          )}

          {tab === "engineer" && eng && (
            <section>
              <h2>Engineer status</h2>
              <pre>{JSON.stringify(eng, null, 2)}</pre>
            </section>
          )}

          {sim && tab !== "engineer" && (
            <section>
              <div className="sim-banner">SIMULATION {sim.scenario}</div>
              <p>
                Simulated decision: {sim.decision?.action} vs use Evaluate irrigation for REAL mode.
              </p>
              <button
                onClick={() => {
                  setDecision(sim.decision);
                  setTab("water");
                }}
              >
                Open simulated decision
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function History({ fieldId }: { fieldId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api(`/fields/${fieldId}/irrigation/history`).then((d) => setRows(d as any[]));
  }, [fieldId]);
  return (
    <section>
      <h2>History</h2>
      {rows.map((r) => (
        <p key={r.decision_id}>
          {r.public_code} {r.mode} {r.action} {r.estimated_water_litres?.value} L <Tag source="ESTIMATED" /> exec {r.execution?.status || "none"}
        </p>
      ))}
    </section>
  );
}
