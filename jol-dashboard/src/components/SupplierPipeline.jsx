"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { supplierLeads, supplierStats } from "../data/supplierLeads.js";
import useCountUp from "../utils/useCountUp.js";
import LeadTable from "./LeadTable.jsx";
import { HandWrittenTitle } from "./ui/hand-writing-text.jsx";
import { Announcement, AnnouncementTag, AnnouncementTitle } from "./ui/announcement";
import { X } from "lucide-react";

gsap.registerPlugin(useGSAP);

// ── Design tokens ────────────────────────────────────────────────────────────

const ACCENT = "#3D7FE8";
const CARD_BG = "rgba(255,255,255,0.85)";
const CARD_BORDER = "1px solid rgba(17,24,39,0.07)";
const CARD_SHADOW = "0 1px 2px rgba(17,24,39,0.04), 0 6px 24px rgba(17,24,39,0.06)";
const LABEL_STYLE = { fontSize: 10, fontWeight: 700, letterSpacing: "0.11em", textTransform: "uppercase", color: "var(--text-muted)" };

// ── Static data ──────────────────────────────────────────────────────────────

const SOURCE_META = {
  TNPCB: { label: "TNPCB", color: "#3D7FE8", desc: "TN Pollution Control Board" },
  KSPCB: { label: "KSPCB", color: "#10B98A", desc: "Karnataka SPCB" },
  CPCB: { label: "CPCB", color: "#8B7FF5", desc: "Central PCB (National)" },
  IMART: { label: "IndiaMART", color: "#F59E0B", desc: "IndiaMART verified suppliers" },
  CORP: { label: "Corporate", color: "#F0656A", desc: "Company website / investor report" },
  WEB: { label: "Website", color: "#6B7280", desc: "Web discovery" },
};

const TIER_META = [
  { key: "3 Ton+/mo", label: "3 T+/mo", color: "#1D3F8A" },
  { key: "1 Ton+/mo", label: "1 T+/mo", color: ACCENT },
  { key: "500-1000 kg/mo", label: "500 kg+/mo", color: "#93C5FD" },
  { key: "100-500 kg/mo", label: "100 kg+/mo", color: "#DBEAFE" },
];

const HEATMAP_STATES = [
  { name: "Tamil Nadu", abbr: "TN", flag: "🟦" },
  { name: "Karnataka", abbr: "KA", flag: "🟩" },
  { name: "Telangana", abbr: "TS", flag: "🟪" },
  { name: "Andhra Pradesh", abbr: "AP", flag: "🟧" },
  { name: "Multi-state", abbr: "ALL", flag: "⬜" },
];

const SOURCE_LABELS = { TNPCB: "TNPCB", KSPCB: "KSPCB", CPCB: "CPCB", IMART: "IndiaMART", WEB: "Website", CORP: "Corporate" };
const FILTER_LABELS = { stage: "Stage", city: "City", state: "State", batteryType: "Battery", volTier: "Tier", interest: "Interest", source: "Source" };
const EMPTY_FILTERS = { stage: "", city: "", state: "", batteryType: "", volTier: "", interest: "", source: "" };

// ── Icons ────────────────────────────────────────────────────────────────────

function Ico({ d, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {d}
    </svg>
  );
}
const LeadsIco = () => <Ico d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />;
const VolumeIco = () => <Ico d={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></>} />;
const CityIco = () => <Ico d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>} />;
const StarIco = () => <Ico d={<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></>} />;
const BarIco = () => <Ico d={<><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></>} />;
function InfoIco() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  );
}

// ── AnimatedBar ──────────────────────────────────────────────────────────────

function AnimatedBar({ pct, color, height = 4, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      requestAnimationFrame(() => setW(pct));
    }, delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div style={{ height, background: "rgba(17,24,39,0.07)", borderRadius: 999, overflow: "hidden" }}>
      <div style={{
        width: `${w}%`, height: "100%", background: color, borderRadius: 999,
        transition: `width 700ms cubic-bezier(0.23,1,0.32,1) ${delay}ms`,
      }} />
    </div>
  );
}

