"use client";

import { useEffect, useRef, useState } from "react";
import { PromptInputBox } from "./ui/ai-prompt-box.jsx";
import { HandWrittenTitle } from "./ui/hand-writing-text.jsx";
import { supplierLeads, supplierStats } from "../data/supplierLeads.js";
import { buyerLeads, buyerStats } from "../data/buyerLeads.js";
import { collectionStats } from "../data/collectionPoints.js";
import { marketStats } from "../data/marketPrices.js";

// ─── Context builder (< 800 tokens) ──────────────────────────────────────────

function buildPipelineContext() {
  const staleLeads = supplierLeads.filter(
    (l) => l.lastContactDaysAgo >= 14 && l.stage === "Lead",
  ).length;

  return JSON.stringify({
    supplierStats: {
      total: supplierStats.total,
      byState: supplierStats.byState,
      funnelStages: supplierStats.funnelStages.map((s) => ({
        stage: s.stage,
        count: s.count,
      })),
      totalKg: supplierStats.totalKg,
      tonPlusTier: supplierStats.tonPlusTier,
      staleLeads,
      highInterest: supplierStats.highInterest,
      citiesCount: supplierStats.citiesCount,
      cityVolumeChart: supplierStats.cityVolumeChart
        .slice(0, 5)
        .map((c) => ({ city: c.city, kg: c.kg })),
    },
    buyerStats: {
      total: buyerStats.total,
      byCategory: buyerStats.byCategory,
      byProduct: buyerStats.byProduct,
      totalConsumptionMT: buyerStats.totalConsumptionMT,
      highLoiCount: buyerStats.highLoiCount,
    },
    collectionStats: {
      total: collectionStats.total,
      verified: collectionStats.verified,
      field: collectionStats.field,
      totalKg: collectionStats.totalKg,
      byCity: collectionStats.byCity,
    },
    market: {
      cobalt: marketStats.cobalt,
      nickel: marketStats.nickel,
      liCarb: marketStats.liCarb,
      latestDate: marketStats.latestDate,
    },
  });
}

