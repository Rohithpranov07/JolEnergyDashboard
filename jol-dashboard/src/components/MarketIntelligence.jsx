"use client";

import { useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  chemistryProfiles,
  currentPrices,
  policyTracker,
  priceHistory,
  scrapPriceRef,
  sparklines,
  calcRecoveryValueINR,
} from "../data/marketPrices.js";
import KPICard from "./KPICard.jsx";
import { HandWrittenTitle } from "./ui/hand-writing-text.jsx";

const LINE_METALS = [
  { key: "cobalt", dataKey: "cobalt_usd", label: "Cobalt", color: "#185FA5", axis: "left" },
  { key: "nickel", dataKey: "nickel_usd", label: "Nickel", color: "#0A7864", axis: "right" },
  { key: "liCarb", dataKey: "liCarb_usd", label: "Li Carbonate", color: "#B45309", axis: "right" },
];
const TIER_COLOR = {
  High: { bg: "#EAF3DE", text: "#27500A" },
  Medium: { bg: "#FEF3C7", text: "#B45309" },
  Low: { bg: "#F1EFE8", text: "#444441" },
};

const LABEL_STYLE = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const trendArrow = (dir) => (dir === "up" ? "↑ " : dir === "down" ? "↓ " : "");

function scrapTier(row) {
  const first = (row.recoveryTier || "").trim().split(/[\s,]+/)[0].toLowerCase();
  if (first === "high") return "High";
  if (first === "medium" || first === "mid") return "Medium";
  if (first === "low") return "Low";
  const m = row.inrPerKgMid || 0;
  return m >= 120 ? "High" : m >= 60 ? "Medium" : "Low";
}
function impactColor(impact) {
  const first = (impact || "").trim().split(/[\s–-]+/)[0].toLowerCase();
  if (first === "high") return "#27500A";
  if (first === "medium") return "#B45309";
  if (first === "low") return "var(--text-secondary)";
  return "var(--text-secondary)";
}

/* ── Reusable section header (eyebrow + title) ──────────────────────────── */
function SectionHead({ eyebrow, title, accent, right }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <div style={{ ...LABEL_STYLE, color: accent }}>{eyebrow}</div>
        <h3 className="mt-1 text-[15px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
          {title}
        </h3>
      </div>
      {right}
    </div>
  );
}

function PriceTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const date = payload[0].payload.date;
  return (
    <div
      className="rounded-xl px-3 py-2 text-[12px] shadow-lg"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        color: "var(--text-primary)",
        backdropFilter: "blur(14px) saturate(180%)",
      }}
    >
      <div className="mb-1 font-semibold">{date}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5" style={{ color: p.stroke }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.stroke }} />
          {p.name}: ${p.value.toLocaleString()}{" "}
          <span className="opacity-70">
            (₹{((p.value / 1000) * currentPrices.usdInr).toFixed(0)}/kg)
          </span>
        </div>
      ))}
      <div className="mt-1 text-[10px] italic text-[var(--text-muted)]">
        Source: Trading Economics / SMM metal.com
      </div>
    </div>
  );
}

