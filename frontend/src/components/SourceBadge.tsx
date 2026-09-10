import React from "react";
import { Radio, CloudSun, UserCheck, Cpu, Calculator, Play, History, Camera, Bot } from "lucide-react";

export function SourceBadge({ source }: { source?: string | null }) {
  if (!source) return null;

  const getIcon = () => {
    switch (source) {
      case "REAL_SENSOR":
        return <Radio size={11} />;
      case "REAL_CAMERA":
        return <Camera size={11} />;
      case "WEATHER_API":
        return <CloudSun size={11} />;
      case "FARMER_INPUT":
        return <UserCheck size={11} />;
      case "MODEL_OUTPUT":
        return <Cpu size={11} />;
      case "ESTIMATED":
        return <Calculator size={11} />;
      case "SIMULATION":
        return <Play size={11} />;
      case "HISTORICAL":
        return <History size={11} />;
      case "AI_EXPLANATION":
        return <Bot size={11} />;
      default:
        return null;
    }
  };

  return (
    <span className={`source-tag ${source}`}>
      {getIcon()}
      {source.replace("_", " ")}
    </span>
  );
}
