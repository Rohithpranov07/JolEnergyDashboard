"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { collectionStats, hubEconomics } from "../data/collectionPoints.js";
import KPICard from "./KPICard.jsx";
import { HandWrittenTitle } from "./ui/hand-writing-text.jsx";
import Featured_05 from "./ui/globe-feature-section.tsx";

gsap.registerPlugin(useGSAP);

// Leaflet touches window at import → load the map client-only.
const CollectionMap = dynamic(() => import("./CollectionMap.jsx"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        height: 520,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        background: "var(--border-subtle)",
        fontSize: 13,
        color: "var(--text-muted)",
      }}
    >
      Loading map…
    </div>
  ),
});

const TYPE_COLOR = {
  REGISTRY: "#185FA5",
  PRO: "#0A7864",
  INDIAMART: "#B45309",
  FIELD: "#888780",
};
const TYPE_LABELS = {
  REGISTRY: "Registry",
  PRO: "PRO Points",
  INDIAMART: "IndiaMART",
  FIELD: "Field Survey",
};

// ── Design tokens ────────────────────────────────────────────────────────────

const ACCENT = "#F59E0B";
const CARD_BG = "rgba(255,255,255,0.85)";
const CARD_BORDER = "1px solid rgba(17,24,39,0.07)";
const CARD_SHADOW = "0 1px 2px rgba(17,24,39,0.04), 0 6px 24px rgba(17,24,39,0.06)";
const LABEL_STYLE = { fontSize: 10, fontWeight: 700, letterSpacing: "0.11em", textTransform: "uppercase", color: "var(--text-muted)" };

// ── Tooltip components ───────────────────────────────────────────────────────

function DonutTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const { label, count } = payload[0].payload;
    return (
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: 12,
          color: "var(--text-primary)",
          boxShadow: "0 4px 16px rgba(17,24,39,0.10)",
        }}
      >
        {label}: {count} points
      </div>
    );
  }
  return null;
}

function CityTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const { city, kg } = payload[0].payload;
    return (
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: 12,
          color: "var(--text-primary)",
          boxShadow: "0 4px 16px rgba(17,24,39,0.10)",
        }}
      >
        {city}: {kg.toLocaleString()} kg/mo (estimated)
      </div>
    );
  }
  return null;
}

// ── Card style helper ────────────────────────────────────────────────────────

function cardStyle(extra = {}) {
  return {
    background: CARD_BG,
    border: CARD_BORDER,
    borderRadius: 20,
    boxShadow: CARD_SHADOW,
    backdropFilter: "blur(14px)",
    padding: "18px 20px",
    ...extra,
  };
}

