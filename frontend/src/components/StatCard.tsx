import React from "react";
import { SourceBadge } from "./SourceBadge";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  footerText: string;
  source: string;
}

export function StatCard({ label, value, icon, iconBg, iconColor, footerText, source }: StatCardProps) {
  return (
    <div className="stat-card" style={{ background: "white", padding: "20px", borderRadius: "14px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748B", letterSpacing: "0.5px" }}>{label}</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>{value}</div>
        </div>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #F1F5F9", marginTop: "10px" }}>
        <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>{footerText}</span>
        <SourceBadge source={source} />
      </div>
    </div>
  );
}
