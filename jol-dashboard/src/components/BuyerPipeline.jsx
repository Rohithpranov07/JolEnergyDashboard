"use client";

import { useMemo, useRef, useState } from "react";
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
import { buyerLeads, buyerStats } from "../data/buyerLeads.js";
import { supplierStats } from "../data/supplierLeads.js";
import KPICard from "./KPICard.jsx";
import FunnelChart from "./FunnelChart.jsx";
import LeadTable from "./LeadTable.jsx";
import { HandWrittenTitle } from "./ui/hand-writing-text.jsx";

gsap.registerPlugin(useGSAP);

// ── Design tokens ────────────────────────────────────────────────────────────

const ACCENT = "#10B98A";
const CARD_BG = "rgba(255,255,255,0.85)";
const CARD_BORDER = "1px solid rgba(17,24,39,0.07)";
const CARD_SHADOW = "0 1px 2px rgba(17,24,39,0.04), 0 6px 24px rgba(17,24,39,0.06)";
const LABEL_STYLE = { fontSize: 10, fontWeight: 700, letterSpacing: "0.11em", textTransform: "uppercase", color: "var(--text-muted)" };

// ── Static data ───────────────────────────────────────────────────────────────

const PRODUCT_COLORS = {
  NiSO4: "#185FA5",
  CoSO4: "#0A7864",
  Li2CO3: "#B45309",
  MnSO4: "#534AB7",
  PREC: "#A32D2D",
  LiOH: "#0F6E56",
  FeSO4: "#888780",
  CuSO4: "#1F9AA6",
};
const CATEGORY_LABELS = {
  SALT_MFR: "Salt Mfrs",
  CELL_MAKER: "Cell Makers",
  CAM_MAKER: "CAM/Cathode",
  METAL_RECOV: "Metal Recovery",
};
const CATEGORY_COLORS = {
  SALT_MFR: "#B5D4F4",
  CELL_MAKER: "#EAF3DE",
  CAM_MAKER: "#FEF3C7",
  METAL_RECOV: "#EEEDFE",
};
const FILTER_LABELS = {
  category: "Category",
  product: "Product",
  stage: "Stage",
  loiRange: "LOI",
};
const LOI_RANGES = [
  { value: "0-30", label: "Low (0–30%)" },
  { value: "31-50", label: "Medium (31–50%)" },
  { value: "51-80", label: "High (51–80%)" },
  { value: "81-100", label: "Very High (81–100%)" },
];
const EMPTY_FILTERS = { category: "", product: "", stage: "", loiRange: "" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function loiBadge(v) {
  let c;
  if (v <= 30) c = { bg: "#FCEBEB", text: "#791F1F" };
  else if (v <= 50) c = { bg: "#FEF3C7", text: "#B45309" };
  else if (v <= 80) c = { bg: "#EAF3DE", text: "#27500A" };
  else c = { bg: "#E1F5EE", text: "#085041" };
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[12px] font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {v}%
    </span>
  );
}

// ── Table columns ─────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: "company", label: "Company", width: 220 },
  { key: "city", label: "City", width: 110 },
  { key: "products", label: "Products", width: 180 },
  {
    key: "category",
    label: "Category",
    width: 120,
    format: (v) => CATEGORY_LABELS[v] || v,
  },
  {
    key: "consumptionMT",
    label: "Consumption",
    width: 90,
    format: (v) => `${v} MT/mo`,
  },
  { key: "stage", label: "Stage", width: 140 },
  {
    key: "loiProbability",
    label: "LOI Prob.",
    width: 110,
    format: (v) => loiBadge(v),
  },
];

// ── Tooltips ──────────────────────────────────────────────────────────────────

function ProductTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const { product, count } = payload[0].payload;
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "var(--text-primary)", boxShadow: "0 4px 16px rgba(17,24,39,0.10)" }}>
        {product}: {count} buyer{count === 1 ? "" : "s"}
      </div>
    );
  }
  return null;
}

function CategoryTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const { label, count } = payload[0].payload;
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "var(--text-primary)", boxShadow: "0 4px 16px rgba(17,24,39,0.10)" }}>
        {label}: {count} buyer{count === 1 ? "" : "s"}
      </div>
    );
  }
  return null;
}

