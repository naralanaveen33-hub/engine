import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, AlertTriangle, Globe, Loader2 } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface AskAquaCropViewProps {
  chatInput?: string;
  setChatInput?: (v: string) => void;
  reply: any;
  onSend?: (msg: string) => void;
  onAsk?: (msg: string) => void;
  field?: any;
}

export function AskAquaCropView({ chatInput, setChatInput, reply, onSend, onAsk, field }: AskAquaCropViewProps) {
  const [localText, setLocalText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"te-IN" | "en-IN">("te-IN");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState("");

  const text = chatInput !== undefined ? chatInput : localText;
  const updateText = (v: string) => {
    if (setChatInput) setChatInput(v);
    setLocalText(v);
  };

  // Web Speech API STT setup
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const hasSTT = !!SpeechRecognition;

  useEffect(() => {
    return () => {
      if ((window as any).speechSynthesis) {
        (window as any).speechSynthesis.cancel();
      }
    };
  }, []);

  const triggerAsk = async (msgToAsk: string) => {
    if (!msgToAsk.trim() || isLoading) return;
    setIsLoading(true);
    setErr("");
    try {
      if (onSend) {
        await onSend(msgToAsk);
      } else if (onAsk) {
        await onAsk(msgToAsk);
      }
    } catch (e: any) {
      setErr(e.message || "Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (!hasSTT) {
      alert("Browser Speech Recognition is not supported on this browser. Please use Chrome, Edge, or Brave.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      updateText(transcript);
      setIsListening(false);
      if (transcript.trim()) {
        triggerAsk(transcript);
      }
    };

    recognition.onerror = (err: any) => {
      console.error("Speech Recognition Error:", err);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const speakReply = () => {
    if (!(window as any).speechSynthesis || !reply) return;

    if (isSpeaking) {
      (window as any).speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const answerText = reply.reply || reply.answer || reply.explanation || (typeof reply === "string" ? reply : JSON.stringify(reply));
    const cleanText = answerText.replace(/[\*\_\[\]]/g, ""); // remove markdown formatting for TTS

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const isTe = /[\u0C00-\u0C7F]/.test(cleanText);
    utterance.lang = isTe ? "te-IN" : "en-IN";

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    (window as any).speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    triggerAsk(text);
  };

  return (
    <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <MessageSquare size={22} color="#059669" />
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>
              Ask AquaCrop AI Agent (English / తెలుగు)
            </h2>
            <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
              Context-Aware Agricultural Intelligence & Live Voice Support
            </span>
          </div>
        </div>
        <SourceBadge source="MODEL_OUTPUT" />
      </div>

      {/* SAMPLES & VOICE MODE SELECTOR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: "10px", color: "#1E40AF", fontSize: "0.78rem", fontWeight: 700, marginBottom: "16px" }}>
        <div>
          💡 <strong>Telugu Sample:</strong> "నా పొలంలో ఇప్పుడు నీరు పెట్టాలా?" · <strong>English Sample:</strong> "Should I irrigate my field right now?"
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Globe size={14} />
          <select
            value={speechLang}
            onChange={(e) => setSpeechLang(e.target.value as any)}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #93C5FD",
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "#1E40AF",
              background: "white",
              cursor: "pointer",
            }}
          >
            <option value="te-IN">తెలుగు (Telugu Voice)</option>
            <option value="en-IN">English (Indian Voice)</option>
          </select>
        </div>
      </div>

      {/* LISTENING STATUS FEEDBACK BANNER */}
      {isListening && (
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#ECFDF5", border: "1px solid #6EE7B7", color: "#047857", fontWeight: 800, fontSize: "0.82rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Mic size={16} />
          <span>🎙️ Listening to {speechLang === "te-IN" ? "Telugu (తెలుగు)" : "English"} voice input... Speak now!</span>
        </div>
      )}

      {err && (
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "#FEF2F2", color: "#DC2626", fontWeight: 700, fontSize: "0.82rem", marginBottom: "16px" }}>
          ⚠ {err}
        </div>
      )}

      {/* INPUT FORM WITH MIC & SUBMIT */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          value={text}
          onChange={(e) => updateText(e.target.value)}
          disabled={isLoading}
          placeholder={speechLang === "te-IN" ? "మీ పంట లేదా నీటి పారుదల గురించి ఒక ప్రశ్న అడగండి..." : "Ask any question about crops, fertilizers, pests, soil, or irrigation..."}
          style={{ flex: 1, padding: "12px 16px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "0.95rem" }}
        />

        <button
          type="button"
          onClick={toggleListening}
          disabled={isLoading}
          title={isListening ? "Stop Listening" : "Speak in Telugu or English"}
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            border: isListening ? "1px solid #EF4444" : "1px solid #10B981",
            background: isListening ? "#FEF2F2" : "#ECFDF5",
            color: isListening ? "#DC2626" : "#059669",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          <span>{isListening ? "Listening..." : "Voice Mic"}</span>
        </button>

        <button type="submit" disabled={isLoading} className="btn-primary" style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: "8px" }}>
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          <span>{isLoading ? "Asking..." : "Ask"}</span>
        </button>
      </form>

      {/* AI RESPONSE VIEW WITH TEXT-TO-SPEECH READ ALOUD */}
      {reply && (
        <div style={{ padding: "18px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#059669" }}>
              AQUACROP AI RESPONSE
            </div>

            <button
              type="button"
              onClick={speakReply}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                background: isSpeaking ? "#FEF2F2" : "white",
                color: isSpeaking ? "#DC2626" : "#2563EB",
                fontWeight: 700,
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{isSpeaking ? "Stop Voice" : "🔊 Listen Voice"}</span>
            </button>
          </div>

          <div style={{ fontSize: "0.92rem", color: "#0F172A", lineHeight: "1.6", whiteSpace: "pre-line" }}>
            {reply.reply || reply.answer || reply.explanation || (typeof reply === "string" ? reply : JSON.stringify(reply))}
          </div>
        </div>
      )}
    </div>
  );
}
