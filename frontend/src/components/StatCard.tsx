import React from "react";
import { SourceBadge } from "./SourceBadge";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  footerText?: string;
  source?: string | null;
}

export function StatCard({ label, value, icon, iconBg, iconColor, footerText, source }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon-wrapper" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {(footerText || source) && (
        <div className="stat-footer">
          {source && <SourceBadge source={source} />}
          {footerText && <span>{footerText}</span>}
        </div>
      )}
    </div>
  );
}
