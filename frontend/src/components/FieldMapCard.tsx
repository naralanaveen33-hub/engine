import React, { useMemo } from "react";
import { MapContainer, Polygon, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin, Compass, Layers } from "lucide-react";
import { SourceBadge } from "./SourceBadge";

interface FieldMapCardProps {
  field: any;
}

export function FieldMapCard({ field }: FieldMapCardProps) {
  const center = useMemo<[number, number]>(() => {
    if (!field) return [16.4342, 81.6981];
    return [field.latitude, field.longitude];
  }, [field]);

  const polygonCoords = useMemo(() => {
    if (!field?.boundary?.coordinates?.[0]) return undefined;
    return field.boundary.coordinates[0].map((c: number[]) => [c[1], c[0]]) as [number, number][];
  }, [field]);

  return (
    <div className="card-panel">
      <div className="card-title-row">
        <div className="card-title">
          <MapPin size={20} style={{ color: "var(--primary)" }} />
          <span>Field Location & Boundary Mapping</span>
        </div>
        <SourceBadge source="FARMER_INPUT" />
      </div>

      <div style={{ position: "relative", marginBottom: "16px" }}>
        <MapContainer center={center} zoom={17} style={{ height: 280, width: "100%", borderRadius: "var(--radius-md)" }}>
          <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {polygonCoords && <Polygon positions={polygonCoords} pathOptions={{ color: "#2D6A4F", fillColor: "#10B981", fillOpacity: 0.25 }} />}
        </MapContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", background: "var(--bg-app)", padding: "14px", borderRadius: "var(--radius-md)" }}>
        <div>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>GPS COORDINATES</span>
          <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{field?.latitude?.toFixed(4)}°, {field?.longitude?.toFixed(4)}°</div>
        </div>

        <div>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>FIELD AREA</span>
          <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{field?.area_m2?.value || field?.area_m2 || 400} m²</div>
        </div>

        <div>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>IRRIGATION TYPE</span>
          <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{field?.irrigation_method || "DRIP"}</div>
        </div>

        <div>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>WATER AVAILABILITY</span>
          <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>{field?.water_availability || "MODERATE"}</div>
        </div>
      </div>
    </div>
  );
}
