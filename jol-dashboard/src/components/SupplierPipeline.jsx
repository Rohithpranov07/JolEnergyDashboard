"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supplierLeads, supplierStats } from "../data/supplierLeads.js";
import KPICard from "./KPICard.jsx";
import FunnelChart from "./FunnelChart.jsx";
import LeadTable from "./LeadTable.jsx";

// ── helpers ───────────────────────────────────────────────────────────────
function hexToRgb(h) {
  const x = h.replace("#", "");
  return [
    parseInt(x.slice(0, 2), 16),
    parseInt(x.slice(2, 4), 16),
    parseInt(x.slice(4, 6), 16),
  ];
}
function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

const SOURCE_LABELS = {
  TNPCB: "TNPCB",
  KSPCB: "KSPCB",
  CPCB: "CPCB",
  IMART: "IndiaMART",
  WEB: "Website",
  CORP: "Corporate",
};
const FILTER_LABELS = {
  stage: "Stage",
  city: "City",
  state: "State",
  batteryType: "Battery",
  volTier: "Tier",
  interest: "Interest",
  source: "Source",
};
const HEATMAP_STATES = [
  { name: "Tamil Nadu", abbr: "TN" },
  { name: "Karnataka", abbr: "KA" },
  { name: "Telangana", abbr: "TS" },
  { name: "Andhra Pradesh", abbr: "AP" },
  { name: "Multi-state", abbr: "MULTI" },
];

const COLUMNS = [
  { key: "company", label: "Company", width: 220 },
  { key: "city", label: "City", width: 100 },
  { key: "state", label: "State", width: 100 },
  { key: "batteryType", label: "Battery Type", width: 150 },
  { key: "volTier", label: "Tier", width: 120 },
  {
    key: "monthlyKgEstimate",
    label: "Kg/mo",
    width: 100,
    format: (v) => `${Number(v).toLocaleString()} kg`,
  },
  { key: "stage", label: "Stage", width: 120 },
  { key: "interest", label: "Interest", width: 90 },
  {
    key: "lastContactDaysAgo",
    label: "Last Contact",
    width: 110,
    format: (v) => (v === 0 ? "Today" : v === 1 ? "Yesterday" : `${v} days ago`),
  },
];

const EMPTY_FILTERS = {
  stage: "",
  city: "",
  state: "",
  batteryType: "",
  volTier: "",
  interest: "",
  source: "",
};

function CityTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const { city, kg } = payload[0].payload;
    return (
      <div className="rounded bg-[#0D2137] px-2.5 py-1.5 text-[12px] text-white shadow">
        {city}: {kg.toLocaleString()} kg/month (estimated)
      </div>
    );
  }
  return null;
}

