"use client";

import { useEffect, useState } from "react";
import HealthScore from "./HealthScore.jsx";
import SupplierPipeline from "./SupplierPipeline.jsx";
import BuyerPipeline from "./BuyerPipeline.jsx";
import CollectionNetwork from "./CollectionNetwork.jsx";
import MarketIntelligence from "./MarketIntelligence.jsx";
import AIInsights from "./AIInsights.jsx";
import AlertsPanel from "./AlertsPanel.jsx";
import { supplierStats } from "../data/supplierLeads.js";
import { buyerStats } from "../data/buyerLeads.js";
import { collectionStats } from "../data/collectionPoints.js";
import { marketStats } from "../data/marketPrices.js";

const TABS = [
  { id: "suppliers",  label: "Suppliers",   color: "#185FA5" },
  { id: "buyers",     label: "Buyers",      color: "#0A7864" },
  { id: "collection", label: "Collection",  color: "#B45309" },
  { id: "market",     label: "Market",      color: "#534AB7" },
  { id: "ai",         label: "AI Insights", color: "#A32D2D" },
];

// Rule-based alerts — same conditions as AIInsights section 3.
// Shape: { id, message, severity, dismissed: false }
const BASE_ALERTS = [
  supplierStats.staleLeads > 0 && {
    id: "stale", severity: "warn", dismissed: false,
    message: `${supplierStats.staleLeads} supplier leads not contacted in 14+ days`,
  },
  marketStats.cobalt.change30d > 10 && {
    id: "cobalt", severity: "info", dismissed: false,
    message: `Cobalt up ${marketStats.cobalt.change30d}% in 30 days — NMC recovery margin improving`,
  },
  collectionStats.field > collectionStats.verified && {
    id: "field", severity: "warn", dismissed: false,
    message: `${collectionStats.field} collection points unverified — schedule ground surveys`,
  },
  buyerStats.highLoiCount >= 5 && {
    id: "loi", severity: "tip", dismissed: false,
    message: `${buyerStats.highLoiCount} buyers at ≥50% LOI probability — push for formal proposals`,
  },
].filter(Boolean);

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("suppliers");
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Page-load progress bar — DOM manipulation, no React state needed.
  useEffect(() => {
    const bar = document.createElement("div");
    Object.assign(bar.style, {
      position: "fixed",
      top: "0", left: "0",
      height: "3px",
      width: "0%",
      background: "#185FA5",
      zIndex: "9999",
      pointerEvents: "none",
      transition: "width 1200ms ease-out",
    });
    document.body.appendChild(bar);

    // Double-rAF: first frame registers initial state, second triggers transition.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { bar.style.width = "100%"; });
    });

    const timer = setTimeout(() => bar.remove(), 1800);
    return () => { clearTimeout(timer); bar.remove(); };
  }, []);

  // Read ?tab= on load + sync with browser back/forward.
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
  const alertCount = BASE_ALERTS.length;

  return (
    /*
     * position:relative + min-h-screen so that AlertsPanel (position:absolute)
     * stretches to cover the full viewport without needing position:fixed.
     */
    <div style={{ position: "relative", minHeight: "100vh", background: "#F8F9FA" }}>
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 border-b border-[#E0E0E0] bg-white">
        <div className="mx-auto flex h-16 max-w-350 items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo */}
          <div className="flex shrink-0 items-baseline gap-2">
            <span className="text-lg font-extrabold tracking-tight text-[#0D2137]">
              JOL ENERGY
            </span>
            <span className="hidden text-sm font-semibold text-[#185FA5] sm:inline">
              Dashboard
            </span>
          </div>

          {/* Tab nav — dropdown on mobile, buttons on desktop */}
          <div className="flex flex-1 items-center justify-center">
            {/* Mobile (<768px) */}
            <select
              className="block rounded-md border border-[#E0E0E0] px-3 py-1.5 text-sm font-semibold outline-none sm:hidden"
              style={{ color: active.color }}
              value={activeTab}
              onChange={(e) => changeTab(e.target.value)}
              aria-label="Select module"
            >
              {TABS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>

            {/* Desktop (≥768px) */}
            <nav className="hidden items-center gap-1 overflow-x-auto sm:flex">
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
          </div>

          {/* Health ring + alert bell */}
          <div className="flex shrink-0 items-center gap-3">
            <HealthScore size={46} />
            <button
              type="button"
              onClick={() => setAlertsOpen(true)}
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

      {/* MAIN CONTENT
          key={activeTab} forces remount on every tab switch →
          KPI useCountUp hooks re-run their count-up animation. */}
      <main className="mx-auto max-w-350 px-4 py-6 sm:px-6">
        {active.id === "suppliers" ? (
          <SupplierPipeline key={activeTab} />
        ) : active.id === "buyers" ? (
          <BuyerPipeline key={activeTab} />
        ) : active.id === "collection" ? (
          <CollectionNetwork key={activeTab} />
        ) : active.id === "market" ? (
          <MarketIntelligence key={activeTab} />
        ) : active.id === "ai" ? (
          <AIInsights key={activeTab} />
        ) : null}
      </main>

      {/* AlertsPanel — last child of positioned root, uses position:absolute */}
      <AlertsPanel
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        alerts={BASE_ALERTS}
      />
    </div>
  );
}