// ── KPI Stat Card ────────────────────────────────────────────────────────────

function StatCard({ value, label, subtext, color = ACCENT, source, icon, animateOnMount = true, onClick, active }) {
  const display = useCountUp(value, 1200, animateOnMount);
  const shown = typeof display === "number" ? display.toLocaleString("en-IN") : display;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
    /* 3D parallax tilt */
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotY = ((x - cx) / cx) * 2;
    const rotX = ((cy - y) / cy) * 2;
    e.currentTarget.style.transform = active
      ? `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-2px)`
      : `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  };
  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = active ? 'translateY(-2px)' : '';
  };

  return (
    <div onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="pressable spotlight-card border-shimmer group relative overflow-hidden rounded-2xl p-5"
      style={{
        background: CARD_BG,
        border: active ? `1.5px solid ${color}` : CARD_BORDER,
        backdropFilter: "blur(12px)",
        boxShadow: active ? `0 4px 20px ${color}22, ${CARD_SHADOW}` : CARD_SHADOW,
        cursor: onClick ? "pointer" : "default",
        transform: active ? "translateY(-2px)" : undefined,
        "--kpi-color": color,
        transition: "transform 400ms cubic-bezier(0.23,1,0.32,1), box-shadow 300ms ease, border-color 300ms ease",
        willChange: "transform",
        transformStyle: "preserve-3d",
      }}>

      {/* Accent hairline */}
      <div style={{
        position: "absolute", top: 0, left: "20%", right: "20%", height: 2.5,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.85,
      }} />
      {/* Corner glow */}
      <div style={{
        position: "absolute", top: -28, right: -18, width: 90, height: 90, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`, pointerEvents: "none",
      }} />

      {/* Top row: icon + info */}
      <div className="mb-3 flex items-center justify-between">
        <div style={{
          width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center",
          justifyContent: "center", background: `${color}14`, color,
        }}>
          {icon}
        </div>
        {source && (
          <span className="group/tip relative cursor-help text-[#C2C8D2] transition-colors hover:text-[var(--text-secondary)]">
            <InfoIco />
            <span className="tooltip-animated absolute right-0 top-5 z-20 w-max max-w-56 rounded-xl px-3 py-2 text-[11px] leading-snug"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", boxShadow: "0 12px 32px rgba(17,24,39,0.14)" }}>
              {source}
            </span>
          </span>
        )}
      </div>

      {/* Number */}
      <div className="alive-number tnum" style={{ fontSize: "clamp(1.55rem, 2.8vw, 1.95rem)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.05, color: "var(--text-primary)" }}>
        {shown}
      </div>

      {/* Label */}
      <div style={{ marginTop: 4, fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", lineHeight: 1.3 }}>{label}</div>

      {/* Subtext */}
      {subtext && <div style={{ marginTop: 3, fontSize: 11, fontWeight: 600, color }}>{subtext}</div>}
    </div>
  );
}

// ── Pipeline Flow Node ────────────────────────────────────────────────────────

function PipelineNode({ stage, count, color, total, onFilter, isFiltered, delay = 0 }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  const handleMagneticMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const pullX = ((x - cx) / cx) * 3;  // ±3px
    const pullY = ((y - cy) / cy) * 3;
    e.currentTarget.style.transform = `translate(${pullX}px, ${pullY}px)`;
  };
  const handleMagneticLeave = (e) => {
    e.currentTarget.style.transform = '';
  };

  return (
    <button
      type="button"
      onClick={() => onFilter(stage)}
      onMouseMove={handleMagneticMove}
      onMouseLeave={handleMagneticLeave}
      className="pressable flex-1 w-full rounded-2xl p-4 text-left focus-visible:outline-none"
      style={{
        background: isFiltered ? `${color}14` : CARD_BG,
        border: `1px solid ${isFiltered ? color + "55" : "rgba(17,24,39,0.07)"}`,
        boxShadow: isFiltered ? `0 0 0 3px ${color}1A, 0 4px 20px rgba(17,24,39,0.07)` : CARD_SHADOW,
        minWidth: 0, cursor: "pointer",
        transition: "transform 250ms cubic-bezier(0.23,1,0.32,1), background 200ms ease, border-color 200ms ease, box-shadow 200ms ease",
        willChange: "transform",
      }}
    >
      <div style={{ ...LABEL_STYLE, marginBottom: 6 }}>
        {stage}
      </div>
      <div className="alive-number tnum" style={{
        fontSize: "clamp(1.6rem, 3vw, 2.3rem)", fontWeight: 800, letterSpacing: "-0.03em",
        lineHeight: 1, color: "var(--text-primary)",
      }}>
        {count}
      </div>
      <div style={{ marginTop: 10 }}>
        <AnimatedBar pct={pct} color={isFiltered ? color : ACCENT + "90"} height={3} delay={delay} />
      </div>
      <div style={{ marginTop: 4, fontSize: 11, fontWeight: 500, color: "var(--text-muted)" }}>{pct}% of pipeline</div>
    </button>
  );
}

function ConvArrow({ from, to }) {
  const pct = from > 0 ? Math.round((to / from) * 100) : 0;
  const good = pct >= 40;
  const stroke = good ? "#10B98A" : "#CBD5E1";
  return (
    <div className="flex shrink-0 self-stretch flex-col items-center justify-center gap-1.5" style={{ width: 52, minWidth: 52 }}>
      <span className="tnum" style={{ fontSize: 11, fontWeight: 700, color: good ? "#047857" : "var(--text-muted)" }}>{pct}%</span>
      <svg width="36" height="18" viewBox="0 0 36 18" fill="none" aria-hidden>
        <path d="M0 9h26" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <path d="M21 4l7 5-7 5" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle r="2.5" fill={stroke}>
          <animateMotion dur="2s" repeatCount="indefinite" path="M0,9 L26,9" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

// ── Chart Tooltip ─────────────────────────────────────────────────────────────

function CityTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { city, kg } = payload[0].payload;
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "var(--text-primary)", boxShadow: "0 4px 20px rgba(17,24,39,0.12)" }}>
      {city}: <span style={{ color: ACCENT }}>{kg.toLocaleString()} kg</span>/mo
    </div>
  );
}

