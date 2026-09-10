import React from "react";
import { LayoutDashboard, Sprout, Droplets, TrendingUp, Camera, MessageSquare, History, Play, SlidersHorizontal } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}

export function Sidebar({ activeTab, onTabChange, userRole }: SidebarProps) {
  const navItems = [
    { id: "home", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "crop", label: "Crop Intelligence", icon: <Sprout size={18} /> },
    { id: "water", label: "Irrigation Engine", icon: <Droplets size={18} /> },
    { id: "market", label: "Market Intelligence", icon: <TrendingUp size={18} /> },
    { id: "camera", label: "Field Camera", icon: <Camera size={18} /> },
    { id: "ask", label: "Ask AquaCrop", icon: <MessageSquare size={18} /> },
    { id: "history", label: "History Timeline", icon: <History size={18} /> },
    { id: "simulation", label: "Simulation Mode", icon: <Play size={18} /> },
  ];

  if (userRole === "engineer" || userRole === "admin") {
    navItems.push({ id: "engineer", label: "Engineer Status", icon: <SlidersHorizontal size={18} /> });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-logo">
          <Sprout size={22} />
        </div>
        <div>
          <div className="brand-title">AquaCrop</div>
          <div className="brand-subtitle">Water & Crop Intelligence</div>
        </div>
      </div>

      <nav className="nav-group">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => onTabChange(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 700, color: "#94A3B8", marginBottom: "2px" }}>AquaCrop Enterprise v1.0</div>
        <div>Field-Centric Decision Platform</div>
      </div>
    </aside>
  );
}
