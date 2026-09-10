import React, { useState } from "react";
import { MessageSquare, Mic, Send, Sparkles, ShieldAlert, CheckCircle2, Globe, Volume2 } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface AskAquaCropViewProps {
  chatInput: string;
  setChatInput: (val: string) => void;
  reply: any;
  onSend: (text?: string) => Promise<void>;
  field: any;
}

export function AskAquaCropView({ chatInput, setChatInput, reply, onSend, field }: AskAquaCropViewProps) {
  const [listening, setListening] = useState(false);

  const teluguPrompts = [
    "నా టమాటా పొలానికి నీళ్లు పెట్టాలా?",
    "రేపు వర్షం వస్తుందా?",
    "ఈ పొలానికి ఏ పైరు మంచిది?",
  ];

  const englishPrompts = [
    "Should I irrigate my field today?",
    "What is the rain probability for tomorrow?",
    "Which crops are suitable for this soil?",
  ];

  const handleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Browser Speech Recognition is not supported. Please type your question.");
      return;
    }

    const rec = new SR();
    rec.lang = "te-IN";
    rec.onstart = () => setListening(true);
    rec.onresult = (ev: any) => {
      const transcript = ev.results[0][0].transcript;
      setChatInput(transcript);
      onSend(transcript);
    };
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div>
      <div className="greeting-hero">
        <div>
          <h1 className="greeting-title">Ask AquaCrop AI</h1>
          <p className="greeting-sub">Conversational Copilot · Telugu & English · Field Context Aware</p>
        </div>
      </div>

      <div className="card-panel">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Sparkles size={20} style={{ color: "var(--accent-emerald)" }} />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Agricultural Copilot</h2>
        </div>

        {/* Quick Telugu / English Prompt Chips */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
            SUGGESTED QUERIES (తెలుగు / ENGLISH)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {teluguPrompts.concat(englishPrompts).map((prompt, idx) => (
              <button
                key={idx}
                className="sim-chip"
                onClick={() => {
                  setChatInput(prompt);
                  onSend(prompt);
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Reply Display */}
        {reply && (
          <div style={{ padding: "20px", background: "var(--bg-app)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justify: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "0.9rem", color: "var(--primary)" }}>
                <SproutIcon /> AquaCrop AI Response
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {(reply.categories || []).map((cat: string) => (
                  <SourceBadge key={cat} source={cat} />
                ))}
              </div>
            </div>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-main)", whiteSpace: "pre-wrap" }}>
              {reply.reply}
            </p>
          </div>
        )}

        {/* Input Bar */}
        <div style={{ position: "relative" }}>
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="తెలుగులో లేదా ఇంగ్లీషులో అడగండి... (Ask in Telugu or English)"
            rows={3}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "var(--radius-md)",
              border: "1.5px solid var(--border)",
              fontSize: "0.95rem",
              resize: "none",
              outline: "none",
              background: "var(--bg-surface)",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
            <button className={`btn-secondary ${listening ? "pulse" : ""}`} onClick={handleVoice}>
              <Mic size={18} style={{ color: listening ? "var(--danger)" : "var(--primary)" }} />
              <span>{listening ? "Listening (తెలుగు)..." : "Telugu Voice"}</span>
            </button>

            <button className="btn-primary" onClick={() => onSend()}>
              <Send size={16} />
              <span>Send Question</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: "20px", padding: "12px", background: "var(--warning-bg)", borderRadius: "var(--radius-md)", color: "#92400E", fontSize: "0.78rem" }}>
          <strong>Safety Notice:</strong> The conversational AI assistant answers queries and explains recommendations. It cannot bypass farmer confirmation or directly control physical irrigation pumps.
        </div>
      </div>
    </div>
  );
}

function SproutIcon() {
  return <span style={{ fontSize: "1.1rem" }}>🌾</span>;
}