// ── Filter Select ─────────────────────────────────────────────────────────────

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span style={LABEL_STYLE}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-xl border px-3 py-1.5 text-sm font-semibold outline-none transition-colors"
        style={{
          background: value ? `${ACCENT}0D` : "var(--border-subtle)",
          borderColor: value ? `${ACCENT}44` : "var(--border-default)",
          color: value ? ACCENT : "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <option value="">All</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

// ── Supplier table columns ───────────────────────────────────────────────────

const SP_COLUMNS = [
  { key: "company", label: "Company", width: 200 },
  { key: "batteryType", label: "Battery", width: 160 },
  {
    key: "volTier", label: "Tier", width: 130,
    format: v => (
      <span style={{
        fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999,
        background: "var(--border-subtle)", color: "var(--text-secondary)",
        border: "1px solid var(--border-default)",
      }}>{v}</span>
    ),
  },
  {
    key: "monthlyKgEstimate", label: "kg / mo", width: 100,
    format: v => (
      <span className="tnum" style={{ fontWeight: 600, color: "var(--text-primary)" }}>
        {Number(v).toLocaleString()} kg
      </span>
    ),
  },
  { key: "stage", label: "Stage", width: 130 },
  { key: "interest", label: "Interest", width: 100 },
  { key: "lastContactDaysAgo", label: "Last Contact", width: 120 },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function SupplierPipeline() {
  const rootRef = useRef(null);
  const tableRef = useRef(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // ── Derived data ──────────────────────────────────────────────────────────
  const staleLeads = useMemo(() =>
    supplierLeads.filter(l => l.lastContactDaysAgo >= 14 && l.stage === "Lead"), []);

  const staleTopCities = useMemo(() => {
    const c = {};
    staleLeads.forEach(l => { c[l.city] = (c[l.city] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([x]) => x);
  }, [staleLeads]);

  const sourceCounts = useMemo(() => {
    const c = {};
    supplierLeads.forEach(l => { c[l.source] = (c[l.source] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, []);

  const tierData = useMemo(() =>
    TIER_META.map(t => ({ ...t, count: supplierStats.byTier[t.key] || 0 })), []);

  const maxStateCount = useMemo(() =>
    Math.max(...HEATMAP_STATES.map(s => supplierStats.byState[s.name] || 0)), []);

  const cityData = supplierStats.cityVolumeChart.slice(0, 8);
  const totalSrcCount = sourceCounts.reduce((s, [, c]) => s + c, 0);
  const pipelineStages = supplierStats.funnelStages;

  // ── Filter options ────────────────────────────────────────────────────────
  const batteryOptions = useMemo(() => {
    const set = new Set(supplierLeads.flatMap(l => l.batteryType));
    return [...set].sort().map(v => ({ value: v, label: v }));
  }, []);
  const tierOptions = useMemo(() => {
    const set = new Set(supplierLeads.map(l => l.volTier));
    return [...set].map(v => ({ value: v, label: v }));
  }, []);
  const sourceOptions = useMemo(() => {
    const set = new Set(supplierLeads.map(l => l.source));
    return [...set].map(v => ({ value: v, label: SOURCE_LABELS[v] || v }));
  }, []);
  const stageOptions = pipelineStages.map(s => ({ value: s.stage, label: s.stage }));
  const interestOptions = ["High", "Medium", "Low"].map(v => ({ value: v, label: v }));

  // ── Filters ───────────────────────────────────────────────────────────────
  const filteredLeads = useMemo(() =>
    supplierLeads.filter(l => {
      if (filters.stage && l.stage !== filters.stage) return false;
      if (filters.city && l.city !== filters.city) return false;
      if (filters.state && l.state !== filters.state) return false;
      if (filters.batteryType && !l.batteryType.includes(filters.batteryType)) return false;
      if (filters.volTier && l.volTier !== filters.volTier) return false;
      if (filters.interest && l.interest !== filters.interest) return false;
      if (filters.source && l.source !== filters.source) return false;
      return true;
    }), [filters]);

  const scrollToTable = () => {
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFilter = (key, val) => setFilters(f => ({ ...f, [key]: f[key] === val ? "" : val }));
  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));
  const clearOne = (key) => setFilters(f => ({ ...f, [key]: "" }));
  const clearAll = () => setFilters(EMPTY_FILTERS);
  const activeChips = Object.entries(filters).filter(([, v]) => v);

  // ── GSAP entrance stagger ─────────────────────────────────────────────────
  useGSAP(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    gsap.from(".sp-card", {
      y: 24, opacity: 0, duration: 0.75, ease: "back.out(1.15)", stagger: 0.05,
    });
  }, { scope: rootRef });

  // ── Quality metrics ───────────────────────────────────────────────────────
  const leadStage = supplierStats.byStage?.Lead || 0;
  const contactedPct = Math.round(((supplierStats.total - leadStage) / supplierStats.total) * 100);
  const verifiedPct = Math.round((supplierStats.verifiedPhone / supplierStats.total) * 100);
  const highIntPct = Math.round((supplierStats.highInterest / supplierStats.total) * 100);
  const tonPlusPct = Math.round((supplierStats.tonPlusTier / supplierStats.total) * 100);

  return (
    <div ref={rootRef} className="space-y-5">

      {/* ═══ 0 · PAGE HEADER ═══════════════════════════════════════════════ */}
      <div className="sp-card flex flex-col items-center justify-center gap-4 w-full">
        <div className="w-full relative">
          <div style={{ ...LABEL_STYLE, color: ACCENT, marginBottom: -20 }} className="text-center">

          </div>
          <HandWrittenTitle
            title="Scrap Inflow Pipeline"
            subtitle={`${supplierStats.total} leads across ${supplierStats.citiesCount} cities · ${supplierStats.totalKg.toLocaleString()} kg/mo est. volume · Jun 2026`}
          />
        </div>

        {!alertDismissed && staleLeads.length > 0 && (
          <div className="flex justify-center w-full">
            <Announcement themed className="bg-amber-50/70 border-amber-500/20 text-amber-950 shadow-sm pr-2">
              <AnnouncementTag className="bg-amber-500/10 text-amber-900 font-semibold">
                {staleLeads.length} leads not contacted in 14+ days
              </AnnouncementTag>
              <AnnouncementTitle className="text-amber-800 font-medium text-xs flex items-center gap-2">
                <span>Priority: {staleTopCities.join(" · ")}</span>
                <button
                  type="button"
                  onClick={() => setAlertDismissed(true)}
                  className="hover:bg-amber-500/10 rounded-full p-1 text-amber-700 hover:text-amber-950 transition-all cursor-pointer flex items-center justify-center"
                >
                  <X size={14} className="shrink-0" />
                </button>
              </AnnouncementTitle>
            </Announcement>
          </div>
        )}
      </div>

      {/* ═══ 1 · KPI STRIP ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="sp-card">
          <StatCard value={supplierStats.total} label="Total leads" color={ACCENT}
            source="TNPCB/KSPCB/CPCB/IndiaMART registries, Jun 2026" animateOnMount icon={<LeadsIco />}
            subtext={activeChips.length > 0 ? "Click to clear filters" : `${verifiedPct}% phone verified`}
            onClick={() => { clearAll(); scrollToTable(); }} active={activeChips.length === 0} />
        </div>
        <div className="sp-card">
          <StatCard value={`${(supplierStats.totalKg / 1000).toFixed(0)}k kg`} label="Monthly volume est." color="#10B98A"
            source="Volume tier midpoint formula (PRD §4.6)" animateOnMount icon={<VolumeIco />}
            subtext="∑ tier midpoints (Click for 3T+)"
            onClick={() => { toggleFilter("volTier", "3 Ton+/mo"); scrollToTable(); }}
            active={filters.volTier === "3 Ton+/mo"} />
        </div>
        <div className="sp-card">
          <StatCard value={supplierStats.citiesCount} label="Cities covered" color="#8B7FF5"
            source="Derived from verified company addresses" animateOnMount icon={<CityIco />}
            subtext="5 states · South India" />
        </div>
        <div className="sp-card">
          <StatCard value={supplierStats.highInterest} label="High-interest leads" color="#F59E0B"
            source="Interest score from contact frequency + response" animateOnMount icon={<StarIco />}
            subtext={`${highIntPct}% of pipeline (Click)`}
            onClick={() => { toggleFilter("interest", "High"); scrollToTable(); }}
            active={filters.interest === "High"} />
        </div>
        <div className="sp-card">
          <StatCard value={supplierStats.tonPlusTier} label="1-Ton+ tier leads" color="#F0656A"
            source="Volume tier from registry capacity data" animateOnMount icon={<BarIco />}
            subtext={`${tonPlusPct}% are high-vol (Click)`}
            onClick={() => { toggleFilter("volTier", "1 Ton+/mo"); scrollToTable(); }}
            active={filters.volTier === "1 Ton+/mo"} />
        </div>
      </div>

      {/* ═══ 2 · HORIZONTAL PIPELINE FLOW ════════════════════════════════ */}
      <div className="sp-card rounded-2xl p-5" style={{ background: CARD_BG, border: CARD_BORDER, backdropFilter: "blur(12px)", boxShadow: CARD_SHADOW }}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <div style={LABEL_STYLE}>Pipeline Stages</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginTop: 3 }}>
              Conversion funnel · click any stage to filter leads
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: "var(--border-subtle)", border: "1px solid rgba(17,24,39,0.07)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B98A" }} />
            <span style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 500 }}>
              {pipelineStages.reduce((s, x) => s + x.count, 0)} total leads tracked
            </span>
          </div>
        </div>

        <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
          {pipelineStages.map((s, i) => (
            <Fragment key={s.stage}>
              {/* Node wrapper: display flex so PipelineNode button fills height via flex-1 */}
              <div style={{ flex: 1, minWidth: 80, display: "flex" }}>
                <PipelineNode
                  stage={s.stage}
                  count={s.count}
                  color={s.color}
                  total={supplierStats.total}
                  onFilter={stage => { toggleFilter("stage", stage); scrollToTable(); }}
                  isFiltered={filters.stage === s.stage}
                  delay={i * 80}
                />
              </div>
              {i < pipelineStages.length - 1 && (
                <ConvArrow from={s.count} to={pipelineStages[i + 1].count} />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      {/* ═══ 3 · VOLUME + STATES ══════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-5">

        {/* City volume chart */}
        <div className="sp-card rounded-2xl p-5 lg:col-span-3"
          style={{ background: CARD_BG, border: CARD_BORDER, backdropFilter: "blur(12px)", boxShadow: CARD_SHADOW }}>
          <div style={LABEL_STYLE}>Geographic Distribution</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginTop: 3, marginBottom: 20 }}>
            Monthly volume by city
            <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginLeft: 6 }}>kg/mo (estimated)</span>
          </div>
          <ResponsiveContainer width="100%" height={238}>
            <BarChart data={cityData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 4 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v}
                axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="city" width={90}
                tick={{ fontSize: 12.5, fill: "var(--text-secondary)", fontWeight: 500 }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<CityTooltip />} cursor={{ fill: "rgba(61,127,232,0.05)" }} />
              <Bar dataKey="kg" radius={[0, 7, 7, 0]} cursor="pointer"
                onClick={d => d && toggleFilter("city", d.city ?? d.payload?.city)}>
                {cityData.map((entry, idx) => {
                  const active = filters.city === entry.city;
                  const alpha = Math.round(Math.max(0.45, 1 - idx * 0.065) * 255).toString(16).padStart(2, "0");
                  return <Cell key={idx} fill={active ? ACCENT : `${ACCENT}${alpha}`} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* State density tiles */}
        <div className="sp-card rounded-2xl p-5 lg:col-span-2"
          style={{ background: CARD_BG, border: CARD_BORDER, backdropFilter: "blur(12px)", boxShadow: CARD_SHADOW }}>
          <div style={LABEL_STYLE}>State Coverage</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginTop: 3, marginBottom: 20 }}>
            Lead density by state
          </div>
          <div className="flex flex-col gap-2">
            {HEATMAP_STATES.map((s, i) => {
              const count = supplierStats.byState[s.name] || 0;
              const pct = maxStateCount > 0 ? (count / maxStateCount) * 100 : 0;
              const isActive = filters.state === s.name;
              return (
                <button key={s.name} type="button"
                  onClick={() => toggleFilter("state", s.name)}
                  className="pressable flex items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                  style={{
                    background: isActive ? `${ACCENT}0F` : "rgba(17,24,39,0.025)",
                    border: `1px solid ${isActive ? ACCENT + "40" : "rgba(17,24,39,0.06)"}`,
                    transition: "all 200ms ease",
                  }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isActive ? `${ACCENT}18` : "var(--border-subtle)",
                    fontSize: 9.5, fontWeight: 800, letterSpacing: "0.04em",
                    color: isActive ? ACCENT : "var(--text-secondary)",
                  }}>
                    {s.abbr}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 5 }}>
                      {s.name}
                    </div>
                    <AnimatedBar pct={pct} color={isActive ? ACCENT : "#B8CCF0"} height={3} delay={i * 100} />
                  </div>
                  <div className="tnum shrink-0" style={{
                    fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em",
                    color: isActive ? ACCENT : "var(--text-primary)",
                  }}>
                    {count}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ 4 · INSIGHTS TRIPTYCH ════════════════════════════════════════ */}
      <div className="grid gap-4 sm:grid-cols-3">

        {/* Source Registry Mix */}
        <div className="sp-card rounded-2xl p-5"
          style={{ background: CARD_BG, border: CARD_BORDER, backdropFilter: "blur(12px)", boxShadow: CARD_SHADOW }}>
          <div style={LABEL_STYLE}>Data Provenance</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginTop: 3, marginBottom: 16 }}>
            Registry Mix
          </div>

          {/* Segmented progress bar */}
          <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", gap: 2, marginBottom: 16 }}>
            {sourceCounts.map(([src, count]) => {
              const meta = SOURCE_META[src] || { color: "var(--text-muted)" };
              return (
                <div key={src}
                  onClick={() => toggleFilter("source", src)}
                  title={`${SOURCE_META[src]?.label || src}: ${count}`}
                  style={{
                    flex: count, background: meta.color, borderRadius: 999,
                    opacity: filters.source === src ? 1 : filters.source ? 0.35 : 0.82,
                    cursor: "pointer", transition: "opacity 200ms ease, flex 500ms ease",
                  }} />
              );
            })}
          </div>

          <div className="space-y-2.5">
            {sourceCounts.map(([src, count]) => {
              const meta = SOURCE_META[src] || { label: src, color: "var(--text-muted)" };
              const pct = Math.round((count / totalSrcCount) * 100);
              const isAct = filters.source === src;
              return (
                <button key={src} type="button" onClick={() => toggleFilter("source", src)}
                  className="pressable flex w-full items-center gap-2.5 text-left">
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: isAct ? "var(--text-primary)" : "var(--text-secondary)" }}>{meta.label}</div>
                  <div style={{ flex: 2.5 }}>
                    <AnimatedBar pct={pct} color={meta.color} height={3} delay={0} />
                  </div>
                  <div className="tnum shrink-0" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", minWidth: 18, textAlign: "right" }}>
                    {count}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Volume Tier Distribution */}
        <div className="sp-card rounded-2xl p-5"
          style={{ background: CARD_BG, border: CARD_BORDER, backdropFilter: "blur(12px)", boxShadow: CARD_SHADOW }}>
          <div style={LABEL_STYLE}>Volume Capacity</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginTop: 3, marginBottom: 16 }}>
            Tier Distribution
          </div>

          {/* Segmented bar */}
          <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", gap: 2, marginBottom: 16 }}>
            {tierData.map(t => (
              <div key={t.key}
                onClick={() => toggleFilter("volTier", t.key)}
                style={{
                  flex: t.count || 0.1, background: t.color, borderRadius: 999, cursor: "pointer",
                  opacity: filters.volTier === t.key ? 1 : filters.volTier ? 0.3 : 0.85,
                  transition: "opacity 200ms ease",
                }}
                title={`${t.label}: ${t.count} leads`} />
            ))}
          </div>

          <div className="space-y-3">
            {tierData.map(t => {
              const pct = Math.round((t.count / supplierStats.total) * 100);
              const isAct = filters.volTier === t.key;
              return (
                <button key={t.key} type="button" onClick={() => toggleFilter("volTier", t.key)}
                  className="pressable flex w-full items-center gap-2.5 text-left">
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: isAct ? "var(--text-primary)" : "var(--text-secondary)" }}>{t.label}</div>
                  <div className="tnum shrink-0" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{t.count}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 28, textAlign: "right" }}>{pct}%</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pipeline Quality */}
        <div className="sp-card rounded-2xl p-5"
          style={{ background: CARD_BG, border: CARD_BORDER, backdropFilter: "blur(12px)", boxShadow: CARD_SHADOW }}>
          <div style={LABEL_STYLE}>Pipeline Quality</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginTop: 3, marginBottom: 16 }}>
            Health Metrics
          </div>
          <div className="space-y-4">
            {[
              { label: "Contacted rate", value: contactedPct, color: ACCENT, tip: "Leads beyond 'Lead' stage" },
              { label: "Phone verified", value: verifiedPct, color: "#10B98A", tip: "Verified phone from registry" },
              { label: "High-interest", value: highIntPct, color: "#F59E0B", tip: "High interest score leads" },
              { label: "1-Ton+ capacity", value: tonPlusPct, color: "#8B7FF5", tip: "Leads with ≥1 ton/mo capacity" },
            ].map((m, i) => (
              <div key={m.label}>
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)" }}>{m.label}</span>
                  <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}%</span>
                </div>
                <AnimatedBar pct={m.value} color={m.color} height={4} delay={i * 80 + 200} />
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(17,24,39,0.07)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Stale (≥14d no contact)</span>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 999,
              color: staleLeads.length > 10 ? "#C2422B" : "#047857",
              background: staleLeads.length > 10 ? "rgba(194,66,43,0.09)" : "rgba(4,120,87,0.09)",
            }}>
              {staleLeads.length}/{supplierStats.total}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ 5 · FILTER BAR ═══════════════════════════════════════════════ */}
      <div className="sp-card rounded-2xl p-4"
        style={{ background: CARD_BG, border: CARD_BORDER, backdropFilter: "blur(12px)", boxShadow: CARD_SHADOW }}>
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect label="Battery Type" value={filters.batteryType} options={batteryOptions} onChange={v => setFilter("batteryType", v)} />
          <FilterSelect label="Volume Tier" value={filters.volTier} options={tierOptions} onChange={v => setFilter("volTier", v)} />
          <FilterSelect label="Pipeline Stage" value={filters.stage} options={stageOptions} onChange={v => setFilter("stage", v)} />
          <FilterSelect label="Interest" value={filters.interest} options={interestOptions} onChange={v => setFilter("interest", v)} />
          <FilterSelect label="Source Registry" value={filters.source} options={sourceOptions} onChange={v => setFilter("source", v)} />
          {activeChips.length > 0 && (
            <button type="button" onClick={clearAll}
              className="pressable rounded-xl border px-3.5 py-1.5 text-sm font-semibold transition-colors"
              style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", background: "var(--border-subtle)", marginTop: "auto" }}>
              Clear all
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeChips.map(([key, val]) => (
              <span key={key} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-colors"
                style={{ background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
                {FILTER_LABELS[key]}: {key === "source" ? SOURCE_LABELS[val] || val : val}
                <button type="button" aria-label={`Remove ${FILTER_LABELS[key]} filter`}
                  onClick={() => clearOne(key)}
                  className="pressable" style={{ color: ACCENT, opacity: 0.65, lineHeight: 1 }}>×</button>
              </span>
            ))}
            <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              {filteredLeads.length}/{supplierStats.total} leads
            </span>
          </div>
        )}
      </div>

      {/* ═══ 6 · LEAD TABLE ════════════════════════════════════════════════ */}
      <div ref={tableRef} className="sp-card" style={{ padding: 0 }}>
        <LeadTable
          data={filteredLeads}
          columns={SP_COLUMNS}
          title="All Supplier Leads"
          label="Supplier Directory"
          accentColor={ACCENT}
          exportFilename="jol-suppliers"
          citySubField="city"
          stateSubField="state"
          searchable
          expandable
        />
      </div>
    </div>
  );
}
