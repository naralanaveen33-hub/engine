import React from "react";
import { ShieldCheck, AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  decision: any;
  field: any;
  onConfirm: () => void;
}

export function ConfirmationModal({ isOpen, onClose, decision, field, onConfirm }: ConfirmationModalProps) {
  if (!isOpen) return null;

  const rec = decision?.recommendation || {};

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "white", width: "100%", maxWidth: "480px", borderRadius: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", padding: "28px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", border: "none", background: "none", cursor: "pointer", color: "#64748B" }}>
          <X size={20} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#ECFDF5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>Confirm Irrigation Authorization</h3>
            <span style={{ fontSize: "0.78rem", color: "#64748B" }}>Safety Rule & Execution Protocol</span>
          </div>
        </div>

        <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: "12px", marginBottom: "16px", fontSize: "0.85rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#64748B" }}>Target Field:</span>
            <strong style={{ color: "#0F172A" }}>{field?.name}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#64748B" }}>Net Water Volume:</span>
            <strong style={{ color: "#0F172A" }}>{rec.net_water_liters?.toLocaleString()} L</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#64748B" }}>Gross Water Volume:</span>
            <strong style={{ color: "#0F172A" }}>{rec.gross_water_liters?.toLocaleString()} L</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748B" }}>Safe Execution Duration:</span>
            <strong style={{ color: "#059669" }}>{Math.round((rec.safe_duration_seconds || 0) / 60)} minutes</strong>
          </div>
        </div>

        <div style={{ padding: "12px 14px", background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: "10px", fontSize: "0.78rem", color: "#B45309", marginBottom: "20px" }}>
          <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertTriangle size={14} />
            <span>SOFTWARE COMMAND TRANSMISSION</span>
          </div>
          <div style={{ marginTop: "2px", lineHeight: "1.4" }}>
            Authorizing will generate an authenticated execution token. Command transmission is verified in software. Physical relay hardware confirmation is pending hardware test setup.
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "1px solid #CBD5E1", background: "white", fontWeight: 700, cursor: "pointer", color: "#475569" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 2, padding: "12px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "white", fontWeight: 800, cursor: "pointer" }}>
            Confirm & Send Command
          </button>
        </div>
      </div>
    </div>
  );
}
