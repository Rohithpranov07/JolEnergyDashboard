"use client";

import { useRef, useState } from "react";
import {
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

function PriceTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const date = payload[0].payload.date;
  return (
    <div className="rounded-md bg-[var(--bg-elevated)] px-3 py-2 text-[12px] text-white shadow-lg">
      <div className="mb-1 font-semibold">Date: {date}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.stroke }}>
          {p.name}: ${p.value.toLocaleString()} (₹
          {((p.value / 1000) * currentPrices.usdInr).toFixed(0)}/kg)
        </div>
      ))}
      <div className="mt-1 text-[10px] italic text-gray-300">
        Source: Trading Economics / SMM metal.com
      </div>
    </div>
  );
}

export default function MarketIntelligence() {
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

  return (
    <div className="space-y-5">
      {/* ═══ 0 · EDITORIAL HEADER ══════════════════════════════════════════ */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 flex flex-col items-center justify-center gap-4 w-full relative" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", boxShadow: "0 1px 2px rgba(17,24,39,0.04), 0 6px 24px rgba(17,24,39,0.06)" }}>
        <div className="w-full relative">
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.11em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: -20 }} className="text-center">

          </div>
          <HandWrittenTitle
            title="Market Intelligence"
            subtitle={`Cobalt $${currentPrices.metals[0].usdPerMT.toLocaleString()}/MT · Nickel $${currentPrices.metals[1].usdPerMT.toLocaleString()}/MT · Lithium Carbonate $${currentPrices.metals[2].usdPerMT.toLocaleString()}/MT`}
          />
        </div>
      </div>

      {/* ROW 1 – METAL PRICE KPI CARDS + SPARKLINES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {currentPrices.metals.map((m) => (
          <div key={m.id} className="flex flex-col">
            <KPICard
              value={`$${m.usdPerMT.toLocaleString()}/MT`}
              label={`${m.name} (${m.formula})`}
              subtext={`₹${m.inrPerKg.toLocaleString()}/kg · ${trendArrow(m.trendDir)}${m.trend}`}
              color={m.color}
              source={`${m.source} – ${m.sourceUrl}`}
            />
            {sparklines[m.id] && (
              <div className="mt-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-1 py-0.5">
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart data={sparklines[m.id].map((v) => ({ v }))}>
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={m.color}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ROW 2 – 30-DAY PRICE CHART */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            30-day battery metal spot prices ·{" "}
            <span className="font-normal text-[var(--text-secondary)]">
              Source: Trading Economics / SMM
            </span>
          </h3>
          <div className="flex gap-2">
            {LINE_METALS.map((m) => {
              const on = visible[m.key];
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => toggleLine(m.key)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors"
                  style={{
                    borderColor: m.color,
                    background: on ? m.color : "transparent",
                    color: on ? "var(--bg-surface)" : m.color,
                  }}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: on ? "var(--bg-surface)" : m.color }}
                  />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
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
                strokeWidth={2}
                dot={false}
              />
            )}
            {visible.nickel && (
              <Line
                yAxisId="right"
                dataKey="nickel_usd"
                name="Nickel (USD/MT)"
                stroke="#0A7864"
                strokeWidth={2}
                dot={false}
              />
            )}
            {visible.liCarb && (
              <Line
                yAxisId="right"
                dataKey="liCarb_usd"
                name="Li Carb (USD/MT)"
                stroke="#B45309"
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ROW 3 – MARGIN CALCULATOR (55) + SCRAP TABLE (45) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-11">
        {/* margin calculator */}
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 lg:col-span-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Recovery margin calculator
          </h3>
          <p className="mb-4 text-[12px] text-[var(--text-secondary)]">
            Estimate monthly net recovery value from battery feedstock
          </p>

          {/* input volume */}
          <label className="mb-4 block">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">
              Monthly input volume: {inputKg.toLocaleString()} kg
            </span>
            <input
              type="range"
              min={100}
              max={5000}
              step={100}
              value={inputKg}
              onChange={(e) => setInputKg(Number(e.target.value))}
              className="mt-1 w-full"
              style={{ accentColor: "#185FA5" }}
            />
          </label>

          {/* chemistry selector */}
          <div className="mb-1 flex gap-2">
            {chemistryProfiles.map((c) => {
              const on = c.id === chemId;
              const short = c.id.replace("NMC", "NMC ");
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChemId(c.id)}
                  className="flex-1 rounded-md border px-2 py-1.5 text-[13px] font-medium transition-colors"
                  style={{
                    borderColor: on ? "#185FA5" : "var(--border-default)",
                    background: on ? "#185FA5" : "var(--bg-surface)",
                    color: on ? "var(--bg-surface)" : "var(--text-secondary)",
                  }}
                >
                  {short}
                </button>
              );
            })}
          </div>
          <p className="mb-4 text-[12px] italic text-[var(--text-secondary)]">
            {chemistry.note}
          </p>

          {/* processing cost */}
          <label className="mb-4 block">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">
              Processing cost: ₹{procCost}/kg
            </span>
            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={procCost}
              onChange={(e) => setProcCost(Number(e.target.value))}
              className="mt-1 w-full"
              style={{ accentColor: "#185FA5" }}
            />
          </label>

          {/* output box */}
          <div className="rounded-lg bg-[var(--bg-elevated)] p-4 text-white">
            <div className="flex justify-between text-[13px]">
              <span className="text-gray-300">Gross recovery value</span>
              <span>₹{result.grossINR.toLocaleString()}</span>
            </div>
            <div className="mt-1 flex justify-between text-[13px]">
              <span className="text-gray-300">Processing cost</span>
              <span>−₹{result.processingCostINR.toLocaleString()}</span>
            </div>
            <div className="my-2 border-t border-white/20" />
            <div className="flex items-end justify-between">
              <span className="text-gray-300">Net recovery value</span>
              <span className="text-[24px] font-bold leading-none">
                ₹{result.netINR.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-right text-[14px] text-[#EF9F27]">
              = ₹{result.netPerKgINR.toLocaleString()}/kg input
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
            Based on latest prices. Real margins depend on battery condition,
            actual recovery yield, and market pricing at time of sale.
          </p>
        </div>

        {/* scrap price reference */}
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 lg:col-span-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            Battery scrap price reference
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[var(--border-default)] text-left text-[var(--text-secondary)]">
                  <th className="py-1.5 pr-2 font-semibold">Category</th>
                  <th className="px-1 py-1.5 font-semibold">Avg wt</th>
                  <th className="px-1 py-1.5 font-semibold">INR/kg</th>
                  <th className="px-1 py-1.5 font-semibold">Tier</th>
                </tr>
              </thead>
              <tbody>
                {scrapPriceRef.map((r, i) => {
                  const tier = scrapTier(r);
                  const tc = TIER_COLOR[tier];
                  return (
                    <tr key={i} className="border-b border-[var(--border-subtle)]">
                      <td
                        className="py-1.5 pr-2 font-medium text-[var(--text-primary)]"
                        style={{ borderLeft: `3px solid ${r.color}`, paddingLeft: 8 }}
                      >
                        {r.category}
                      </td>
                      <td className="px-1 py-1.5 text-[var(--text-secondary)]">{r.avgWeightG} g</td>
                      <td className="px-1 py-1.5 text-[var(--text-secondary)]">
                        ₹{r.inrPerKgMin}–{r.inrPerKgMax}
                      </td>
                      <td className="px-1 py-1.5">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium"
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
        </div>
      </div>

      {/* ROW 4 – POLICY TRACKER */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Policy &amp; regulatory tracker
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {policyTracker.map((p) => (
            <div
              key={p.id}
              className="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] p-3"
              style={{ borderLeft: "3px solid #27500A" }}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h4 className="text-[14px] font-bold text-[var(--text-primary)]">
                  {p.title}
                </h4>
                <span className="shrink-0 rounded-full bg-[#EAF3DE] px-2 py-0.5 text-[11px] font-semibold text-[#27500A]">
                  {p.status}
                </span>
              </div>
              <p className="line-clamp-2 text-[13px] text-[var(--text-secondary)]">
                {p.summary}
              </p>
              <p
                className="mt-2 text-[12px] font-medium"
                style={{ color: impactColor(p.impact) }}
              >
                Impact: {p.impact}
              </p>
              <a
                href={p.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[12px] text-[#185FA5] hover:underline"
              >
                {p.authority}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ROW 5 – CURRENCY TILE */}
      <div className="flex justify-end">
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-right">
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            USD/INR: ₹{currentPrices.usdInr} ·{" "}
            <span className="font-normal text-[var(--text-secondary)]">
              As of {currentPrices.asOf}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Source: exchange-rates.org
          </div>
          <button
            type="button"
            onClick={showToast}
            className="mt-2 rounded-md border border-[#185FA5] px-3 py-1 text-[12px] font-medium text-[#185FA5] transition-colors hover:bg-[#185FA5] hover:text-white"
          >
            Refresh prices
          </button>
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[1000] rounded-md bg-[var(--bg-elevated)] px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
