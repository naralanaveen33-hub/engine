import React from "react";

interface SourceBadgeProps {
  source?: string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const s = (source || "UNKNOWN").toUpperCase();

  let label = s;
  let bg = "#F1F5F9";
  let color = "#475569";
  let border = "#CBD5E1";

  if (s === "REAL_SENSOR") {
    label = "REAL SENSOR";
    bg = "#ECFDF5";
    color = "#047857";
    border = "#6EE7B7";
  } else if (s === "WEATHER_API" || s === "OPEN_METEO") {
    label = "WEATHER API";
    bg = "#EFF6FF";
    color = "#1D4ED8";
    border = "#93C5FD";
  } else if (s === "EXTERNAL_API" || s === "SOILGRIDS") {
    label = "EXTERNAL API";
    bg = "#F0F9FF";
    color = "#0369A1";
    border = "#7DD3FC";
  } else if (s === "FARMER_INPUT") {
    label = "FARMER INPUT";
    bg = "#EEF2FF";
    color = "#4338CA";
    border = "#A5B4FC";
  } else if (s === "GIS_CALCULATED" || s === "ESTIMATED") {
    label = "GIS MATH / ESTIMATED";
    bg = "#F5F3FF";
    color = "#6D28D9";
    border = "#DDD6FE";
  } else if (s === "MODEL_OUTPUT") {
    label = "MODEL OUTPUT";
    bg = "#F0FDFA";
    color = "#0F766E";
    border = "#99F6E4";
  } else if (s === "SIMULATION") {
    label = "SIMULATION MODE";
    bg = "#FFFBEB";
    color = "#B45309";
    border = "#FCD34D";
  } else if (s === "MOCK" || s === "DEMO_DATA" || s === "SEED") {
    label = "DEMO / SEED DATA";
    bg = "#FEF2F2";
    color = "#B91C1C";
    border = "#FCA5A5";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: "12px",
        fontSize: "0.68rem",
        fontWeight: 800,
        letterSpacing: "0.5px",
        background: bg,
        color: color,
        border: `1px solid ${border}`,
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}
