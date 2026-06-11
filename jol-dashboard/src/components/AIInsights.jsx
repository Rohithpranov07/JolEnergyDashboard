"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Cpu,
  Info,
  Lightbulb,
  MapPin,
  Sparkles,
} from "lucide-react";
import { PromptInputBox } from "./ui/ai-prompt-box.jsx";
import { HandWrittenTitle } from "./ui/hand-writing-text.jsx";
import { supplierLeads, supplierStats } from "../data/supplierLeads.js";
import { buyerStats } from "../data/buyerLeads.js";
import { collectionStats } from "../data/collectionPoints.js";
import { marketStats } from "../data/marketPrices.js";
import { PIPELINE_CONTEXT } from "../lib/pipelineContext.js";

// ─── Derived data ─────────────────────────────────────────────────────────────

const STALE_LEADS = supplierLeads.filter(
  (l) => l.lastContactDaysAgo >= 14 && l.stage === "Lead",
);

// ─── Fallback helpers ─────────────────────────────────────────────────────────

function narrativeFallback() {
  const { total, citiesCount, staleLeads, tonPlusTier } = supplierStats;
  return (
    `Your supplier pipeline has ${total} leads across ${citiesCount} cities. ` +
    `${staleLeads} leads in Lead stage have not been contacted in 14+ days – ` +
    `these are your top priority. ${tonPlusTier} leads are at 1-Ton+ tier, ` +
    `representing ${((tonPlusTier / total) * 100).toFixed(0)}% of your high-value pipeline.`
  );
}

function computeFallbackCity() {
  const cityTonPlus = {};
  const cityContacted = {};
  const cityTotal = {};
  supplierLeads.forEach((l) => {
    cityTotal[l.city] = (cityTotal[l.city] || 0) + 1;
    if (l.volTier === "1 Ton+/mo" || l.volTier === "3 Ton+/mo") {
      cityTonPlus[l.city] = (cityTonPlus[l.city] || 0) + 1;
    }
    if (l.stage !== "Lead") {
      cityContacted[l.city] = (cityContacted[l.city] || 0) + 1;
    }
  });
  const ranked = Object.entries(cityTonPlus).sort((a, b) => b[1] - a[1]);
  const [city, count] = ranked[0] || ["Chennai", 0];
  return { city, count };
}

// ─── Smart alerts ─────────────────────────────────────────────────────────────

function buildAlerts() {
  const alerts = [];

  if (STALE_LEADS.length > 0) {
    alerts.push({
      id: "stale",
      severity: "warn",
      message: `${STALE_LEADS.length} supplier leads not contacted in 14+ days`,
    });
  }

  if (marketStats.cobalt.change30d > 10) {
    const change = marketStats.cobalt.change30d;
    const impact = Math.round(
      (change / 100) * 0.12 * (marketStats.cobalt.current / 1000) * 95,
    );
    alerts.push({
      id: "cobalt",
      severity: "info",
      message: `Cobalt up ${change}% in 30 days – NMC recovery margin impact: +₹${impact}/kg`,
    });
  }

  if (collectionStats.field > collectionStats.verified) {
    alerts.push({
      id: "field",
      severity: "warn",
      message: `${collectionStats.field} collection points are unverified field placeholders – schedule ground surveys in Chennai and Bengaluru`,
    });
  }

  if (buyerStats.highLoiCount >= 5) {
    alerts.push({
      id: "loi",
      severity: "tip",
      message: `${buyerStats.highLoiCount} buyers have ≥50% LOI probability – prioritise formal proposal to Nicomet, Epsilon, and Opera Chemisol`,
    });
  }

  return alerts;
}

const MODULE_ALERTS = buildAlerts();

// ─── API helpers ──────────────────────────────────────────────────────────────