function Select({ label, value, options, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[#888780]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[#E0E0E0] bg-white px-2 py-1.5 text-sm text-[#333333] outline-none focus:border-[#185FA5]"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SupplierPipeline() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // ── stale-lead alert ──────────────────────────────────────────────────
  const staleLeads = useMemo(
    () =>
      supplierLeads.filter(
        (l) => l.lastContactDaysAgo >= 14 && l.stage === "Lead",
      ),
    [],
  );
  const staleTopCities = useMemo(() => {
    const counts = {};
    staleLeads.forEach((l) => {
      counts[l.city] = (counts[l.city] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c]) => c);
  }, [staleLeads]);

  // ── dropdown option lists (data-driven) ───────────────────────────────
  const batteryOptions = useMemo(() => {
    const set = new Set(supplierLeads.flatMap((l) => l.batteryType));
    return [...set].sort().map((v) => ({ value: v, label: v }));
  }, []);
  const tierOptions = useMemo(() => {
    const set = new Set(supplierLeads.map((l) => l.volTier));
    return [...set].map((v) => ({ value: v, label: v }));
  }, []);
  const sourceOptions = useMemo(() => {
    const set = new Set(supplierLeads.map((l) => l.source));
    return [...set].map((v) => ({ value: v, label: SOURCE_LABELS[v] || v }));
  }, []);
  const stageOptions = supplierStats.funnelStages.map((s) => ({
    value: s.stage,
    label: s.stage,
  }));
  const interestOptions = ["High", "Medium", "Low"].map((v) => ({
    value: v,
    label: v,
  }));

  // ── filter application ────────────────────────────────────────────────
  const filteredLeads = useMemo(
    () =>
      supplierLeads.filter((l) => {
        if (filters.stage && l.stage !== filters.stage) return false;
        if (filters.city && l.city !== filters.city) return false;
        if (filters.state && l.state !== filters.state) return false;
        if (filters.batteryType && !l.batteryType.includes(filters.batteryType))
          return false;
        if (filters.volTier && l.volTier !== filters.volTier) return false;
        if (filters.interest && l.interest !== filters.interest) return false;
        if (filters.source && l.source !== filters.source) return false;
        return true;
      }),
    [filters],
  );

  // toggle from chart/heatmap/funnel clicks (click again to clear)
  const toggleFilter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: f[key] === value ? "" : value }));
  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const clearOne = (key) => setFilters((f) => ({ ...f, [key]: "" }));
  const clearAll = () => setFilters(EMPTY_FILTERS);

  const activeChips = Object.entries(filters).filter(([, v]) => v);
  const cityData = supplierStats.cityVolumeChart.slice(0, 8);
  const maxStateCount = Math.max(
    ...HEATMAP_STATES.map((s) => supplierStats.byState[s.name] || 0),
  );

  return (
    <div className="space-y-5">
      {/* ROW 1 — SMART ALERT BANNER */}
      {!bannerDismissed && staleLeads.length > 0 && (
        <div className="flex items-start justify-between gap-3 rounded-md border-l-[3px] border-[#B45309] bg-[#FEF3C7] p-3">
          <p className="text-sm text-[#7A4A0B]">
            ⚠ <strong>{staleLeads.length}</strong> supplier leads have not been
            contacted in 14+ days. Priority cities:{" "}
            <strong>{staleTopCities.join(", ")}</strong>.
          </p>
          <button
            type="button"
            aria-label="Dismiss alert"
            onClick={() => setBannerDismissed(true)}
            className="shrink-0 rounded px-1 text-lg leading-none text-[#7A4A0B] hover:bg-[#F5E3A8]"
          >
            ×
          </button>
        </div>
      )}

      {/* ROW 2 — KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          value={supplierStats.total}
          label="Total supplier leads"
          color="#185FA5"
          source="TNPCB/KSPCB/CPCB/IndiaMART registries, Jun 2026"
          animateOnMount
        />
        <KPICard
          value={supplierStats.citiesCount}
          label="Cities covered"
          color="#0A7864"
          source="Derived from verified company addresses"
          animateOnMount
        />
        <KPICard
          value={`${supplierStats.totalKg.toLocaleString()} kg`}
          label="Est. monthly pipeline"
          color="#B45309"
          source="Volume tier midpoint formula (see PRD §4.6)"
          animateOnMount
        />
        <KPICard
          value={supplierStats.tonPlusTier}
          label="1-Ton+ tier leads"
          color="#A32D2D"
          source="Volume tier from registry capacity data"
          animateOnMount
        />
      </div>

      {/* ROW 3 — FUNNEL + CITY CHART (60/40) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-[#E0E0E0] bg-white p-4 lg:col-span-3">
          <FunnelChart
            stages={supplierStats.funnelStages}
            title="Supplier pipeline"
            onStageClick={(stage) => toggleFilter("stage", stage)}
          />
          <p className="mt-2 text-[11px] text-[#888780]">
            Click a stage to filter the table below.
          </p>
        </div>
        <div className="rounded-lg border border-[#E0E0E0] bg-white p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-[#0D2137]">
            Estimated monthly volume by city
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={cityData}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#888780" }}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="city"
                width={92}
                tick={{ fontSize: 12, fill: "#444444" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CityTooltip />}
                cursor={{ fill: "#F0F6FC" }}
              />
              <Bar
                dataKey="kg"
                fill="#185FA5"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                activeBar={{ fill: "#0C447C" }}
                onClick={(d) =>
                  d && toggleFilter("city", d.city ?? d.payload?.city)
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 4 — STATE HEATMAP */}
      <div className="rounded-lg border border-[#E0E0E0] bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-[#0D2137]">
          Lead density by state
        </h3>
        <div className="flex flex-wrap gap-2">
          {HEATMAP_STATES.map((s) => {
            const count = supplierStats.byState[s.name] || 0;
            const t = maxStateCount ? count / maxStateCount : 0;
            const bg = mix("#E6F1FB", "#0C447C", t);
            const selected = filters.state === s.name;
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => toggleFilter("state", s.name)}
                title={`${s.name}: ${count} leads`}
                className="flex min-w-[78px] flex-col items-center rounded-md px-3 py-2 text-sm font-semibold transition-shadow"
                style={{
                  background: bg,
                  color: t > 0.5 ? "#FFFFFF" : "#0C447C",
                  boxShadow: selected ? "0 0 0 2px #0D2137" : "none",
                }}
              >
                <span>{s.abbr}</span>
                <span className="text-lg leading-tight">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ROW 5 — FILTER BAR */}
      <div className="rounded-lg border border-[#E0E0E0] bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Battery Type"
            value={filters.batteryType}
            options={batteryOptions}
            onChange={(v) => setFilter("batteryType", v)}
          />
          <Select
            label="Volume Tier"
            value={filters.volTier}
            options={tierOptions}
            onChange={(v) => setFilter("volTier", v)}
          />
          <Select
            label="Pipeline Stage"
            value={filters.stage}
            options={stageOptions}
            onChange={(v) => setFilter("stage", v)}
          />
          <Select
            label="Interest"
            value={filters.interest}
            options={interestOptions}
            onChange={(v) => setFilter("interest", v)}
          />
          <Select
            label="Source Registry"
            value={filters.source}
            options={sourceOptions}
            onChange={(v) => setFilter("source", v)}
          />
          {activeChips.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto rounded-md border border-[#E0E0E0] px-3 py-1.5 text-sm font-medium text-[#666666] hover:bg-gray-50"
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
                className="inline-flex items-center gap-1 rounded-full bg-[#E6F1FB] px-2.5 py-1 text-[12px] text-[#0C447C]"
              >
                {FILTER_LABELS[key]}:{" "}
                {key === "source" ? SOURCE_LABELS[value] || value : value}
                <button
                  type="button"
                  aria-label={`Remove ${FILTER_LABELS[key]} filter`}
                  onClick={() => clearOne(key)}
                  className="ml-0.5 text-[#0C447C] hover:text-[#A32D2D]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ROW 6 — LEAD TABLE */}
      <LeadTable
        data={filteredLeads}
        columns={COLUMNS}
        searchable
        expandable
      />
    </div>
  );
}
