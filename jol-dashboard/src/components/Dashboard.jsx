"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import { Layers, Users, MapPin, TrendingUp, Sparkles } from "lucide-react";
import HealthScore from "./HealthScore.jsx";
import SupplierPipeline from "./SupplierPipeline.jsx";
import BuyerPipeline from "./BuyerPipeline.jsx";
import CollectionNetwork from "./CollectionNetwork.jsx";
import MarketIntelligence from "./MarketIntelligence.jsx";
import AIInsights from "./AIInsights.jsx";
import AlertsPanel from "./AlertsPanel.jsx";
import ClickSpark from "./ClickSpark.jsx";
import { useAuth } from "./AuthProvider";
import { FloatingChatWidget } from "./ui/floating-chat-widget-shadcnui";
import { BGPattern } from "./ui/bg-pattern";
import { supplierStats } from "../data/supplierLeads.js";
import { buyerStats } from "../data/buyerLeads.js";
import { collectionStats } from "../data/collectionPoints.js";
import { marketStats } from "../data/marketPrices.js";

gsap.registerPlugin(useGSAP);

const TABS = [
  { id: "suppliers",  label: "Suppliers",   color: "#3D7FE8", glow: "rgba(61,127,232,0.45)",  Icon: Layers      },
  { id: "buyers",     label: "Buyers",      color: "#10B98A", glow: "rgba(16,185,138,0.42)",  Icon: Users       },
  { id: "collection", label: "Collection",  color: "#F59E0B", glow: "rgba(245,158,11,0.42)",  Icon: MapPin      },
  { id: "market",     label: "Market",      color: "#8B7FF5", glow: "rgba(139,127,245,0.42)", Icon: TrendingUp  },
  { id: "ai",         label: "AI Insights", color: "#F0656A", glow: "rgba(240,101,106,0.42)", Icon: Sparkles    },
];

const BASE_ALERTS = [
  supplierStats.staleLeads > 0 && {
    id: "stale", severity: "warn", dismissed: false,
    message: `${supplierStats.staleLeads} supplier leads not contacted in 14+ days`,
  },
  marketStats.cobalt.change30d > 10 && {
    id: "cobalt", severity: "info", dismissed: false,
    message: `Cobalt up ${marketStats.cobalt.change30d}% in 30 days – NMC recovery margin improving`,
  },
  collectionStats.field > collectionStats.verified && {
    id: "field", severity: "warn", dismissed: false,
    message: `${collectionStats.field} collection points unverified – schedule ground surveys`,
  },
  buyerStats.highLoiCount >= 5 && {
    id: "loi", severity: "tip", dismissed: false,
    message: `${buyerStats.highLoiCount} buyers at ≥50% LOI probability – push for formal proposals`,
  },
].filter(Boolean);

function BoltIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M8 1.5L3.5 7.5H7L6 12.5L11 6.5H7.5L8 1.5Z"
        fill="white" stroke="white" strokeWidth="0.3" strokeLinejoin="round"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function Dashboard() {
  const { signOutUser } = useAuth();
  const [activeTab, setActiveTab] = useState("suppliers");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const rootRef = useRef(null);
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const cursorGlowRef = useRef(null);
  const logoRef = useRef(null);

  /* ── Ambient cursor glow (lerped RAF for 60fps silk) ── */
  const mousePos = useRef({ x: 0, y: 0 });
  const glowPos = useRef({ x: 0, y: 0 });
  const rafId = useRef(null);

  const onMouseMove = useCallback((e) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
    if (cursorGlowRef.current && !cursorGlowRef.current.classList.contains('active')) {
      cursorGlowRef.current.classList.add('active');
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    if (cursorGlowRef.current) {
      cursorGlowRef.current.classList.remove('active');
    }
  }, []);

  useEffect(() => {
    const lerp = (a, b, t) => a + (b - a) * t;
    const tick = () => {
      glowPos.current.x = lerp(glowPos.current.x, mousePos.current.x, 0.08);
      glowPos.current.y = lerp(glowPos.current.y, mousePos.current.y, 0.08);
      if (cursorGlowRef.current) {
        cursorGlowRef.current.style.left = `${glowPos.current.x}px`;
        cursorGlowRef.current.style.top = `${glowPos.current.y}px`;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [onMouseMove, onMouseLeave]);

  /* Page-load progress bar */
  useEffect(() => {
    const bar = document.createElement("div");
    Object.assign(bar.style, {
      position: "fixed", top: "0", left: "0",
      height: "2.5px", width: "0%",
      background: "linear-gradient(90deg, #3D7FE8, #10B98A)",
      zIndex: "9999", pointerEvents: "none",
      transition: "width 1100ms cubic-bezier(0.23,1,0.32,1), opacity 400ms ease 1000ms",
      borderRadius: "0 3px 3px 0",
      boxShadow: "0 0 10px rgba(61,127,232,0.5)",
    });
    document.body.appendChild(bar);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { bar.style.width = "100%"; bar.style.opacity = "0"; });
    });
    const timer = setTimeout(() => bar.remove(), 1700);
    return () => { clearTimeout(timer); bar.remove(); };
  }, []);

  /* URL tab sync */
  useEffect(() => {
    const apply = () => {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (t && TABS.some((x) => x.id === t)) setActiveTab(t);
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);

  /* Header scroll state */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Sync accent CSS var for focus rings */
  const active = TABS.find((t) => t.id === activeTab) || TABS[0];
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", active.color);
  }, [active.color]);

  const changeTab = (id) => {
    setActiveTab(id);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", id);
    window.history.pushState({}, "", `?${params.toString()}`);
  };

  const alertCount = BASE_ALERTS.length;

  /* ── GSAP: one-shot header entrance ── */
  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || !headerRef.current) return;
      gsap.from(headerRef.current, {
        y: -28, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.05,
      });
    },
    { scope: rootRef }
  );

  /* ── GSAP: cinematic content morph on tab change ── */
  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || !contentRef.current) return;
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 18, scale: 0.97, filter: "blur(8px)" },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.55, ease: "back.out(1.1)" }
      );
      /* Logo spring micro-rotation on tab switch */
      if (logoRef.current) {
        gsap.fromTo(
          logoRef.current,
          { rotation: -12, scale: 0.92 },
          { rotation: 0, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.45)" }
        );
      }
    },
    { dependencies: [activeTab], scope: rootRef }
  );



  return (
    <ClickSpark
      sparkColor={active.color}
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
    <div ref={rootRef} className="relative min-h-screen overflow-x-hidden">

      {/* ── Dot background pattern ── */}
      <BGPattern
        variant="dots"
        mask="fade-edges"
        size={24}
        fill="rgba(17,24,39,0.28)"
        className="fixed! z-0! pointer-events-none"
      />

      {/* ── Ambient cursor glow ── */}
      <div
        ref={cursorGlowRef}
        className="cursor-glow"
        aria-hidden
        style={{
          background: `radial-gradient(circle, ${active.color}0D 0%, ${active.color}06 35%, transparent 70%)`,
        }}
      />

      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="bg-orb-primary"
          style={{ background: `radial-gradient(circle, ${active.glow} 0%, transparent 70%)` }}
        />
        <div className="bg-orb-secondary" />
      </div>
      <div className="grain-overlay" aria-hidden />

      {/* ── FLOATING GLASS HEADER ── */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 px-4 pt-3.5 pb-2.5 sm:px-5"
      >
        <div
          className="glass-header relative mx-auto flex h-16 max-w-360 items-center justify-between gap-3 overflow-hidden rounded-2xl px-4 sm:px-5 transition-shadow duration-300"
          style={{
            boxShadow: scrolled
              ? "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 1px rgba(17,24,39,0.04), 0 20px 48px rgba(17,24,39,0.14)"
              : undefined,
          }}
        >
          {/* Logo */}
          <div className="flex shrink-0 items-center gap-3">
            <div
              ref={logoRef}
              className="sheen flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${active.color} 0%, ${active.color}BB 100%)`,
                boxShadow: `0 3px 10px ${active.glow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                transition: "background 500ms ease, box-shadow 500ms ease",
                willChange: "transform",
              }}
            >
              <BoltIcon />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[14px] font-bold leading-none tracking-[-0.02em] text-(--text-primary)">
                Jol Energy
              </span>
              <span className="mt-0.5 hidden text-[10px] font-medium leading-none tracking-[0.04em] text-(--text-muted) sm:block">
                Intelligence Platform
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden h-6 w-px shrink-0 bg-[var(--border-default)] sm:block" />

          {/* Segmented tab nav */}
          <nav
            className="scrollbar-none relative flex max-w-[calc(100%-160px)] items-center overflow-x-auto rounded-full p-1 sm:max-w-none"
            style={{ background: "var(--bg-nav)" }}
          >
            {TABS.map((t) => {
              const isActive = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  data-tab={t.id}
                  type="button"
                  onClick={() => changeTab(t.id)}
                  aria-current={isActive ? "page" : undefined}
                  className="pressable relative z-10 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors duration-200 sm:px-4"
                  style={{
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 -z-10 rounded-full"
                      style={{
                        background: "var(--bg-tab-indicator)",
                        '--pill-glow': `${active.color}20`,
                        boxShadow: `0 1px 2px rgba(17,24,39,0.06), 0 4px 14px rgba(17,24,39,0.10), 0 0 20px 2px var(--pill-glow, rgba(61,127,232,0))`
                      }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="flex items-center gap-1.5">
                    <t.Icon
                      size={12}
                      style={{
                        color: isActive ? t.color : "var(--text-muted)",
                        filter: isActive ? `drop-shadow(0 0 4px ${t.color}88)` : "none",
                        transition: "color 200ms ease, filter 200ms ease",
                        flexShrink: 0,
                      }}
                    />
                    {t.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="hidden h-6 w-px shrink-0 bg-[var(--border-default)] sm:block" />

          {/* Health ring + alert bell */}
          <div className="flex shrink-0 items-center gap-1.5">
            <HealthScore size={40} accentColor={active.color} />
            <button
              type="button"
              onClick={() => setAlertsOpen(true)}
              aria-label={`Alerts (${alertCount} active)`}
              className="pressable relative flex h-9 w-9 items-center justify-center rounded-xl text-(--text-secondary) transition-colors"
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border-default)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = ""; }}
            >
              <BellIcon />
              {alertCount > 0 && (
                <span
                  className="badge-pulse absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white"
                  style={{ background: "#E24B4A" }}
                >
                  {alertCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => signOutUser()}
              aria-label="Sign out"
              title="Sign out"
              className="pressable relative flex h-9 w-9 items-center justify-center rounded-xl text-(--text-secondary) transition-colors"
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--border-default)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = ""; }}
            >
              <LogoutIcon />
            </button>
          </div>

          {/* Bottom accent line — fades in on scroll */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-6 right-6 h-px rounded-full transition-opacity duration-500"
            style={{
              background: `linear-gradient(90deg, transparent, ${active.color}55 35%, ${active.color}55 65%, transparent)`,
              opacity: scrolled ? 1 : 0,
            }}
          />
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 mx-auto max-w-360 px-4 py-5 sm:px-6">
        <div ref={contentRef}>
          <div key={activeTab}>
            {active.id === "suppliers" ? (
              <SupplierPipeline accentColor={active.color} />
            ) : active.id === "buyers" ? (
              <BuyerPipeline accentColor={active.color} />
            ) : active.id === "collection" ? (
              <CollectionNetwork accentColor={active.color} />
            ) : active.id === "market" ? (
              <MarketIntelligence accentColor={active.color} />
            ) : active.id === "ai" ? (
              <AIInsights accentColor={active.color} />
            ) : null}
          </div>
        </div>
      </main>

      {/* AlertsPanel */}
      <AlertsPanel
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        alerts={BASE_ALERTS}
      />

      {/* Floating AI Chat Widget — hidden on AI Insights tab */}
      {activeTab !== "ai" && <FloatingChatWidget />}
    </div>
    </ClickSpark>
  );
}