async function callAI({ system, userContent, maxTokens }) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "narrative",
      system,
      messages: [{ role: "user", content: userContent }],
      maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-2.5" aria-busy="true" aria-label="Loading">
      {[94, 100, 62].map((w, i) => (
        <div
          key={i}
          className="h-3.5 rounded-full"
          style={{
            width: `${w}%`,
            background:
              "linear-gradient(90deg, rgba(17,24,39,0.05) 25%, rgba(17,24,39,0.11) 37%, rgba(17,24,39,0.05) 63%)",
            backgroundSize: "400% 100%",
            animation: `skShimmer 1.4s ease-in-out ${i * 0.12}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes skShimmer{0%{background-position:100% 0}100%{background-position:0 0}}`}</style>
    </div>
  );
}

/* ── Reusable section header (icon + eyebrow + title + badge) ───────────── */
function SectionHead({ eyebrow, title, accent, badge, icon }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon ? (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `${accent}14`,
              color: accent,
              boxShadow: `inset 0 0 0 1px ${accent}29`,
            }}
          >
            {icon}
          </span>
        ) : (
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: accent, boxShadow: `0 0 0 4px ${accent}1F` }}
          />
        )}
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: accent }}
          >
            {eyebrow}
          </div>
          <h2 className="mt-0.5 text-[15px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
            {title}
          </h2>
        </div>
      </div>
      {badge}
    </div>
  );
}

function Badge({ children, accent, muted }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
      style={
        muted
          ? {
              background: "var(--bg-nav)",
              color: "var(--text-muted)",
              boxShadow: "inset 0 0 0 1px var(--border-default)",
            }
          : {
              background: `${accent}14`,
              color: accent,
              boxShadow: `inset 0 0 0 1px ${accent}33`,
            }
      }
    >
      {!muted && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: accent }}
        />
      )}
      {children}
    </span>
  );
}

const ALERT_STYLES = {
  warn: { accent: "#B45309", Icon: AlertTriangle },
  info: { accent: "#185FA5", Icon: Info },
  tip: { accent: "#0A7864", Icon: Lightbulb },
};

