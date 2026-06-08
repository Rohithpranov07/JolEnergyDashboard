"use client";

import { useEffect, useState } from "react";
import HealthScore from "./HealthScore.jsx";
import SupplierPipeline from "./SupplierPipeline.jsx";
import BuyerPipeline from "./BuyerPipeline.jsx";
import CollectionNetwork from "./CollectionNetwork.jsx";
import MarketIntelligence from "./MarketIntelligence.jsx";
import AIInsights from "./AIInsights.jsx";
import { supplierStats } from "../data/supplierLeads.js";
import { buyerStats } from "../data/buyerLeads.js";
import { collectionStats } from "../data/collectionPoints.js";

const TABS = [
  { id: "suppliers", label: "Suppliers", color: "#185FA5", task: "TASK-03" },
  { id: "buyers", label: "Buyers", color: "#0A7864", task: "TASK-04" },
  { id: "collection", label: "Collection", color: "#B45309", task: "TASK-05" },
  { id: "market", label: "Market", color: "#534AB7", task: "TASK-06" },
  { id: "ai", label: "AI Insights", color: "#A32D2D", task: "TASK-07" },
];

function BellIcon({ className }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ModulePlaceholder({ tab }) {
  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white p-8">
      <div className="flex items-center gap-3">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ background: tab.color }}
        />
        <h2 className="text-lg font-bold text-[#0D2137]">{tab.label}</h2>
      </div>
      <p className="mt-2 text-sm text-[#666666]">
        This module renders here — built in {tab.task}.
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("suppliers");

  // Read ?tab= on load + keep in sync with browser back/forward.
  useEffect(() => {
    const apply = () => {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (t && TABS.some((x) => x.id === t)) setActiveTab(t);
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);

  const changeTab = (id) => {
    setActiveTab(id);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", id);
    window.history.pushState({}, "", `?${params.toString()}`);
  };

  const active = TABS.find((t) => t.id === activeTab) || TABS[0];

  // Lightweight active-alert count for the bell badge (formalised in TASK-08).
  const alertCount = [
    supplierStats.staleLeads > 0,
    collectionStats.field > collectionStats.verified,
    buyerStats.highLoiCount >= 5,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 border-b border-[#E0E0E0] bg-white">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left: logo */}
          <div className="flex shrink-0 items-baseline gap-2">
            <span className="text-lg font-extrabold tracking-tight text-[#0D2137]">
              JOL ENERGY
            </span>
            <span className="hidden text-sm font-semibold text-[#185FA5] sm:inline">
              Dashboard
            </span>
          </div>

          {/* Center: tab navigation */}
          <nav className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const isActive = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => changeTab(t.id)}
                  aria-current={isActive ? "page" : undefined}
                  className="whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    color: isActive ? t.color : "#666666",
                    borderBottom: isActive
                      ? `2px solid ${t.color}`
                      : "2px solid transparent",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Right: health ring + alert bell */}
          <div className="flex shrink-0 items-center gap-3">
            <HealthScore size={46} />
            <button
              type="button"
              aria-label={`Alerts (${alertCount} active)`}
              className="relative rounded-full p-2 text-[#444444] transition-colors hover:bg-gray-100"
            >
              <BellIcon />
              {alertCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E24B4A] px-1 text-[10px] font-bold leading-none text-white">
                  {alertCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        {active.id === "suppliers" ? (
          <SupplierPipeline />
        ) : active.id === "buyers" ? (
          <BuyerPipeline />
        ) : active.id === "collection" ? (
          <CollectionNetwork />
        ) : active.id === "market" ? (
          <MarketIntelligence />
        ) : active.id === "ai" ? (
          <AIInsights />
        ) : (
          <ModulePlaceholder tab={active} />
        )}
      </main>
    </div>
  );
}
