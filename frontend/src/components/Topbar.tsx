import React from "react";
import { Sprout, CloudSun, Bell, ChevronDown, User } from "lucide-react";

interface TopbarProps {
  user: any;
  fields: any[];
  currentField: any;
  onSelectField: (id: string) => void;
  alertCount: number;
}

export function Topbar({ user, fields, currentField, onSelectField, alertCount }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="brand-logo" style={{ width: "32px", height: "32px" }}>
            <Sprout size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1 }}>AquaCrop</div>
            <div style={{ fontSize: "0.68rem", color: "#64748B" }}>Intelligent Agriculture</div>
          </div>
        </div>

        {fields.length > 0 && (
          <div style={{ position: "relative", marginLeft: "16px" }}>
            <select
              value={currentField?.id || ""}
              onChange={(e) => onSelectField(e.target.value)}
              style={{
                appearance: "none",
                padding: "8px 32px 8px 14px",
                background: "var(--bg-app)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "var(--text-main)",
                cursor: "pointer",
              }}
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  🌾 {f.name} ({f.latitude?.toFixed(2)}°, {f.longitude?.toFixed(2)}°)
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#64748B" }} />
          </div>
        )}
      </div>

      <div className="topbar-right">
        <div className="weather-pill">
          <CloudSun size={16} />
          <span>31°C · Rain 18%</span>
        </div>

        <div className="notification-badge">
          <Bell size={18} />
          {alertCount > 0 && <span className="notification-count">{alertCount}</span>}
        </div>

        <div className="user-profile-chip">
          <div className="avatar">
            <User size={16} />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.display_name || user?.email || "Farmer"}</span>
            <span className="user-role">{user?.role || "farmer"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
