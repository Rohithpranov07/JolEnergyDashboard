"use client";

import dynamic from "next/dynamic";
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

// Leaflet touches window at import → load the map client-only.
const CollectionMap = dynamic(() => import("./CollectionMap.jsx"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] items-center justify-center rounded-lg bg-[#EEF1F4] text-sm text-[#888780]">
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

function DonutTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const { label, count } = payload[0].payload;
    return (
      <div className="rounded bg-[#0D2137] px-2.5 py-1.5 text-[12px] text-white shadow">
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
      <div className="rounded bg-[#0D2137] px-2.5 py-1.5 text-[12px] text-white shadow">
        {city}: {kg.toLocaleString()} kg/mo (estimated)
      </div>
    );
  }
  return null;
}

export default function CollectionNetwork() {
  const typeData = Object.entries(collectionStats.byType).map(
    ([type, count]) => ({ type, label: TYPE_LABELS[type] || type, count }),
  );
  const cityData = collectionStats.cityVolume.slice(0, 7);
  const minCost = Math.min(...hubEconomics.map((h) => h.costPerKg));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* LEFT — MAP (65%) */}
      <div className="rounded-lg border border-[#E0E0E0] bg-white p-2 lg:col-span-2">
        <CollectionMap />
      </div>

      {/* RIGHT — SIDEBAR (35%) */}
      <div className="space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-2">
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

        {/* Hub economics */}
        <div className="rounded-lg border border-[#E0E0E0] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#0D2137]">
            Hub economics
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-[#E0E0E0] text-left text-[#666666]">
                  <th className="py-1.5 pr-2 font-semibold">Hub</th>
                  <th className="px-1 py-1.5 font-semibold">Coll/trip</th>
                  <th className="px-1 py-1.5 font-semibold">Trips/mo</th>
                  <th className="px-1 py-1.5 font-semibold">₹/kg</th>
                  <th className="px-1 py-1.5 font-semibold">Breakeven</th>
                  <th className="px-1 py-1.5 font-semibold">Kg/mo</th>
                </tr>
              </thead>
              <tbody>
                {hubEconomics.map((h) => (
                  <tr key={h.hub} className="border-b border-[#F1F1F1]">
                    <td className="py-1.5 pr-2 font-medium text-[#0D2137]">
                      {h.hub}
                    </td>
                    <td className="px-1 py-1.5 text-[#444]">
                      {h.collectionsPerTrip}
                    </td>
                    <td className="px-1 py-1.5 text-[#444]">
                      {h.avgTripsPerMonth}
                    </td>
                    <td
                      className="px-1 py-1.5 font-semibold"
                      style={
                        h.costPerKg === minCost
                          ? { background: "#EAF3DE", color: "#27500A" }
                          : { color: "#444" }
                      }
                    >
                      ₹{h.costPerKg}
                    </td>
                    <td className="px-1 py-1.5 text-[#444]">
                      {h.breakevenKgMo.toLocaleString()}
                    </td>
                    <td className="px-1 py-1.5 text-[#444]">
                      {h.estMonthlyKg.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-[#888780]">
            Chennai has the lowest cost-per-kg (₹{minCost}/kg) — most viable hub.
          </p>
        </div>

        {/* Category donut */}
        <div className="rounded-lg border border-[#E0E0E0] bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-[#0D2137]">
            Points by type
          </h3>
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
                  className="inline-flex items-center gap-1.5 text-[12px] text-[#444444]"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: TYPE_COLOR[d.type] || "#888780" }}
                  />
                  {d.label} ({d.count})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* City volume bar */}
        <div className="rounded-lg border border-[#E0E0E0] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#0D2137]">
            Est. monthly volume by city (kg)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={cityData}
              layout="vertical"
              margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
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
                width={80}
                tick={{ fontSize: 12, fill: "#444444" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CityTooltip />} cursor={{ fill: "#FBF3E9" }} />
              <Bar dataKey="kg" fill="#B45309" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pin type legend with counts */}
        <div className="rounded-lg border border-[#E0E0E0] bg-white p-4 text-sm">
          <ul className="space-y-1.5 text-[#333333]">
            <li className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#185FA5]" />
              <strong>{collectionStats.verified}</strong> Registry/PRO points
              (verified)
            </li>
            <li className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full bg-[#888780]"
                style={{ border: "1px dashed #555" }}
              />
              <strong>{collectionStats.field}</strong> Field survey points (to
              visit)
            </li>
          </ul>
          <p className="mt-2 text-[12px] text-[#888780]">
            Field survey points marked with dashed pins — visit to verify.
          </p>
        </div>
      </div>
    </div>
  );
}
