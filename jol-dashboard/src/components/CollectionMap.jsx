"use client";

import { useMemo, useState, useEffect } from "react";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { collectionHubs, collectionPoints } from "../data/collectionPoints.js";

// ── CRITICAL LEAFLET ICON FIX ──────────────────────────────────────────────
// In Next, PNG imports resolve to a static-image object → use `.src`.
const DefaultIcon = L.icon({
  iconUrl: markerIcon.src ?? markerIcon,
  shadowUrl: markerShadow.src ?? markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const TYPE_COLOR = {
  REGISTRY: "#185FA5",
  PRO: "#0A7864",
  INDIAMART: "#B45309",
  FIELD: "#888780",
};
const WILL_COLOR = {
  Yes: { bg: "#EAF3DE", text: "#27500A" },
  Maybe: { bg: "#FEF3C7", text: "#B45309" },
  No: { bg: "#FCEBEB", text: "#791F1F" },
};

function pointDivIcon(type) {
  const color = TYPE_COLOR[type] || "#888780";
  const dashed = type === "FIELD";
  return L.divIcon({
    className: "jol-pin",
    html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${color};border:1px ${
      dashed ? "dashed" : "solid"
    } #ffffff;box-shadow:0 0 0 1.5px ${color}66,0 1px 2px rgba(0,0,0,.4)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  });
}

function hubDivIcon(hub) {
  return L.divIcon({
    className: "jol-hub",
    html: `<div style="transform:translate(-50%,-50%);background:${hub.color};color:#fff;font-size:11px;font-weight:700;padding:3px 7px;border-radius:5px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.4)">${hub.name}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function MapLayers({ typeIcons, hubIcons }) {
  const map = useMap();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (map) {
      const checkPane = () => {
        if (map.getPane("tilePane")) {
          setReady(true);
        } else {
          setTimeout(checkPane, 50);
        }
      };
      checkPane();
    }
  }, [map]);

  if (!ready || !map) return null;

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* 80 km hub radius circles */}
      {collectionHubs.map((hub) => (
        <Circle
          key={`circle-${hub.id}`}
          center={[hub.lat, hub.lng]}
          radius={hub.radiusKm * 1000}
          pathOptions={{
            color: hub.color,
            fillColor: hub.color,
            fillOpacity: 0.05,
            weight: 1.5,
          }}
        />
      ))}

      {/* hub centre labels */}
      {collectionHubs.map((hub) => (
        <Marker
          key={`hub-${hub.id}`}
          position={[hub.lat, hub.lng]}
          icon={hubIcons[hub.id]}
        />
      ))}

      {/* collection points */}
      {collectionPoints.map((p) => {
        const will = WILL_COLOR[p.willingness] || WILL_COLOR.Maybe;
        return (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={typeIcons[p.type]}>
            <Popup>
              <div style={{ minWidth: 170 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  {p.name}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    background: "var(--border-subtle)",
                    color: "var(--text-primary)",
                    fontSize: 11,
                    padding: "1px 7px",
                    borderRadius: 999,
                  }}
                >
                  {p.category}
                </span>
                <div style={{ fontSize: 12, marginTop: 6, color: "var(--text-secondary)" }}>
                  Est. monthly volume:{" "}
                  <strong>{p.monthlyKgEstimate} kg/mo</strong>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span
                    style={{
                      display: "inline-block",
                      background: will.bg,
                      color: will.text,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "1px 7px",
                      borderRadius: 999,
                    }}
                  >
                    Willingness: {p.willingness}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontStyle: "italic",
                    color: "var(--text-muted)",
                    marginTop: 6,
                  }}
                >
                  Source: {p.source}
                </div>
                {p.verified && (
                  <div style={{ marginTop: 6 }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: "#EAF3DE",
                        color: "#27500A",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "1px 7px",
                        borderRadius: 4,
                      }}
                    >
                      ✓ Verified
                    </span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function CollectionMap() {
  // precompute the 4 type icons + 3 hub icons once
  const typeIcons = useMemo(() => {
    const m = {};
    Object.keys(TYPE_COLOR).forEach((t) => {
      m[t] = pointDivIcon(t);
    });
    return m;
  }, []);
  const hubIcons = useMemo(() => {
    const m = {};
    collectionHubs.forEach((h) => {
      m[h.id] = hubDivIcon(h);
    });
    return m;
  }, []);

  return (
    <div className="relative" style={{ height: 520 }}>
      <MapContainer
        center={[14.5, 78.5]}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", borderRadius: 8 }}
      >
        <MapLayers typeIcons={typeIcons} hubIcons={hubIcons} />
      </MapContainer>

      {/* legend overlay */}
      <div className="absolute bottom-2 right-2 z-[1000] rounded-md border p-2 text-[11px] shadow" style={{ borderColor: "var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
        <div className="flex flex-col gap-1">
          {[
            ["REGISTRY", "#185FA5", false],
            ["PRO", "#0A7864", false],
            ["INDIAMART", "#B45309", false],
            ["FIELD", "#888780", true],
          ].map(([label, color, dashed]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  background: color,
                  border: dashed ? "1px dashed #555" : "1px solid #fff",
                  boxShadow: `0 0 0 1px ${color}66`,
                }}
              />
              {label}
            </span>
          ))}
        </div>
        <div className="mt-1.5 border-t pt-1.5 text-[10px]" style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}>
          Circles = 80 km hub radius
        </div>
      </div>
    </div>
  );
}