// ── Filter Select ─────────────────────────────────────────────────────────────

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ ...LABEL_STYLE }}>{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: "rgba(17,24,39,0.04)",
          border: "1px solid var(--border-default)",
          borderRadius: 10,
          padding: "7px 12px",
          fontSize: 13,
          color: "var(--text-primary)",
          outline: "none",
          cursor: "pointer",
        }}
      >
        <option value="">All</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BuyerPipeline() {
  const rootRef = useRef(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const productDonut = buyerStats.productDonut;
  const categoryData = useMemo(
    () =>
      Object.entries(buyerStats.byCategory)
        .map(([cat, count]) => ({
          cat,
          count,
          label: CATEGORY_LABELS[cat] || cat,
        }))
        .sort((a, b) => b.count - a.count),
    [],
  );

  const categoryOptions = Object.keys(buyerStats.byCategory).map((c) => ({
    value: c,
    label: CATEGORY_LABELS[c] || c,
  }));
  const productOptions = Object.keys(buyerStats.byProduct).map((p) => ({
    value: p,
    label: p,
  }));
  const stageOptions = buyerStats.funnelStages.map((s) => ({
    value: s.stage,
    label: s.stage,
  }));

  const filteredLeads = useMemo(
    () =>
      buyerLeads.filter((l) => {
        if (filters.category && l.category !== filters.category) return false;
        if (filters.product && !l.products.includes(filters.product))
          return false;
        if (filters.stage && l.stage !== filters.stage) return false;
        if (filters.loiRange) {
          const [min, max] = filters.loiRange.split("-").map(Number);
          if (l.loiProbability < min || l.loiProbability > max) return false;
        }
        return true;
      }),
    [filters],
  );

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const toggleFilter = (key, val) => setFilters((f) => ({ ...f, [key]: f[key] === val ? "" : val }));
  const clearOne = (key) => setFilters((f) => ({ ...f, [key]: "" }));
  const clearAll = () => setFilters(EMPTY_FILTERS);

  const handleLoiClick = () => {
    if (filters.loiRange === "51-80") {
      setFilter("loiRange", "81-100");
    } else if (filters.loiRange === "81-100") {
      clearOne("loiRange");
    } else {
      setFilter("loiRange", "51-80");
    }
  };
  const activeChips = Object.entries(filters).filter(([, v]) => v);

  const chipDisplay = (key, value) => {
    if (key === "category") return CATEGORY_LABELS[value] || value;
    if (key === "loiRange")
      return LOI_RANGES.find((r) => r.value === value)?.label || value;
    return value;
  };

  // ── GSAP entrance stagger ─────────────────────────────────────────────────
  useGSAP(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    gsap.from(".bp-card", { y: 24, opacity: 0, duration: 0.75, ease: "back.out(1.15)", stagger: 0.05 });
  }, { scope: rootRef });

  return (
    <div ref={rootRef} className="space-y-5">

      {/* ═══ 0 · EDITORIAL HEADER ══════════════════════════════════════════ */}
      <div className="bp-card flex flex-col items-center justify-center gap-4 w-full relative" style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 20, boxShadow: CARD_SHADOW, backdropFilter: "blur(14px)", padding: "18px 22px" }}>
        <div className="w-full relative">
          <div style={{ ...LABEL_STYLE, color: ACCENT, marginBottom: -20 }} className="text-center">

          </div>
          <HandWrittenTitle
            title="Buyer Pipeline"
            subtitle={`${buyerStats.total} buyer leads · ${buyerStats.totalConsumptionMT.toLocaleString()} MT/mo addressable demand · Jun 2026`}
          />
        </div>
        {buyerStats.highLoiCount >= 5 && (
          <div className="absolute top-4 right-4 hidden sm:block">
            <span style={{ fontSize: 11.5, fontWeight: 600, padding: "5px 12px", borderRadius: 999, background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}25` }}>
              {buyerStats.highLoiCount} High LOI
            </span>
          </div>
        )}
      </div>

      {/* ═══ 1 · KPI CARDS ══════════════════════════════════════════════════ */}
      <div className="bp-card kpi-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          value={buyerStats.total}
          label="Total buyer leads"
          color="#0A7864"
          source="IndiaMART/company sites/industry reports, Jun 2026"
          animateOnMount
          onClick={clearAll}
          active={activeChips.length === 0}
          subtext={activeChips.length > 0 ? "Click to clear filters" : undefined}
        />
        <KPICard
          value={`${buyerStats.totalConsumptionMT.toLocaleString()} MT/mo`}
          label="Total addressable demand"
          color="#185FA5"
          source="Published capacity data + dummy consumption estimates (see PRD §4.3)"
        />
        <KPICard
          value={buyerStats.highLoiCount}
          label="High LOI probability (≥50%)"
          color="#B45309"
          source="LOI probability derived from pipeline stage (see PRD §4.6)"
          animateOnMount
          onClick={handleLoiClick}
          active={filters.loiRange === "51-80" || filters.loiRange === "81-100"}
          subtext={
            filters.loiRange === "51-80"
              ? "LOI: 51-80% (Click for 81-100%)"
              : filters.loiRange === "81-100"
                ? "LOI: 81-100% (Click to clear)"
                : "Click to filter LOI"
          }
        />
        <KPICard
          value={Object.keys(buyerStats.byProduct).length}
          label="Metal salt products"
          color="#534AB7"
          source="NiSO4, CoSO4, CuSO4, Li2CO3, MnSO4, PREC, LiOH, FeSO4"
          animateOnMount
          onClick={() => toggleFilter("product", "NiSO4")}
          active={filters.product === "NiSO4"}
          subtext={
            filters.product === "NiSO4"
              ? "Filter: NiSO4 (Click to clear)"
              : "Click to filter NiSO4"
          }
        />
      </div>

      {/* ═══ 2 · SIDE-BY-SIDE FUNNELS ═══════════════════════════════════════ */}
      <div className="bp-card" style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 20, boxShadow: CARD_SHADOW, backdropFilter: "blur(14px)", padding: "20px", overflow: "hidden" }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="flex-1">
            <FunnelChart
              title="Supplier pipeline (inflow)"
              stages={supplierStats.funnelStages}
            />
          </div>
          <div className="hidden flex-col items-center justify-center px-1 lg:flex">
            <div className="w-px flex-1" style={{ background: "var(--border-default)" }} />
            <span
              className="my-2 whitespace-nowrap text-[12px] font-semibold tracking-wide"
              style={{ transform: "rotate(-90deg)", color: "var(--text-secondary)" }}
            >
              JOL ENERGY
            </span>
            <div className="w-px flex-1" style={{ background: "var(--border-default)" }} />
          </div>
          <div className="flex-1">
            <FunnelChart
              title="Buyer pipeline (outflow)"
              stages={buyerStats.funnelStages}
              onStageClick={(stage) => toggleFilter("stage", stage)}
            />
          </div>
        </div>
        <p className="mt-3 pt-3 text-center text-sm" style={{ borderTop: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
          Supply-demand balance:{" "}
          <strong style={{ color: "#185FA5" }}>{supplierStats.total}</strong>{" "}
          inflow leads vs{" "}
          <strong style={{ color: ACCENT }}>{buyerStats.total}</strong> off-take
          leads
        </p>
      </div>

      {/* ═══ 3 · PRODUCT MIX + CATEGORY BREAKDOWN ══════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* product mix donut */}
        <div className="bp-card" style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 20, boxShadow: CARD_SHADOW, backdropFilter: "blur(14px)", padding: "20px", overflow: "hidden" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...LABEL_STYLE, marginBottom: 4 }}>Offtake Mix</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Product requirement mix</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={productDonut}
                dataKey="count"
                nameKey="product"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={1}
                stroke="#FFFFFF"
                strokeWidth={1}
              >
                {productDonut.map((d) => (
                  <Cell
                    key={d.product}
                    fill={PRODUCT_COLORS[d.product] || "#888780"}
                  />
                ))}
              </Pie>
              <Tooltip content={<ProductTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* custom legend */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {productDonut.map((d) => (
              <span
                key={d.product}
                className="inline-flex items-center gap-1.5 text-[12px]"
                style={{ color: "#444444" }}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: PRODUCT_COLORS[d.product] || "#888780" }}
                />
                {d.product} ({d.count})
              </span>
            ))}
          </div>
        </div>

        {/* category breakdown bars */}
        <div className="bp-card" style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 20, boxShadow: CARD_SHADOW, backdropFilter: "blur(14px)", padding: "20px", overflow: "hidden" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...LABEL_STYLE, marginBottom: 4 }}>Buyer Segments</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Buyer category breakdown</div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={categoryData}
              margin={{ top: 8, right: 8, bottom: 4, left: -16 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CategoryTooltip />} cursor={{ fill: "rgba(16,185,138,0.04)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {categoryData.map((d) => (
                  <Cell
                    key={d.cat}
                    fill={CATEGORY_COLORS[d.cat] || "#B5D4F4"}
                    stroke="rgba(17,24,39,0.06)"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ 4 · FILTER BAR ══════════════════════════════════════════════════ */}
      <div className="bp-card" style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 20, boxShadow: CARD_SHADOW, backdropFilter: "blur(14px)", padding: "20px" }}>
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            label="Category"
            value={filters.category}
            options={categoryOptions}
            onChange={(v) => setFilter("category", v)}
          />
          <FilterSelect
            label="Product"
            value={filters.product}
            options={productOptions}
            onChange={(v) => setFilter("product", v)}
          />
          <FilterSelect
            label="Pipeline Stage"
            value={filters.stage}
            options={stageOptions}
            onChange={(v) => setFilter("stage", v)}
          />
          <FilterSelect
            label="LOI Range"
            value={filters.loiRange}
            options={LOI_RANGES}
            onChange={(v) => setFilter("loiRange", v)}
          />
          {activeChips.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 600, background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.18)", color: "#C62828", cursor: "pointer" }}
            >
              Clear All
            </button>
          )}
        </div>

        {activeChips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeChips.map(([key, value]) => (
              <span
                key={key}
                style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}28`, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {FILTER_LABELS[key]}: {chipDisplay(key, value)}
                <button
                  type="button"
                  aria-label={`Remove ${FILTER_LABELS[key]} filter`}
                  onClick={() => clearOne(key)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: ACCENT, opacity: 0.65, lineHeight: 1, padding: 0, fontSize: 14 }}
                >
                  ×
                </button>
              </span>
            ))}
            <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              {filteredLeads.length}/{buyerStats.total} leads
            </span>
          </div>
        )}
      </div>

      {/* ═══ 5 · BUYER LEAD TABLE ════════════════════════════════════════════ */}
      <div className="bp-card" style={{ padding: 0 }}>
        <LeadTable
          data={filteredLeads}
          columns={COLUMNS}
          title="All Buyer Leads"
          label="Buyer Directory"
          accentColor={ACCENT}
          exportFilename="jol-buyers"
          searchable
          expandable
        />
      </div>
    </div>
  );
}
