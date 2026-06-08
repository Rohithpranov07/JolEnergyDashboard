"use client";

import { useMemo, useState } from "react";
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

const PRODUCT_COLORS = {
  NiSO4: "#185FA5",
  CoSO4: "#0A7864",
  Li2CO3: "#B45309",
  MnSO4: "#534AB7",
  PREC: "#A32D2D",
  LiOH: "#0F6E56",
  FeSO4: "#888780",
  CuSO4: "#1F9AA6", // not in spec list — data has 4 CuSO4 buyers
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

function ProductTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const { product, count } = payload[0].payload;
    return (
      <div className="rounded bg-[#0D2137] px-2.5 py-1.5 text-[12px] text-white shadow">
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
      <div className="rounded bg-[#0D2137] px-2.5 py-1.5 text-[12px] text-white shadow">
        {label}: {count} buyer{count === 1 ? "" : "s"}
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
        className="rounded-md border border-[#E0E0E0] bg-white px-2 py-1.5 text-sm text-[#333333] outline-none focus:border-[#0A7864]"
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

export default function BuyerPipeline() {
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
  const clearOne = (key) => setFilters((f) => ({ ...f, [key]: "" }));
  const clearAll = () => setFilters(EMPTY_FILTERS);
  const activeChips = Object.entries(filters).filter(([, v]) => v);

  const chipDisplay = (key, value) => {
    if (key === "category") return CATEGORY_LABELS[value] || value;
    if (key === "loiRange")
      return LOI_RANGES.find((r) => r.value === value)?.label || value;
    return value;
  };

  return (
    <div className="space-y-5">
      {/* ROW 1 — KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          value={buyerStats.total}
          label="Total buyer leads"
          color="#0A7864"
          source="IndiaMART/company sites/industry reports, Jun 2026"
          animateOnMount
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
        />
        <KPICard
          value={Object.keys(buyerStats.byProduct).length}
          label="Metal salt products"
          color="#534AB7"
          source="NiSO4, CoSO4, CuSO4, Li2CO3, MnSO4, PREC, LiOH, FeSO4"
          animateOnMount
        />
      </div>

      {/* ROW 2 — SIDE-BY-SIDE FUNNELS */}
      <div className="rounded-lg border border-[#E0E0E0] bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="flex-1">
            <FunnelChart
              title="Supplier pipeline (inflow)"
              stages={supplierStats.funnelStages}
            />
          </div>
          <div className="hidden flex-col items-center justify-center px-1 lg:flex">
            <div className="w-px flex-1 bg-[#E0E0E0]" />
            <span
              className="my-2 whitespace-nowrap text-[12px] font-semibold tracking-wide text-[#0D2137]"
              style={{ transform: "rotate(-90deg)" }}
            >
              JOL ENERGY
            </span>
            <div className="w-px flex-1 bg-[#E0E0E0]" />
          </div>
          <div className="flex-1">
            <FunnelChart
              title="Buyer pipeline (outflow)"
              stages={buyerStats.funnelStages}
            />
          </div>
        </div>
        <p className="mt-3 border-t border-[#EFEFEF] pt-3 text-center text-sm text-[#666666]">
          Supply-demand balance:{" "}
          <strong className="text-[#185FA5]">{supplierStats.total}</strong>{" "}
          inflow leads vs{" "}
          <strong className="text-[#0A7864]">{buyerStats.total}</strong> off-take
          leads
        </p>
      </div>

      {/* ROW 3 — PRODUCT MIX + CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* product mix donut */}
        <div className="rounded-lg border border-[#E0E0E0] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#0D2137]">
            Product requirement mix
          </h3>
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
                className="inline-flex items-center gap-1.5 text-[12px] text-[#444444]"
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
        <div className="rounded-lg border border-[#E0E0E0] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#0D2137]">
            Buyer category breakdown
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={categoryData}
              margin={{ top: 8, right: 8, bottom: 4, left: -16 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#444444" }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#888780" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CategoryTooltip />} cursor={{ fill: "#F7F7F7" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {categoryData.map((d) => (
                  <Cell
                    key={d.cat}
                    fill={CATEGORY_COLORS[d.cat] || "#B5D4F4"}
                    stroke="#D7DEE6"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 4 — FILTER BAR */}
      <div className="rounded-lg border border-[#E0E0E0] bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Category"
            value={filters.category}
            options={categoryOptions}
            onChange={(v) => setFilter("category", v)}
          />
          <Select
            label="Product"
            value={filters.product}
            options={productOptions}
            onChange={(v) => setFilter("product", v)}
          />
          <Select
            label="Pipeline Stage"
            value={filters.stage}
            options={stageOptions}
            onChange={(v) => setFilter("stage", v)}
          />
          <Select
            label="LOI Range"
            value={filters.loiRange}
            options={LOI_RANGES}
            onChange={(v) => setFilter("loiRange", v)}
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
                className="inline-flex items-center gap-1 rounded-full bg-[#E0F4EF] px-2.5 py-1 text-[12px] text-[#085041]"
              >
                {FILTER_LABELS[key]}: {chipDisplay(key, value)}
                <button
                  type="button"
                  aria-label={`Remove ${FILTER_LABELS[key]} filter`}
                  onClick={() => clearOne(key)}
                  className="ml-0.5 text-[#085041] hover:text-[#A32D2D]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ROW 5 — BUYER LEAD TABLE */}
      <LeadTable data={filteredLeads} columns={COLUMNS} searchable expandable />
    </div>
  );
}