function AlertCard({ alert, onDismiss }) {
  const s = ALERT_STYLES[alert.severity] || ALERT_STYLES.info;
  const Icon = s.Icon;
  return (
    <div
      className="group flex items-start gap-3 rounded-xl p-3.5 transition-all duration-200 hover:-translate-y-px"
      style={{
        borderLeft: `3px solid ${s.accent}`,
        background: `${s.accent}0D`,
        boxShadow: "inset 0 0 0 1px var(--border-subtle)",
      }}
    >
      <span
        className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${s.accent}1F`, color: s.accent }}
      >
        <Icon size={13} strokeWidth={2.4} />
      </span>
      <p className="flex-1 text-[13px] leading-snug text-[var(--text-primary)]">
        {alert.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(alert.id)}
        aria-label="Dismiss alert"
        className="shrink-0 self-start rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--border-subtle)] hover:text-[var(--text-secondary)]"
      >
        Dismiss
      </button>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-2 w-2 rounded-full bg-white/50"
          style={{ animation: `typDot .9s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <style>{`@keyframes typDot{0%,80%,100%{transform:scale(.7);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIInsights({ accentColor = "#F0656A" }) {
  // Section 1 – Narrative
  const [noApiKey, setNoApiKey] = useState(false);

  const [narrativeText, setNarrativeText] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(true);
  const [narrativeError, setNarrativeError] = useState(false);

  // Section 2 – City recommendation
  const [cityText, setCityText] = useState("");
  const [cityLoading, setCityLoading] = useState(true);
  const [cityError, setCityError] = useState(false);

  // Section 3 – Alerts
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // Section 4 – Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef(null);

  const SUGGESTIONS = [
    "Which city has the highest estimated monthly volume?",
    "How many leads are at 1-Ton+ tier?",
    "What does the cobalt price trend mean for NMC margins?",
    "Which buyer has the highest consumption?",
  ];

  // Fire narrative + city rec in parallel on mount.
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const narrativeSystem =
      "You are a business analyst assistant for Jol Energy, a Li-ion battery recycling startup. Analyse the pipeline data and give a 2-3 sentence business narrative. Be specific with numbers. Be direct and actionable. No preamble, no headers – just the narrative paragraph.";

    const citySystem =
      "You are a business development advisor for Jol Energy. Recommend the single best city to prioritise for supplier outreach next week. Give ONE city and ONE specific reason based on the data. Format: CITY: [name] – [one sentence reason]. No other text.";

    (async () => {
      const [narrativeResult, cityResult] = await Promise.allSettled([
        callAI({
          system: narrativeSystem,
          userContent: "Pipeline data as of Jun 2026: " + PIPELINE_CONTEXT,
          maxTokens: 350,
        }),
        callAI({
          system: citySystem,
          userContent: PIPELINE_CONTEXT,
          maxTokens: 200,
        }),
      ]);

      if (narrativeResult.status === "fulfilled") {
        setNarrativeText(narrativeResult.value);
      } else {
        const msg = narrativeResult.reason?.message || "";
        if (msg.includes("NO_KEY") || msg.includes("401")) setNoApiKey(true);
        setNarrativeError(true);
      }
      setNarrativeLoading(false);

      if (cityResult.status === "fulfilled") {
        setCityText(cityResult.value);
      } else {
        setCityError(true);
      }
      setCityLoading(false);
    })();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function dismissAlert(id) {
    setDismissedIds((prev) => new Set([...prev, id]));
  }

  const activeAlerts = MODULE_ALERTS.filter((a) => !dismissedIds.has(a.id));

  async function sendChat(text) {
    const question = text?.trim();
    if (!question || streaming) return;

    const userMsg = { role: "user", content: question };
    const nextMessages = [...chatMessages, userMsg];

    // Append user + empty assistant (will be filled by stream)
    setChatMessages([...nextMessages, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          system:
            "You are a data assistant for Jol Energy. Answer ONLY based on the pipeline data provided. Be concise (max 3 sentences). Include specific numbers from the data. If you cannot answer from the data, say so briefly.",
          messages: [
            ...nextMessages.slice(-6), // keep last 6 turns for context
            {
              role: "user",
              content:
                "Data: " + PIPELINE_CONTEXT + "\n\nQuestion: " + question,
            },
          ],
          maxTokens: 400,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw);
            if (
              evt.type === "content_block_delta" &&
              evt.delta?.type === "text_delta"
            ) {
              setChatMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: updated[updated.length - 1].content + evt.delta.text,
                };
                return updated;
              });
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      const msg = err.message || "";
      const isNoKey = msg.includes("NO_KEY") || msg.includes("401");
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: isNoKey
            ? "API unavailable – check GEMINI_API_KEY in .env"
            : `Sorry, I couldn't fetch a response. (${msg})`,
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }



  const fallbackCity = computeFallbackCity();
  // Gemini returns "CITY: <name> – <reason>"; pull out the parts to spotlight
  // the city name and reason separately.
  const cityMatch = cityText.match(/CITY:\s*(.+?)\s*[–-]\s*([\s\S]+)/i);

  return (
    <div className="section-stagger space-y-4">
      {/* ═══ 0 · EDITORIAL HEADER ══════════════════════════════════════════ */}
      <div className="glass-card relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-28 left-1/2 h-56 w-[65%] -translate-x-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${accentColor}24, transparent 70%)` }}
        />
        <div className="relative w-full">
          <HandWrittenTitle
            title="AI Insights"
            subtitle="Logistics optimisation, pricing analysis, and business intelligence — grounded in your live pipeline data"
          />
        </div>
        <span
          className="relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{
            background: `${accentColor}12`,
            color: accentColor,
            boxShadow: `inset 0 0 0 1px ${accentColor}2E`,
          }}
        >
          <Sparkles size={12} strokeWidth={2.4} />
          Powered by Gemini · gemini-2.5-flash
        </span>
      </div>

      {/* Work-in-progress banner */}
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-2.5"
        style={{
          background: `${accentColor}0D`,
          boxShadow: `inset 0 0 0 1px ${accentColor}33`,
        }}
        role="status"
      >
        <span
          className="flex h-5 shrink-0 items-center rounded-full px-2 text-[9px] font-bold uppercase tracking-wider text-white"
          style={{ background: accentColor }}
        >
          Beta
        </span>
        <p className="text-[12.5px] text-[var(--text-secondary)]">
          This module is under active development — features and outputs may
          change.
        </p>
      </div>

      {/* API key banner */}
      {noApiKey && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
          style={{
            background: `${accentColor}10`,
            boxShadow: `inset 0 0 0 1px ${accentColor}40`,
          }}
          role="alert"
        >
          <p className="text-sm text-[var(--text-primary)]">
            Add your Gemini API key to{" "}
            <code className="rounded bg-[var(--bg-nav)] px-1 font-mono text-[12px]">
              .env
            </code>{" "}
            to enable AI insights.
          </p>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="pressable shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white transition-transform hover:scale-105"
            style={{ background: accentColor, boxShadow: `0 4px 14px ${accentColor}33` }}
          >
            Get API key →
          </a>
        </div>
      )}

      {/* ── SECTION 1 – PIPELINE HEALTH NARRATIVE ─────────────────────── */}
      <div className="glass-card p-5">
        <SectionHead
          eyebrow="Pipeline health"
          title="Business narrative"
          accent={accentColor}
          icon={<Sparkles size={16} strokeWidth={2.2} />}
          badge={<Badge accent={accentColor}>AI-generated</Badge>}
        />

        {narrativeLoading ? (
          <div className="rounded-2xl p-4" style={{ background: `${accentColor}08` }}>
            <Skeleton />
          </div>
        ) : (
          <div
            className="relative overflow-hidden rounded-2xl py-4 pl-5 pr-4"
            style={{
              background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}05)`,
              boxShadow: `inset 0 0 0 1px ${accentColor}24`,
            }}
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 h-full w-1"
              style={{
                background: `linear-gradient(${accentColor}, ${accentColor}66)`,
              }}
            />
            <p className="text-[14px] leading-relaxed text-[var(--text-primary)]">
              {narrativeError ? narrativeFallback() : narrativeText}
            </p>
          </div>
        )}

        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <Cpu size={12} /> gemini-2.5-flash · max 350 tokens · live dashboard data
        </p>
      </div>

      {/* ── SECTIONS 2 + 3 – CITY RECOMMENDATION | SMART ALERTS ──────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* City recommendation */}
        <div className="glass-card flex flex-col p-5">
          <SectionHead
            eyebrow="Next move"
            title="Recommended target city"
            accent={accentColor}
            icon={<MapPin size={16} strokeWidth={2.2} />}
            badge={
              !cityError && !cityLoading && cityText ? (
                <Badge accent={accentColor}>AI-generated</Badge>
              ) : (
                <Badge muted>rule-based</Badge>
              )
            }
          />

          {cityLoading ? (
            <div className="flex-1 rounded-2xl p-4" style={{ background: "rgba(180,83,9,0.05)" }}>
              <Skeleton />
            </div>
          ) : (
            <div
              className="flex flex-1 items-start gap-3 rounded-2xl p-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(180,83,9,0.11), rgba(180,83,9,0.03))",
                boxShadow: "inset 0 0 0 1px rgba(180,83,9,0.18)",
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "rgba(180,83,9,0.14)", color: "#B45309" }}
              >
                <MapPin size={17} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                {cityError ? (
                  <>
                    <p className="text-[16px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
                      {fallbackCity.city}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                      {fallbackCity.count} high-value leads with low contact rate.
                    </p>
                  </>
                ) : cityMatch ? (
                  <>
                    <p className="text-[16px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
                      {cityMatch[1]}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                      {cityMatch[2]}
                    </p>
                  </>
                ) : (
                  <p className="text-[13px] leading-relaxed text-[var(--text-primary)]">
                    {cityText}
                  </p>
                )}
              </div>
            </div>
          )}

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <Cpu size={12} /> gemini-2.5-flash · max 200 tokens · outreach priority
          </p>
        </div>

        {/* Smart alerts */}
        <div className="glass-card p-5">
          <SectionHead
            eyebrow="Monitoring"
            title={`Smart alerts (${activeAlerts.length})`}
            accent={accentColor}
            icon={<AlertTriangle size={16} strokeWidth={2.2} />}
            badge={<Badge muted>rule-based</Badge>}
          />

          {activeAlerts.length === 0 ? (
            <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-default)]">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: "rgba(10,120,100,0.12)", color: "#0A7864" }}
              >
                <Check size={16} strokeWidth={2.6} />
              </span>
              <p className="text-[13px] font-medium text-[var(--text-secondary)]">
                All clear — no active alerts.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeAlerts.map((a) => (
                <AlertCard key={a.id} alert={a} onDismiss={dismissAlert} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 4 – ASK YOUR DATA ────────────────────────────────────── */}
      <div className="glass-card overflow-hidden p-0">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #6D5CF5)",
                boxShadow: "0 4px 14px rgba(139,92,246,0.4)",
              }}
            >
              <Cpu size={17} strokeWidth={2.2} />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--card)] bg-emerald-400" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8B5CF6]">
                AI Neural Engine
              </div>
              <h2 className="mt-0.5 text-[15px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
                Ask your pipeline data
              </h2>
            </div>
          </div>
          <Badge accent="#8B5CF6">Live</Badge>
        </div>

        <div className="p-5">
          {/* Suggestion chips */}
          {chatMessages.length === 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendChat(s)}
                  className="pressable inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-all duration-200"
                  style={{
                    background: "var(--bg-nav)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${accentColor}12`;
                    e.currentTarget.style.borderColor = `${accentColor}66`;
                    e.currentTarget.style.color = accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg-nav)";
                    e.currentTarget.style.borderColor = "var(--border-default)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <Sparkles size={11} className="opacity-60" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Chat history */}
          <div
            className="mb-3 max-h-80 min-h-[150px] space-y-3 overflow-y-auto rounded-2xl p-4"
            style={{
              background: "linear-gradient(180deg, #17181C, #0E0F12)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.07)",
            }}
          >
            {chatMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-center">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: "rgba(139,92,246,0.16)", color: "#A78BFA" }}
                >
                  <Sparkles size={18} strokeWidth={2.2} />
                </span>
                <p className="text-[12.5px] text-[#9aa0aa]">
                  Ask a question or pick a suggestion to begin.
                </p>
              </div>
            ) : (
              chatMessages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="chat-msg flex justify-end">
                    <div
                      className="max-w-[82%] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] leading-relaxed text-white"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                        boxShadow: `0 4px 14px ${accentColor}44`,
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="chat-msg flex items-start gap-2.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #3A3A3A, #111)" }}
                    >
                      JE
                    </span>
                    <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-100">
                      {m.content ||
                        (streaming && i === chatMessages.length - 1 ? (
                          <TypingDots />
                        ) : (
                          ""
                        ))}
                    </div>
                  </div>
                ),
              )
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <PromptInputBox
            onSend={(msg) => sendChat(msg)}
            isLoading={streaming}
            placeholder="Ask about your pipeline data..."
            className="border-[#444444]/60 bg-[#16171A]"
          />

          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#888888]">
            <Cpu size={12} /> gemini-2.5-flash · max 400 tokens · context: live
            pipeline data
          </p>
        </div>
      </div>
    </div>
  );
}
