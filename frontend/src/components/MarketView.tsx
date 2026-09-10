import React, { useEffect, useState } from "react";
import { api } from "../api";
import { SourceBadge } from "./SourceBadge";
import { TrendingUp, TrendingDown, Minus, Store, MapPin, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

interface MarketViewProps {
  field: any;
}

export function MarketView({ field }: MarketViewProps) {
  const [marketData, setMarketData] = useState<any>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<string>("Tomato");
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (field?.current_crops?.[0]?.name_en) {
      setSelectedCommodity(field.current_crops[0].name_en);
    }
  }, [field]);

  useEffect(() => {
    if (!field?.id) return;
    loadMarket(selectedCommodity);
  }, [field?.id, selectedCommodity]);

  async function loadMarket(commodity: string) {
    setLoading(true);
    setErr("");
    try {
      const data = await api(`/fields/${field.id}/market?commodity=${encodeURIComponent(commodity)}`);
      setMarketData(data);
    } catch (e: any) {
      console.error("Failed to fetch market prices:", e);
      setErr("Could not fetch market intelligence. Showing cached market values.");
    } finally {
      setLoading(false);
    }
  }

  const commodities = marketData?.available_commodities || ["Tomato", "Paddy", "Groundnut", "Chilli", "Maize", "Cotton", "Onion"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div className="greeting-hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", width: "100%" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <h1 className="greeting-title">Market Intelligence & Price Trends</h1>
              {marketData?.source && <SourceBadge source={marketData.source} />}
            </div>
            <p className="greeting-sub">
              Live Mandi rates, 7-day price trend analysis, and regional market comparison for informed harvest selling.
            </p>
          </div>
          <button
            onClick={() => loadMarket(selectedCommodity)}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
            }}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Refresh Mandi Rates</span>
          </button>
        </div>
      </div>

      {err && (
        <div style={{ padding: "14px 20px", background: "var(--danger-bg)", color: "var(--danger)", borderRadius: "var(--radius-md)", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" }}>
          <AlertCircle size={18} />
          <span>{err}</span>
        </div>
      )}

      {/* Commodity Selector Tabs */}
      <div className="card-panel" style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
          Select Crop / Commodity
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {commodities.map((c: string) => {
            const isSelected = c.toLowerCase() === selectedCommodity.toLowerCase();
            return (
              <button
                key={c}
                onClick={() => setSelectedCommodity(c)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "var(--radius-md)",
                  border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                  background: isSelected ? "var(--primary-bg)" : "var(--bg-app)",
                  color: isSelected ? "var(--primary-dark)" : "var(--text-main)",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{c}</span>
                {isSelected && <Sparkles size={14} style={{ color: "var(--primary)" }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Market KPI Cards & Advisory */}
      <div className="dashboard-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Main Price Card */}
          <div className="card-panel" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "#F8FAFC", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "160px", height: "160px", background: "rgba(16, 185, 129, 0.08)", borderRadius: "50%", pointerEvents: "none" }} />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#94A3B8" }}>
                  CURRENT MANDI PRICE
                </span>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "4px", color: "#F8FAFC" }}>
                  {marketData?.commodity || selectedCommodity}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#CBD5E1", marginTop: "4px" }}>
                  <Store size={14} style={{ color: "#38BDF8" }} />
                  <span>{marketData?.market_name || "Madanapalle Mandi"}</span>
                </div>
              </div>

              {marketData?.price_change_7d_pct != null && (
                <div
                  style={{
                    padding: "8px 14px",
                    borderRadius: "20px",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: marketData.price_change_7d_pct >= 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                    color: marketData.price_change_7d_pct >= 0 ? "#34D399" : "#F87171",
                    border: marketData.price_change_7d_pct >= 0 ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid rgba(248, 113, 113, 0.3)",
                  }}
                >
                  {marketData.price_change_7d_pct >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  <span>{marketData.price_change_7d_pct >= 0 ? `+${marketData.price_change_7d_pct}%` : `${marketData.price_change_7d_pct}%`} (7D)</span>
                </div>
              )}
            </div>

            {/* Price Numbers Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", background: "rgba(255, 255, 255, 0.05)", padding: "18px", borderRadius: "var(--radius-md)", backdropFilter: "blur(10px)" }}>
              <div>
                <div style={{ fontSize: "0.72rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Modal Price</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#34D399", marginTop: "4px" }}>
                  ₹{marketData?.modal_price_inr_per_quintal?.toLocaleString() || "--"}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#64748B" }}>per quintal (100 kg)</div>
              </div>

              <div>
                <div style={{ fontSize: "0.72rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Min Price</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#F8FAFC", marginTop: "4px" }}>
                  ₹{marketData?.min_price_inr_per_quintal?.toLocaleString() || "--"}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#64748B" }}>lowest auction rate</div>
              </div>

              <div>
                <div style={{ fontSize: "0.72rem", color: "#94A3B8", textTransform: "uppercase", fontWeight: 700 }}>Max Price</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#F8FAFC", marginTop: "4px" }}>
                  ₹{marketData?.max_price_inr_per_quintal?.toLocaleString() || "--"}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#64748B" }}>grade-1 premium rate</div>
              </div>
            </div>
          </div>

          {/* Market Advisory Banner */}
          {marketData?.recommendation && (
            <div className="card-panel" style={{ background: "var(--primary-bg)", border: "1px solid var(--border-color)", display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ padding: "10px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", color: "var(--primary)", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                <Sparkles size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--primary-dark)", fontSize: "0.92rem", marginBottom: "4px" }}>
                  Harvest & Selling Advisory ({marketData.trend || "STABLE"})
                </div>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-main)", lineHeight: 1.5 }}>
                  {marketData.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* 7-Day Price History Visual Chart */}
          <div className="card-panel">
            <div className="card-title-row" style={{ marginBottom: "18px" }}>
              <div className="card-title">
                <TrendingUp size={20} style={{ color: "var(--primary)" }} />
                <span>7-Day Price Trend History</span>
              </div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Modal Price (₹/Quintal)</span>
            </div>

            {marketData?.history && marketData.history.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "140px", padding: "10px 10px 0 10px", borderBottom: "2px solid var(--border-color)" }}>
                  {marketData.history.map((h: any, idx: number) => {
                    const prices = marketData.history.map((item: any) => item.price);
                    const minP = Math.min(...prices) * 0.95;
                    const maxP = Math.max(...prices) * 1.05;
                    const heightPct = Math.max(15, Math.min(100, ((h.price - minP) / (maxP - minP || 1)) * 100));
                    const isLatest = idx === marketData.history.length - 1;

                    return (
                      <div key={h.date} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "12%", gap: "6px" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: isLatest ? "var(--primary-dark)" : "var(--text-muted)" }}>
                          ₹{h.price}
                        </span>
                        <div
                          style={{
                            width: "100%",
                            height: `${heightPct}%`,
                            background: isLatest ? "linear-gradient(180deg, var(--primary) 0%, var(--primary-dark) 100%)" : "var(--border-color)",
                            borderRadius: "4px 4px 0 0",
                            transition: "all 0.3s ease",
                          }}
                        />
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>{h.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No historical trend points available.</p>
            )}
          </div>
        </div>

        {/* Right Column: Mandi Comparison & Commodity Overview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Regional Mandi Comparison */}
          <div className="card-panel">
            <div className="card-title-row" style={{ marginBottom: "16px" }}>
              <div className="card-title">
                <MapPin size={20} style={{ color: "var(--accent-emerald)" }} />
                <span>Regional Mandi Comparison</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {marketData?.mandis?.map((m: any, idx: number) => (
                <div
                  key={m.name}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    background: idx === 0 ? "var(--primary-bg)" : "var(--bg-app)",
                    border: idx === 0 ? "1px solid var(--primary-light)" : "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justify: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)" }}>{m.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>District: {m.district}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: idx === 0 ? "var(--primary-dark)" : "var(--text-main)" }}>
                      ₹{m.modal_price.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Range: ₹{m.min_price} - ₹{m.max_price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Crops Market Summary Table */}
          <div className="card-panel">
            <div className="card-title-row" style={{ marginBottom: "14px" }}>
              <div className="card-title">
                <DollarSign size={20} style={{ color: "var(--water-blue)" }} />
                <span>Top Crops Market Overview</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {marketData?.all_commodities_summary?.map((item: any) => {
                const isSelected = item.name.toLowerCase() === selectedCommodity.toLowerCase();
                return (
                  <div
                    key={item.name}
                    onClick={() => setSelectedCommodity(item.name)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md)",
                      background: isSelected ? "var(--primary-bg)" : "var(--bg-app)",
                      border: isSelected ? "1px solid var(--primary)" : "1px solid transparent",
                      display: "flex",
                      alignItems: "center",
                      justify: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: isSelected ? "var(--primary-dark)" : "var(--text-main)" }}>
                      {item.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>₹{item.modal_price.toLocaleString()}</span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: item.change_pct >= 0 ? "#DCFCE7" : "#FEE2E2",
                          color: item.change_pct >= 0 ? "#166534" : "#991B1B",
                        }}
                      >
                        {item.change_pct >= 0 ? `+${item.change_pct}%` : `${item.change_pct}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
