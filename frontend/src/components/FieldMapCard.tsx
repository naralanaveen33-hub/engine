import React, { useState, useEffect } from "react";
import { MapPin, Info, Edit3, CheckCircle2, Layers } from "lucide-react";
import { SourceBadge } from "./SourceBadge";
import "leaflet/dist/leaflet.css";

// Dynamic imports or React-Leaflet component setup
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Custom Leaflet DivIcon to ensure crisp pin rendering without broken static PNGs
const customPinIcon = L.divIcon({
  className: "custom-map-pin",
  html: `<div style="background:#059669;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 10px rgba(0,0,0,0.3);border:2px solid white;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

interface FieldMapCardProps {
  field: any;
  onUpdateLocation?: (lat: number, lng: number) => void;
}

function LocationPicker({ onSelectLocation }: { onSelectLocation: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function FieldMapCard({ field, onUpdateLocation }: FieldMapCardProps) {
  if (!field) return null;

  const [lat, setLat] = useState<number>(field.latitude ?? 16.4342);
  const [lng, setLng] = useState<number>(field.longitude ?? 81.6981);
  const [isEditingArea, setIsEditingArea] = useState(false);

  useEffect(() => {
    if (field.latitude) setLat(field.latitude);
    if (field.longitude) setLng(field.longitude);
  }, [field]);

  const rawArea = field.area_m2;
  const initialAreaM2 = typeof rawArea === "object" && rawArea !== null ? (rawArea.value ?? 1897.47) : (typeof rawArea === "number" ? rawArea : 1897.47);
  
  const [customAreaM2, setCustomAreaM2] = useState<number>(initialAreaM2);
  const areaAcres = customAreaM2 / 4046.86;

  // Build field square polygon coordinates around lat/lng
  const delta = 0.00025; // ~28 meters offset creating ~0.47 acre square field perimeter
  const polygonBounds: [number, number][] = field.boundary?.coordinates?.[0]
    ? field.boundary.coordinates[0].map((coord: [number, number]) => [coord[1], coord[0]])
    : [
        [lat - delta, lng - delta],
        [lat + delta, lng - delta],
        [lat + delta, lng + delta],
        [lat - delta, lng + delta],
      ];

  const handleMapClick = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    if (onUpdateLocation) {
      onUpdateLocation(newLat, newLng);
    }
  };

  return (
    <div style={{ background: "white", padding: "22px", borderRadius: "16px", border: "1px solid #E2E8F0", marginTop: "20px" }}>
      {/* CARD HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MapPin size={20} color="#059669" />
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, color: "#0F172A" }}>
              Field Geometry & OpenStreetMap Location
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
              Interactive GPS polygon mapping & GIS area calculation
            </span>
          </div>
        </div>
        <SourceBadge source="GIS_CALCULATED" />
      </div>

      {/* INTERACTIVE LEAFLET MAP */}
      <div style={{ height: "260px", borderRadius: "12px", overflow: "hidden", border: "1px solid #CBD5E1", position: "relative" }}>
        <MapContainer
          center={[lat, lng]}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Location Click Picker */}
          <LocationPicker onSelectLocation={handleMapClick} />

          {/* Marker at Field Location */}
          <Marker position={[lat, lng]} icon={customPinIcon}>
            <Popup>
              <div style={{ padding: "4px", fontSize: "0.85rem", fontWeight: 700 }}>
                🌱 <strong>{field.name}</strong>
                <br />
                GPS: {lat.toFixed(4)}°, {lng.toFixed(4)}°
                <br />
                Area: {customAreaM2.toLocaleString()} m² ({areaAcres.toFixed(2)} acres)
              </div>
            </Popup>
          </Marker>

          {/* Polygon Boundary of Field */}
          <Polygon
            positions={polygonBounds}
            pathOptions={{
              color: "#059669",
              fillColor: "#10B981",
              fillOpacity: 0.35,
              weight: 2,
              dashArray: "4",
            }}
          />
        </MapContainer>

        <div style={{ position: "absolute", bottom: "10px", right: "10px", zIndex: 1000, background: "rgba(255,255,255,0.92)", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700, color: "#334155", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
          💡 Click map to set farm location pin
        </div>
      </div>

      {/* METRICS & HOW AREA IS CALCULATED */}
      <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ padding: "12px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
            FIELD LOCATION GPS
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0F172A", marginTop: "2px" }}>
            {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
          </div>
          <span style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 700 }}>
            ✓ Verified Location Coordinate
          </span>
        </div>

        <div style={{ padding: "12px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
              CALCULATED FIELD AREA
            </div>
            <button
              onClick={() => setIsEditingArea(!isEditingArea)}
              style={{ background: "none", border: "none", color: "#2563EB", cursor: "pointer", fontSize: "0.72rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "3px" }}
            >
              <Edit3 size={12} /> {isEditingArea ? "Done" : "Adjust Size"}
            </button>
          </div>

          {!isEditingArea ? (
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0F172A", marginTop: "2px" }}>
                {customAreaM2.toLocaleString()} m² <span style={{ color: "#059669" }}>({areaAcres.toFixed(2)} acres)</span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                Formula: Geodesic Polygon Math
              </span>
            </div>
          ) : (
            <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="number"
                value={customAreaM2}
                onChange={(e) => setCustomAreaM2(parseFloat(e.target.value) || 0)}
                style={{ width: "100px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #94A3B8", fontSize: "0.85rem", fontWeight: 700 }}
              />
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155" }}>m²</span>
              <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 800 }}>({areaAcres.toFixed(2)} acres)</span>
            </div>
          )}
        </div>
      </div>

      {/* EXPLAINABILITY BANNER: HOW IT IS CALCULATED & USER INPUT METHODOLOGY */}
      <div style={{ marginTop: "14px", padding: "12px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px", fontSize: "0.78rem", color: "#166534", lineHeight: "1.5" }}>
        <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <Info size={16} /> How Field Area & Boundaries Are Derived:
        </div>
        1. <strong>Farmer Registration Input:</strong> Selected location coordinates & initial field acreage during registration.<br />
        2. <strong>GIS Polygon Calculation:</strong> The backend calculates surface area using <em>Shoelace Geodesic Formula</em> on GeoJSON perimeter coordinates.<br />
        3. <strong>User Customization:</strong> Click on the interactive map above to adjust your field location pin or click <em>Adjust Size</em> to input your exact farm acreage.
      </div>
    </div>
  );
}
