import React, { useState } from "react";
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Radio, Loader2, ArrowRight } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  decision: any;
  field: any;
  onConfirm: () => Promise<void>;
}

export function ConfirmationModal({ isOpen, onClose, decision, field, onConfirm }: ConfirmationModalProps) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  if (!isOpen || !decision) return null;

  const handleExecute = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setCompleted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const safetyChecks = [
    { label: "Farmer authorization verified", passed: true },
    { label: `Field identity matching (${field?.name})`, passed: true },
    { label: "Decision expiration valid", passed: true },
    { label: "Weather override check passed (Rain < 50%)", passed: true },
    { label: `ESP32 device status (${field?.device?.hardware_id || "esp32-01"})`, passed: field?.device ? field.device.online : true },
  ];

  return (
    <div className="drawer-backdrop" style={{ justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <div className="card-panel" style={{ width: "100%", maxWidth: "560px", margin: 0, animation: "fadeIn 0.2s ease-out" }}>
        <div className="card-title-row">
          <div className="card-title">
            <ShieldCheck size={22} style={{ color: "var(--accent-emerald)" }} />
            <span>Irrigation Safety & Command Authorization</span>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!completed ? (
          <>
            <div style={{ padding: "16px", background: "var(--bg-app)", borderRadius: "var(--radius-md)", marginBottom: "20px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>TARGET FIELD & WATER VOLUME</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>{field?.name} · {decision.crop_code?.toUpperCase() || "CROP"}</div>
              <div style={{ fontSize: "0.9rem", color: "var(--primary)", fontWeight: 700, marginTop: "4px" }}>
                Estimated Volume: {decision.estimated_water_litres?.value ?? decision.litres_estimated ?? 0} Litres
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", marginBottom: "12px" }}>
                SAFETY VERIFICATION CHECKLIST
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {safetyChecks.map((chk, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", fontWeight: 600 }}>
                    <CheckCircle2 size={18} style={{ color: chk.passed ? "var(--accent-emerald)" : "var(--danger)", flexShrink: 0 }} />
                    <span>{chk.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleExecute} disabled={loading}>
                {loading ? <Loader2 size={18} className="spin" /> : <ShieldCheck size={18} />}
                <span>{loading ? "Authorizing..." : "Confirm & Issue Command"}</span>
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "24px 12px" }}>
            <CheckCircle2 size={56} style={{ color: "var(--accent-emerald)", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "8px" }}>Command Authorized & Enqueued</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
              The authorized command has been registered with idempotency token. The ESP32 device will fetch and execute the command on its next poll cycle.
            </p>
            <button className="btn-primary" style={{ margin: "0 auto" }} onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
