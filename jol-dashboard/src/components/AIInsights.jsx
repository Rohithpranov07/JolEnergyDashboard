"use client";

import { useEffect, useRef, useState } from "react";
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
    `${staleLeads} leads in Lead stage have not been contacted in 14+ days — ` +
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
      message: `Cobalt up ${change}% in 30 days — NMC recovery margin impact: +₹${impact}/kg`,
    });
  }

  if (collectionStats.field > collectionStats.verified) {
    alerts.push({
      id: "field",
      severity: "warn",
      message: `${collectionStats.field} collection points are unverified field placeholders — schedule ground surveys in Chennai and Bengaluru`,
    });
  }

  if (buyerStats.highLoiCount >= 5) {
    alerts.push({
      id: "loi",
      severity: "tip",
      message: `${buyerStats.highLoiCount} buyers have ≥50% LOI probability — prioritise formal proposal to Nicomet, Epsilon, and Opera Chemisol`,
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

function AlertCard({ alert, onDismiss }) {
  const styles = {
    warn: {
      border: "#B45309",
      bg: "#FEF3C7",
      icon: "⚠️",
      label: "Warning",
    },
    info: {
      border: "#185FA5",
      bg: "#D6E8F7",
      icon: "ℹ️",
      label: "Info",
    },
    tip: {
      border: "#0A7864",
      bg: "#E0F4EF",
      icon: "💡",
      label: "Tip",
    },
  };
  const s = styles[alert.severity] || styles.info;
  return (
    <div
      className="flex items-start gap-3 rounded-md border-l-4 p-3"
      style={{ borderColor: s.border, background: s.bg }}
    >
      <span className="shrink-0 text-base">{s.icon}</span>
      <p className="flex-1 text-[13px] leading-snug text-[#0D2137]">
        {alert.message}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(alert.id)}
        className="shrink-0 text-[11px] text-[#888780] underline-offset-2 hover:underline"
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

export default function AIInsights() {
  // Section 1 — Narrative
  const [narrativeText, setNarrativeText] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(true);
  const [narrativeError, setNarrativeError] = useState(false);

  // Section 2 — City recommendation
  const [cityText, setCityText] = useState("");
  const [cityLoading, setCityLoading] = useState(true);
  const [cityError, setCityError] = useState(false);

  // Section 3 — Alerts
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // Section 4 — Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
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
      "You are a business analyst assistant for Jol Energy, a Li-ion battery recycling startup. Analyse the pipeline data and give a 2-3 sentence business narrative. Be specific with numbers. Be direct and actionable. No preamble, no headers — just the narrative paragraph.";

    const citySystem =
      "You are a business development advisor for Jol Energy. Recommend the single best city to prioritise for supplier outreach next week. Give ONE city and ONE specific reason based on the data. Format: CITY: [name] — [one sentence reason]. No other text.";

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
    const question = (text ?? chatInput).trim();
    if (!question || streaming) return;
    setChatInput("");

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
            ? "API unavailable — check NEXT_PUBLIC_ANTHROPIC_KEY in .env"
            : `Sorry, I couldn't fetch a response. (${msg})`,
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  function handleChatKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  }

  const fallbackCity = computeFallbackCity();

  return (
    <div className="space-y-4">
      {/* ── SECTION 1 — PIPELINE HEALTH NARRATIVE ─────────────────────── */}
      <div className="rounded-lg border border-[#E0E0E0] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#A32D2D]" />
          <h2 className="text-sm font-bold text-[#0D2137]">
            Pipeline health analysis
          </h2>
          <span className="rounded-full bg-[#FCEBEB] px-2 py-0.5 text-[10px] font-semibold text-[#A32D2D]">
            AI-generated
          </span>
        </div>

        {narrativeLoading ? (
          <Skeleton />
        ) : narrativeError ? (
          <p className="text-sm leading-relaxed text-[#333333]">
            {narrativeFallback()}
          </p>
        ) : (
          <div className="rounded-md border-l-4 border-[#185FA5] bg-[#F0F6FC] p-4">
            <p className="text-sm leading-relaxed text-[#0D2137]">
              {narrativeText}
            </p>
          </div>
        )}

        <p className="mt-2.5 text-[11px] text-[#888888]">
          claude-sonnet-4-20250514 · max 350 tokens · based on live dashboard
          data
        </p>
      </div>

      {/* ── SECTION 2 — CITY RECOMMENDATION ──────────────────────────────── */}
      <div className="rounded-lg border border-[#E0E0E0] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#A32D2D]" />
          <h2 className="text-sm font-bold text-[#0D2137]">
            Recommended next target city
          </h2>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              !cityError && !cityLoading && cityText
                ? "bg-[#FCEBEB] text-[#A32D2D]"
                : "bg-[#F1F1F1] text-[#666666]"
            }`}
          >
            {!cityError && !cityLoading && cityText ? "AI-generated" : "rule-based"}
          </span>
        </div>

        {cityLoading ? (
          <Skeleton />
        ) : cityError ? (
          <div className="rounded-md border-l-4 border-[#B45309] bg-[#FEF3C7] p-4">
            <p className="text-sm font-semibold text-[#B45309]">
              Recommended:{" "}
              <span className="text-[#0D2137]">{fallbackCity.city}</span>
            </p>
            <p className="mt-1 text-[13px] text-[#555555]">
              {fallbackCity.count} high-value leads with low contact rate.
            </p>
          </div>
        ) : (
          <div className="rounded-md border-l-4 border-[#B45309] bg-[#FEF3C7] p-4">
            <p className="text-sm leading-relaxed text-[#0D2137]">{cityText}</p>
          </div>
        )}

        <p className="mt-2.5 text-[11px] text-[#888888]">
          claude-sonnet-4-20250514 · max 200 tokens · outreach priority for next
          week
        </p>
      </div>

      {/* ── SECTION 3 — SMART ALERTS ──────────────────────────────────────── */}
      <div className="rounded-lg border border-[#E0E0E0] bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#A32D2D]" />
          <h2 className="text-sm font-bold text-[#0D2137]">
            Smart alerts ({activeAlerts.length} active)
          </h2>
          <span className="rounded-full bg-[#F1F1F1] px-2 py-0.5 text-[10px] font-semibold text-[#666666]">
            rule-based
          </span>
        </div>

        {activeAlerts.length === 0 ? (
          <p className="text-sm text-[#888780]">
            No active alerts — all checks passed.
          </p>
        ) : (
          <div className="space-y-2">
            {activeAlerts.map((a) => (
              <AlertCard key={a.id} alert={a} onDismiss={dismissAlert} />
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 4 — ASK YOUR DATA ────────────────────────────────────── */}
      <div className="rounded-lg border border-[#E0E0E0] bg-white p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#A32D2D]" />
          <h2 className="text-sm font-bold text-[#0D2137]">
            Ask your pipeline data
          </h2>
          <span className="rounded-full bg-[#FCEBEB] px-2 py-0.5 text-[10px] font-semibold text-[#A32D2D]">
            streaming
          </span>
        </div>
        <p className="mb-3 text-[12px] text-[#888780]">
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
                className="rounded-full border border-[#E0E0E0] px-3 py-1 text-[12px] text-[#555555] transition-colors hover:border-[#A32D2D] hover:text-[#A32D2D]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Chat history */}
        <div className="mb-3 max-h-80 min-h-15 space-y-2 overflow-y-auto rounded-lg bg-[#F8F9FA] p-3">
          {chatMessages.length === 0 ? (
            <p className="text-[13px] text-[#888780]">
              No messages yet. Try a question above or type below.
            </p>
          ) : (
            chatMessages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] px-3 py-2 text-[13px] leading-relaxed"
                  style={{
                    background:
                      m.role === "user" ? "#185FA5" : "#F0F6FC",
                    color: m.role === "user" ? "#FFFFFF" : "#0D2137",
                    borderRadius: 8,
                  }}
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
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleChatKey}
            placeholder="Ask about your pipeline data…"
            disabled={streaming}
            className="flex-1 rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm outline-none transition-colors focus:border-[#A32D2D] disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => sendChat()}
            disabled={!chatInput.trim() || streaming}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: "#A32D2D" }}
          >
            {streaming ? "…" : "Send"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-[#888888]">
          claude-sonnet-4-20250514 · max 400 tokens · context: live pipeline
          data
        </p>
      </div>
    </div>
  );
}