export default function MarketIntelligence({ accentColor = "#8B7FF5" }) {
  const [visible, setVisible] = useState({
    cobalt: true,
    nickel: true,
    liCarb: true,
  });
  const [inputKg, setInputKg] = useState(1000);
  const [chemId, setChemId] = useState("NMC622");
  const [procCost, setProcCost] = useState(25);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const chemistry =
    chemistryProfiles.find((c) => c.id === chemId) || chemistryProfiles[0];
  const result = calcRecoveryValueINR(chemistry, inputKg, procCost);

  const toggleLine = (k) => setVisible((v) => ({ ...v, [k]: !v[k] }));

  const showToast = () => {
    setToast("Rate updated to ₹95.0 (demo – connect live API for production)");
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  };

  const sliderStyle = { accentColor };

  return (
    <div className="space-y-5">
      {/* ═══ 0 · EDITORIAL HEADER ══════════════════════════════════════════ */}
      <div className="glass-card flex w-full flex-col items-center justify-center gap-4 p-5">
        <div className="relative w-full">
          <HandWrittenTitle
            title="Market Intelligence"
            subtitle={`Cobalt $${currentPrices.metals[0].usdPerMT.toLocaleString()}/MT · Nickel $${currentPrices.metals[1].usdPerMT.toLocaleString()}/MT · Lithium Carbonate $${currentPrices.metals[2].usdPerMT.toLocaleString()}/MT`}
          />
        </div>
      </div>

      {/* ROW 1 – METAL PRICE KPI CARDS + SPARKLINES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {currentPrices.metals.map((m) => {
          const spark = sparklines[m.id];
          const gradId = `spark-${m.id}`;
          return (
            <div key={m.id} className="flex flex-col">
              <KPICard
                value={`$${m.usdPerMT.toLocaleString()}/MT`}
                label={`${m.name} (${m.formula})`}
                subtext={`₹${m.inrPerKg.toLocaleString()}/kg · ${trendArrow(m.trendDir)}${m.trend}`}
                color={m.color}
                source={`${m.source} – ${m.sourceUrl}`}
              />
              {spark && (
                <div
                  className="-mt-2 overflow-hidden rounded-b-2xl px-2 pb-1 pt-3"
                  style={{
                    background: `linear-gradient(180deg, transparent, ${m.color}0D)`,
                    border: "1px solid var(--border-subtle)",
                    borderTop: "none",
                    marginLeft: 1,
                    marginRight: 1,
                  }}
                >
                  <div className="mb-0.5 flex items-center justify-between px-1">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      30-day trend
                    </span>
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: m.trendDir === "down" ? "#DC2626" : "#047857" }}
                    >
                      {trendArrow(m.trendDir)}{m.trend}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={42}>
                    <AreaChart data={spark.map((v) => ({ v }))} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                      <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={m.color} stopOpacity={0.32} />
                          <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <YAxis hide domain={["dataMin", "dataMax"]} />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={m.color}
                        strokeWidth={1.75}
                        fill={`url(#${gradId})`}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ROW 2 – 30-DAY PRICE CHART */}
      <div className="glass-card p-5">
        <SectionHead
          eyebrow="Spot prices"
          title="30-day battery metal trends"
          accent={accentColor}
          right={
            <div className="flex flex-wrap gap-2">
              {LINE_METALS.map((m) => {
                const on = visible[m.key];
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => toggleLine(m.key)}
                    className="pressable inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-all"
                    style={{
                      borderColor: m.color,
                      background: on ? m.color : "transparent",
                      color: on ? "#fff" : m.color,
                      opacity: on ? 1 : 0.6,
                    }}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: on ? "#fff" : m.color }}
                    />
                    {m.label}
                  </button>
                );
              })}
            </div>
          }
        />
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={priceHistory}
            margin={{ top: 6, right: 8, bottom: 4, left: -8 }}
          >
            <XAxis
              dataKey="dateShort"
              tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
              interval={4}
              tickLine={false}
              axisLine={{ stroke: "var(--border-default)" }}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 70000]}
              tick={{ fontSize: 11, fill: "#185FA5" }}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 20000]}
              tick={{ fontSize: 11, fill: "#0A7864" }}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
              axisLine={false}
              tickLine={false}
              width={42}
            />
            <Tooltip content={<PriceTooltip />} />
            {visible.cobalt && (
              <Line
                yAxisId="left"
                dataKey="cobalt_usd"
                name="Cobalt (USD/MT)"
                stroke="#185FA5"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            {visible.nickel && (
              <Line
                yAxisId="right"
                dataKey="nickel_usd"
                name="Nickel (USD/MT)"
                stroke="#0A7864"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            {visible.liCarb && (
              <Line
                yAxisId="right"
                dataKey="liCarb_usd"
                name="Li Carb (USD/MT)"
                stroke="#B45309"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ROW 3 – MARGIN CALCULATOR (55) + SCRAP TABLE (45) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-11">
        {/* margin calculator */}
        <div className="glass-card p-5 lg:col-span-6">
          <SectionHead
            eyebrow="Interactive"
            title="Recovery margin calculator"
            accent={accentColor}
          />
          <p className="-mt-2 mb-4 text-[12px] text-[var(--text-secondary)]">
            Estimate monthly net recovery value from battery feedstock.
          </p>

          {/* input volume */}
          <label className="mb-4 block">
            <span className="flex items-baseline justify-between text-[13px] font-medium text-[var(--text-secondary)]">
              Monthly input volume
              <span className="tnum text-[14px] font-bold text-[var(--text-primary)]">
                {inputKg.toLocaleString()} kg
              </span>
            </span>
            <input
              type="range"
              min={100}
              max={5000}
              step={100}
              value={inputKg}
              onChange={(e) => setInputKg(Number(e.target.value))}
              className="mt-2 w-full cursor-pointer"
              style={sliderStyle}
            />
          </label>

          {/* chemistry selector */}
          <div className="mb-1">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
              Battery chemistry
            </span>
            <div className="flex gap-2">
              {chemistryProfiles.map((c) => {
                const on = c.id === chemId;
                const short = c.id.replace("NMC", "NMC ");
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChemId(c.id)}
                    className="pressable flex-1 rounded-xl border px-2 py-2 text-[13px] font-semibold transition-all"
                    style={{
                      borderColor: on ? accentColor : "var(--border-default)",
                      background: on ? accentColor : "var(--bg-surface)",
                      color: on ? "#fff" : "var(--text-secondary)",
                      boxShadow: on ? `0 4px 14px ${accentColor}33` : "none",
                    }}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mb-4 mt-2 text-[12px] italic text-[var(--text-secondary)]">
            {chemistry.note}
          </p>

          {/* processing cost */}
          <label className="mb-5 block">
            <span className="flex items-baseline justify-between text-[13px] font-medium text-[var(--text-secondary)]">
              Processing cost
              <span className="tnum text-[14px] font-bold text-[var(--text-primary)]">
                ₹{procCost}/kg
              </span>
            </span>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={procCost}
              onChange={(e) => setProcCost(Number(e.target.value))}
              className="mt-2 w-full cursor-pointer"
              style={sliderStyle}
            />
          </label>

          {/* output box */}
          <div
            className="relative overflow-hidden rounded-2xl p-5 text-white"
            style={{
              background: `linear-gradient(135deg, #1D1D2E 0%, ${accentColor}CC 160%)`,
              boxShadow: `0 10px 30px ${accentColor}33`,
            }}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-30 blur-2xl"
              style={{ background: accentColor }}
            />
            <div className="relative flex justify-between text-[13px]">
              <span className="text-white/70">Gross recovery value</span>
              <span className="tnum font-medium">₹{result.grossINR.toLocaleString()}</span>
            </div>
            <div className="relative mt-1.5 flex justify-between text-[13px]">
              <span className="text-white/70">Processing cost</span>
              <span className="tnum font-medium">−₹{result.processingCostINR.toLocaleString()}</span>
            </div>
            <div className="relative my-3 border-t border-white/15" />
            <div className="relative flex items-end justify-between">
              <span className="text-[13px] text-white/70">Net recovery value</span>
              <span className="tnum text-[28px] font-bold leading-none">
                ₹{result.netINR.toLocaleString()}
              </span>
            </div>
            <div className="relative mt-1.5 text-right text-[14px] font-semibold text-[#FBBF5C]">
              = ₹{result.netPerKgINR.toLocaleString()}/kg input
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
            Based on latest prices. Real margins depend on battery condition,
            actual recovery yield, and market pricing at time of sale.
          </p>
        </div>

        {/* scrap price reference */}
        <div className="glass-card p-5 lg:col-span-5">
          <SectionHead
            eyebrow="Reference"
            title="Battery scrap prices"
            accent={accentColor}
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="text-left text-[var(--text-muted)]" style={LABEL_STYLE}>
                  <th className="border-b border-[var(--border-default)] py-2 pr-2">Category</th>
                  <th className="border-b border-[var(--border-default)] px-1 py-2">Avg wt</th>
                  <th className="border-b border-[var(--border-default)] px-1 py-2">INR/kg</th>
                  <th className="border-b border-[var(--border-default)] px-1 py-2">Tier</th>
                </tr>
              </thead>
              <tbody>
                {scrapPriceRef.map((r, i) => {
                  const tier = scrapTier(r);
                  const tc = TIER_COLOR[tier];
                  return (
                    <tr
                      key={i}
                      className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--row-odd)]"
                      style={{ background: i % 2 ? "var(--row-odd)" : "transparent" }}
                    >
                      <td
                        className="py-2 pr-2 font-semibold text-[var(--text-primary)]"
                        style={{ borderLeft: `3px solid ${r.color}`, paddingLeft: 10 }}
                      >
                        {r.category}
                      </td>
                      <td className="px-1 py-2 text-[var(--text-secondary)]">{r.avgWeightG} g</td>
                      <td className="tnum px-1 py-2 text-[var(--text-secondary)]">
                        ₹{r.inrPerKgMin}–{r.inrPerKgMax}
                      </td>
                      <td className="px-1 py-2">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{ background: tc.bg, color: tc.text }}
                        >
                          {tier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* currency tile — folded into the reference card footer */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5">
            <div>
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                USD/INR ₹{currentPrices.usdInr}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                As of {currentPrices.asOf} · exchange-rates.org
              </div>
            </div>
            <button
              type="button"
              onClick={showToast}
              className="pressable rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white transition-transform hover:scale-105"
              style={{ background: accentColor, boxShadow: `0 4px 14px ${accentColor}33` }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ROW 4 – POLICY TRACKER */}
      <div className="glass-card p-5">
        <SectionHead
          eyebrow="Regulatory"
          title="Policy & regulatory tracker"
          accent={accentColor}
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {policyTracker.map((p) => {
            const accent = impactColor(p.impact);
            return (
              <div
                key={p.id}
                className="glass-card lift group relative overflow-hidden p-4"
                style={{ borderLeft: `3px solid ${accent}` }}
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <h4 className="text-[14px] font-bold text-[var(--text-primary)]">
                    {p.title}
                  </h4>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: `${accent}1A`, color: accent }}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="line-clamp-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                  {p.summary}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[12px] font-semibold" style={{ color: accent }}>
                    Impact: {p.impact}
                  </span>
                  <a
                    href={p.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] hover:underline"
                  >
                    {p.authority} ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[1000] rounded-xl bg-[var(--bg-elevated)] px-4 py-2 text-sm text-[var(--text-primary)] shadow-lg backdrop-blur-md">
          {toast}
        </div>
      )}
    </div>
  );
}