// Stable module-level values (avoids ref-during-render lint error).
const PIPELINE_CONTEXT = buildPipelineContext();

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
    <div className="space-y-2.5" aria-busy="true">
      {[70, 90, 55].map((w, i) => (
        <div
          key={i}
          className="h-4 rounded bg-[#E0E0E0]"
          style={{
            width: `${w}%`,
            animation: `skPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes skPulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
    </div>
  );
}

/* ── Reusable section header (eyebrow + title + badge) ──────────────────── */
function SectionHead({ eyebrow, title, accent, badge }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: accent, boxShadow: `0 0 0 4px ${accent}1F` }}
        />
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: accent,
            }}
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
      className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={
        muted
          ? { background: "var(--bg-nav)", color: "var(--text-muted)" }
          : { background: `${accent}1A`, color: accent }
      }
    >
      {children}
    </span>
  );
}

function AlertCard({ alert, onDismiss }) {
  const styles = {
    warn: { accent: "#B45309", label: "Warning" },
    info: { accent: "#185FA5", label: "Info" },
    tip: { accent: "#0A7864", label: "Tip" },
  };
  const s = styles[alert.severity] || styles.info;
  return (
    <div
      className="group flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] p-3.5 transition-colors hover:border-[var(--border-default)]"
      style={{ borderLeft: `3px solid ${s.accent}`, background: `${s.accent}0D` }}
    >
      <span
        className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
        style={{ background: `${s.accent}1F`, color: s.accent }}
      >
        {s.label}
      </span>
      <p className="flex-1 text-[13px] leading-snug text-[var(--text-primary)]">
        {alert.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(alert.id)}
        className="shrink-0 text-[11px] font-medium text-[var(--text-muted)] underline-offset-2 transition-colors hover:text-[var(--text-secondary)] hover:underline"
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
          className="inline-block h-2 w-2 rounded-full bg-[#666]"
          style={{ animation: `typDot .9s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <style>{`@keyframes typDot{0%,80%,100%{transform:scale(.7);opacity:.5}40%{transform:scale(1);opacity:1}}`}</style>
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
            ? "API unavailable – check NEXT_PUBLIC_ANTHROPIC_KEY in .env"
            : `Sorry, I couldn't fetch a response. (${msg})`,
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }



  const fallbackCity = computeFallbackCity();

  return (
    <div className="section-stagger space-y-4">
      {/* ═══ 0 · EDITORIAL HEADER ══════════════════════════════════════════ */}
      <div className="glass-card flex w-full flex-col items-center justify-center gap-4 p-5">
        <div className="relative w-full">
          <HandWrittenTitle
            title="AI Insights"
            subtitle="Explore logistics optimization, pricing analysis, and business intelligence with Claude"
          />
        </div>
      </div>

      {/* Work-in-progress banner */}
      <div
        className="flex items-center gap-3 rounded-xl border px-4 py-3"
        style={{ borderColor: `${accentColor}55`, background: `${accentColor}12` }}
        role="status"
      >
        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ background: accentColor }}
        >
          Work in progress
        </span>
        <p className="text-[13px] text-[var(--text-primary)]">
          This module is still under active development — features and outputs may change.
        </p>
      </div>

      {/* API key banner */}
      {noApiKey && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
          style={{ borderColor: `${accentColor}55`, background: `${accentColor}12` }}
          role="alert"
        >
          <p className="text-sm text-[var(--text-primary)]">
            Add your Anthropic API key to{" "}
            <code className="rounded bg-[var(--bg-nav)] px-1 font-mono text-[12px]">
              .env
            </code>{" "}
            to enable AI insights.
          </p>
          <a
            href="https://console.anthropic.com"
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
          badge={<Badge accent={accentColor}>AI-generated</Badge>}
        />

        {narrativeLoading ? (
          <Skeleton />
        ) : narrativeError ? (
          <div
            className="rounded-xl p-4"
            style={{ borderLeft: `3px solid ${accentColor}`, background: `${accentColor}0D` }}
          >
            <p className="text-sm leading-relaxed text-[var(--text-primary)]">
              {narrativeFallback()}
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl p-4"
            style={{ borderLeft: `3px solid ${accentColor}`, background: `${accentColor}0D` }}
          >
            <p className="text-sm leading-relaxed text-[var(--text-primary)]">
              {narrativeText}
            </p>
          </div>
        )}

        <p className="mt-2.5 text-[11px] text-[var(--text-muted)]">
          claude-sonnet-4-20250514 · max 350 tokens · based on live dashboard
          data
        </p>
      </div>

      {/* ── SECTIONS 2 + 3 – CITY RECOMMENDATION | SMART ALERTS ──────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* City recommendation */}
        <div className="glass-card p-5">
          <SectionHead
            eyebrow="Next move"
            title="Recommended target city"
            accent={accentColor}
            badge={
              !cityError && !cityLoading && cityText ? (
                <Badge accent={accentColor}>AI-generated</Badge>
              ) : (
                <Badge muted>rule-based</Badge>
              )
            }
          />

          {cityLoading ? (
            <Skeleton />
          ) : cityError ? (
            <div className="rounded-xl p-4" style={{ borderLeft: "3px solid #B45309", background: "rgba(180,83,9,0.07)" }}>
              <p className="text-sm font-semibold text-[#B45309]">
                Recommended:{" "}
                <span className="text-[var(--text-primary)]">{fallbackCity.city}</span>
              </p>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                {fallbackCity.count} high-value leads with low contact rate.
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl p-4"
              style={{ borderLeft: "3px solid #B45309", background: "rgba(180,83,9,0.07)" }}
            >
              <p className="text-sm leading-relaxed text-[var(--text-primary)]">{cityText}</p>
            </div>
          )}

          <p className="mt-2.5 text-[11px] text-[var(--text-muted)]">
            claude-sonnet-4-20250514 · max 200 tokens · outreach priority
          </p>
        </div>

        {/* Smart alerts */}
        <div className="glass-card p-5">
          <SectionHead
            eyebrow="Monitoring"
            title={`Smart alerts (${activeAlerts.length})`}
            accent={accentColor}
            badge={<Badge muted>rule-based</Badge>}
          />

          {activeAlerts.length === 0 ? (
            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-[var(--border-default)]">
              <p className="text-sm text-[var(--text-muted)]">
                No active alerts – all checks passed.
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
      <div className="glass-card p-5">
        <div className="mb-1 flex items-center gap-2.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#8B5CF6] animate-pulse" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8B5CF6]">
              AI Neural Engine
            </div>
            <h2 className="mt-0.5 text-[15px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
              Ask your pipeline data
            </h2>
          </div>
        </div>
        <p className="mb-3 ml-5 text-[12px] text-[var(--text-secondary)]">
          Ask anything about your suppliers, buyers, or market prices
        </p>

        {/* Suggestion chips */}
        {chatMessages.length === 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendChat(s)}
                className="pressable rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all"
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
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Chat history */}
        <div className="mb-3 max-h-80 min-h-15 space-y-3 overflow-y-auto rounded-2xl bg-[#16171A]/95 border border-[#333333]/45 p-4 shadow-inner">
          {chatMessages.length === 0 ? (
            <p className="text-[13px] text-[#888780] italic text-center py-4">
              No messages yet. Ask a question below or choose a suggestion.
            </p>
          ) : (
            chatMessages.map((m, i) => (
              <div
                key={i}
                className={`chat-msg flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-[13px] leading-relaxed border shadow-md ${
                    m.role === "user"
                      ? "border-[#444444]/80 text-white bg-gradient-to-tr from-[#1E2025] to-[#2B2D35] rounded-2xl rounded-tr-none"
                      : "border-[#333333]/50 text-gray-100 bg-[#1F2023]/65 rounded-2xl rounded-tl-none"
                  }`}
                >
                  {m.content ||
                    (streaming && i === chatMessages.length - 1 ? (
                      <TypingDots />
                    ) : (
                      ""
                    ))}
                </div>
              </div>
            ))
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

        <p className="mt-2 text-[11px] text-[#888888]">
          claude-sonnet-4-20250514 · max 400 tokens · context: live pipeline
          data
        </p>
      </div>
    </div>
  );
}