export default function CollectionNetwork() {
  const rootRef = useRef(null);

  const typeData = Object.entries(collectionStats.byType).map(
    ([type, count]) => ({ type, label: TYPE_LABELS[type] || type, count }),
  );
  const cityData = collectionStats.cityVolume.slice(0, 7);
  const minCost = Math.min(...hubEconomics.map((h) => h.costPerKg));

  useGSAP(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    gsap.from(".cn-card", {
      y: 24,
      opacity: 0,
      duration: 0.75,
      ease: "back.out(1.15)",
      stagger: 0.05,
    });
  }, { scope: rootRef });

  return (
    <div ref={rootRef} className="space-y-4">
      {/* Editorial header */}
      <div className="cn-card flex flex-col items-center justify-center gap-4 w-full relative" style={cardStyle({ padding: "18px 22px" })}>
        <div className="w-full relative">
          <div style={{ ...LABEL_STYLE, color: ACCENT, marginBottom: -20 }} className="text-center">

          </div>
          <HandWrittenTitle
            title="Grassroots Collection"
            subtitle={`${collectionStats.total} collection points · ${collectionStats.verified} registry-verified · ${collectionStats.totalKg.toLocaleString()} kg/mo capacity · Jun 2026`}
          />
        </div>
      </div>

      {/* Main 3-col grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* LEFT – MAP (65%) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div
            className="cn-card"
            style={cardStyle({ padding: "8px", overflow: "hidden" })}
          >
            <CollectionMap />
          </div>
          <Featured_05 />
        </div>

        {/* RIGHT – SIDEBAR (35%) */}
        <div className="space-y-4">
          {/* KPI cards */}
          <div
            className="cn-card"
            style={cardStyle({ padding: "14px 16px" })}
          >
            <div className="kpi-stagger grid grid-cols-3 gap-2">
              <KPICard
                value={collectionStats.total}
                label="Collection points"
                color="#185FA5"
                source="TNPCB/KSPCB registries, Saahas PRO list, IndiaMART + field survey"
                animateOnMount
              />
              <KPICard
                value={collectionStats.verified}
                label="Registry verified"
                color="#0A7864"
                source="Registry / PRO / IndiaMART verified points"
                animateOnMount
              />
              <KPICard
                value={`${collectionStats.totalKg.toLocaleString()} kg`}
                label="Est. monthly capacity"
                color="#B45309"
                source="Category lookup table (PRD §4.4)"
              />
            </div>
          </div>

          {/* Hub economics */}
          <div className="cn-card" style={cardStyle()}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...LABEL_STYLE, marginBottom: 3 }}>Cost efficiency</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Hub economics</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["Hub", "Coll/trip", "Trips/mo", "₹/kg", "Breakeven", "Kg/mo"].map((col) => (
                      <th
                        key={col}
                        style={{
                          ...LABEL_STYLE,
                          textAlign: "left",
                          paddingBottom: 8,
                          paddingRight: col === "Hub" ? 8 : 4,
                          paddingLeft: col === "Hub" ? 0 : 4,
                          borderBottom: "1px solid var(--border-default)",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hubEconomics.map((h, i) => {
                    const isBest = h.costPerKg === minCost;
                    return (
                      <tr
                        key={h.hub}
                        style={{
                          background: i % 2 === 0 ? "rgba(17,24,39,0.018)" : "transparent",
                          borderBottom: "1px solid var(--border-subtle)",
                        }}
                      >
                        <td style={{ padding: "7px 8px 7px 0", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                          {h.hub}
                        </td>
                        <td style={{ padding: "7px 4px", color: "var(--text-secondary)" }}>
                          {h.collectionsPerTrip}
                        </td>
                        <td style={{ padding: "7px 4px", color: "var(--text-secondary)" }}>
                          {h.avgTripsPerMonth}
                        </td>
                        <td
                          style={{
                            padding: "7px 4px",
                            fontWeight: 700,
                            background: isBest ? "rgba(245,158,11,0.08)" : "transparent",
                            color: isBest ? "#9A6207" : "var(--text-secondary)",
                            borderRadius: isBest ? 6 : 0,
                          }}
                        >
                          {isBest && (
                            <span
                              style={{
                                display: "inline-block",
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: ACCENT,
                                marginRight: 4,
                                verticalAlign: "middle",
                                position: "relative",
                                top: -1,
                              }}
                            />
                          )}
                          ₹{h.costPerKg}
                        </td>
                        <td style={{ padding: "7px 4px", color: "var(--text-secondary)" }}>
                          {h.breakevenKgMo.toLocaleString()}
                        </td>
                        <td style={{ padding: "7px 4px", color: "var(--text-secondary)" }}>
                          {h.estMonthlyKg.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)" }}>
              Chennai has the lowest cost-per-kg (₹{minCost}/kg) – most viable hub.
            </p>
          </div>

          {/* Category donut */}
          <div className="cn-card" style={cardStyle()}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ ...LABEL_STYLE, marginBottom: 3 }}>Source breakdown</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Points by type</div>
            </div>
            <div className="flex items-center gap-3">
              <ResponsiveContainer width="55%" height={160}>
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={1}
                    stroke="#FFFFFF"
                    strokeWidth={1}
                  >
                    {typeData.map((d) => (
                      <Cell key={d.type} fill={TYPE_COLOR[d.type] || "#888780"} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5">
                {typeData.map((d) => (
                  <span
                    key={d.type}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: TYPE_COLOR[d.type] || "#888780",
                        flexShrink: 0,
                      }}
                    />
                    <span>
                      <strong style={{ color: "var(--text-primary)" }}>{d.label}</strong> ({d.count})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* City volume bar */}
          <div className="cn-card" style={cardStyle()}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...LABEL_STYLE, marginBottom: 3 }}>Geo distribution</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Est. monthly volume by city (kg)</div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={cityData}
                layout="vertical"
                margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="city"
                  width={80}
                  tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CityTooltip />} cursor={{ fill: "rgba(245,158,11,0.06)" }} />
                <Bar dataKey="kg" fill={ACCENT} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pin type legend */}
          <div className="cn-card" style={cardStyle()}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ ...LABEL_STYLE, marginBottom: 3 }}>Map legend</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Pin types</div>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#185FA5",
                    flexShrink: 0,
                  }}
                />
                <strong style={{ color: "var(--text-primary)" }}>{collectionStats.verified}</strong>&nbsp;Registry/PRO points (verified)
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#888780",
                    border: "1px dashed #555",
                    flexShrink: 0,
                  }}
                />
                <strong style={{ color: "var(--text-primary)" }}>{collectionStats.field}</strong>&nbsp;Field survey points (to visit)
              </li>
            </ul>
            <p style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
              Field survey points marked with dashed pins – visit to verify.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
