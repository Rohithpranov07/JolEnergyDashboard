"use client";

import { useEffect, useRef, useState } from "react";
import { supplierLeads, supplierStats } from "../data/supplierLeads.js";
import { buyerStats } from "../data/buyerLeads.js";
import { collectionStats } from "../data/collectionPoints.js";
import { marketStats } from "../data/marketPrices.js";

// ─── Context helpers ──────────────────────────────────────────────────────────

function buildDashboardContext() {
  const stale = supplierLeads.filter(
    (l) => l.lastContactDaysAgo >= 14 && l.stage === "Lead",
  );
  const topCities = supplierStats.cityVolumeChart
    .slice(0, 5)
    .map((c) => `${c.city}(${c.kg.toLocaleString()}kg)`)
    .join(", ");

  return `SUPPLIER PIPELINE: ${supplierStats.total} leads | ${supplierStats.highInterest} high-interest | ${supplierStats.tonPlusTier} ton+ tier | ${stale.length} stale (Lead, ≥14d no contact) | funnel: Lead(${supplierStats.byStage["Lead"] || 0})→Contacted(${supplierStats.byStage["Contacted"] || 0})→Qualified(${supplierStats.byStage["Qualified"] || 0})→Interested(${supplierStats.byStage["Interested"] || 0})→LOI(${supplierStats.byStage["LOI Received"] || 0}) | top cities by kg: ${topCities}

BUYER PIPELINE: ${buyerStats.total} buyers | ${buyerStats.totalConsumptionMT.toLocaleString()} MT/mo demand | ${buyerStats.highLoiCount} buyers LOI≥50% | products: ${Object.keys(buyerStats.byProduct).join(", ")} | categories: SALT_MFR(${buyerStats.byCategory["SALT_MFR"] || 0}), CELL_MAKER(${buyerStats.byCategory["CELL_MAKER"] || 0}), CAM_MAKER(${buyerStats.byCategory["CAM_MAKER"] || 0}), METAL_RECOV(${buyerStats.byCategory["METAL_RECOV"] || 0})

COLLECTION NETWORK: ${collectionStats.total} points | ${collectionStats.verified} registry-verified | ${collectionStats.field} field-survey (unverified) | ${collectionStats.totalKg.toLocaleString()} kg/mo capacity | hubs: Chennai(lowest cost ₹8.2/kg), Bengaluru, Hyderabad

MARKET: Cobalt $${marketStats.cobalt.current.toLocaleString()}/MT (${marketStats.cobalt.change30d > 0 ? "+" : ""}${marketStats.cobalt.change30d}% 30d) | Nickel $${marketStats.nickel.current.toLocaleString()}/MT (${marketStats.nickel.change30d > 0 ? "+" : ""}${marketStats.nickel.change30d}% 30d) | Li-Carb $${marketStats.liCarb.current.toLocaleString()}/MT (${marketStats.liCarb.change30d > 0 ? "+" : ""}${marketStats.liCarb.change30d}% 30d) | NMC622 net yield ₹${marketStats.avgNMCValueINR.toLocaleString()}/kg

HEALTH SCORE: 66/100 (amber)`;
}

const NARRATIVE_SYSTEM = `You are a business intelligence assistant for Jol Energy Pvt. Ltd., a Li-ion battery recycling startup in South India. Write a 3–4 sentence executive pipeline health narrative in plain English. Be specific with numbers. Identify the #1 risk and the #1 opportunity. No bullet points, no headers — flowing prose only.`;

const CITY_SYSTEM = `You are a business analyst for Jol Energy Pvt. Ltd., a Li-ion battery recycling startup. Based on the supplier pipeline data provided, recommend the top 3 cities to prioritize for scrap-supplier outreach in the next 30 days. Format exactly as:
1. [City] — [one sentence reason] — ~[number] kg/mo potential
2. ...
3. ...
No other text.`;

const CHAT_SYSTEM_PREFIX = `You are a business intelligence assistant for Jol Energy Pvt. Ltd., a Li-ion battery recycling startup. Answer questions concisely using the dashboard data below. Use specific numbers. Keep answers to 2–4 sentences and focus on actionable insights.

DASHBOARD DATA:
`;

// ─── Rule-based fallbacks ─────────────────────────────────────────────────────

function fallbackNarrative() {
  const stale = supplierLeads.filter(
    (l) => l.lastContactDaysAgo >= 14 && l.stage === "Lead",
  ).length;
  const topCity = supplierStats.cityVolumeChart[0];
  return `Jol Energy's pipeline sits at 66/100 health (amber) with ${supplierStats.total} active supplier leads, ${supplierStats.highInterest} high-interest prospects, and ${supplierStats.tonPlusTier} ton+ tier accounts ready to convert. The buyer side shows strong demand: ${buyerStats.total} off-takers consuming ${buyerStats.totalConsumptionMT.toLocaleString()} MT/mo with ${buyerStats.highLoiCount} buyers at LOI ≥ 50%. The primary risk is ${stale} stale leads sitting in the Lead stage with no contact in 14+ days — immediate follow-up is needed before they go cold. The top opportunity is ${topCity.city} with the highest volume potential (${topCity.kg.toLocaleString()} kg/mo) and strong institutional buyer alignment at ₹${marketStats.avgNMCValueINR.toLocaleString()}/kg NMC622 net margin.`;
}

function fallbackCityRecs() {
  return supplierStats.cityVolumeChart.slice(0, 3).map((c, i) => {
    const leads = Object.entries(supplierStats.byCity).find(
      ([city]) => city === c.city,
    )?.[1] || 0;
    const reasons = [
      "Highest scrap volume potential with the most active supplier leads",
      "Strong mid-tier funnel with multiple ton+ accounts worth qualifying",
      "Growing industrial base with significant uncontacted prospects",
    ];
    return { city: c.city, reason: reasons[i], kg: c.kg, leads };
  });
}

// ─── Smart alerts ─────────────────────────────────────────────────────────────

function buildAlerts() {
  const stale = supplierLeads.filter(
    (l) => l.lastContactDaysAgo >= 14 && l.stage === "Lead",
  );
  const alerts = [];

  if (stale.length > 0) {
    alerts.push({
      level: "error",
      badge: "URGENT",
      badgeColor: "#791F1F",
      badgeBg: "#FCEBEB",
      borderColor: "#E24B4A",
      title: `${stale.length} stale supplier leads`,
      body: `${stale.length} leads in 'Lead' stage with no contact for ≥14 days. At-risk: ${stale
        .slice(0, 3)
        .map((l) => l.company)
        .join(", ")}.`,
      action: "Suppliers tab → filter Stage = Lead",
    });
  }

  if (collectionStats.field > collectionStats.verified) {
    alerts.push({
      level: "warning",
      badge: "ATTENTION",
      badgeColor: "#B45309",
      badgeBg: "#FEF3C7",
      borderColor: "#EF9F27",
      title: `${collectionStats.field} field survey points unverified`,
      body: `${collectionStats.field} collection points from field surveys need physical verification. ${collectionStats.verified} registry/PRO points confirmed.`,
      action: "Collection tab → dashed pins on map",
    });
  }

  if (buyerStats.highLoiCount >= 5) {
    alerts.push({
      level: "success",
      badge: "OPPORTUNITY",
      badgeColor: "#085041",
      badgeBg: "#E1F5EE",
      borderColor: "#1D9E75",
      title: `${buyerStats.highLoiCount} buyers at LOI ≥ 50%`,
      body: `${buyerStats.highLoiCount} high-probability buyers represent ${buyerStats.totalConsumptionMT.toLocaleString()} MT/mo combined demand. Push for final agreements now.`,
      action: "Buyers tab → LOI filter ≥ 51%",
    });
  }

  if (marketStats.cobalt.change30d < -2) {
    alerts.push({
      level: "warning",
      badge: "MARKET",
      badgeColor: "#B45309",
      badgeBg: "#FEF3C7",
      borderColor: "#EF9F27",
      title: `Cobalt down ${Math.abs(marketStats.cobalt.change30d)}% in 30 days`,
      body: `Cobalt at $${marketStats.cobalt.current.toLocaleString()}/MT. Lock in buyer contracts before further price erosion affects NMC recovery margins.`,
      action: "Market tab → price chart",
    });
  } else if (marketStats.cobalt.change30d > 3) {
    alerts.push({
      level: "success",
      badge: "MARKET",
      badgeColor: "#085041",
      badgeBg: "#E1F5EE",
      borderColor: "#1D9E75",
      title: `Cobalt up ${marketStats.cobalt.change30d}% in 30 days`,
      body: `Cobalt at $${marketStats.cobalt.current.toLocaleString()}/MT — rising prices improve NMC622 recovery margins (₹${marketStats.avgNMCValueINR.toLocaleString()}/kg net).`,
      action: "Market tab → margin calculator",
    });
  }

  return alerts;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchNarrative(context) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "narrative",
      system: NARRATIVE_SYSTEM,
      messages: [{ role: "user", content: `Dashboard data:\n${context}` }],
      maxTokens: 350,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

async function fetchCityRecs(context) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "narrative",
      system: CITY_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Supplier city data (city, leads, monthly_kg):\n${supplierStats.cityVolumeChart
            .slice(0, 8)
            .map(
              (c) =>
                `${c.city}: ${supplierStats.byCity[c.city] || 0} leads, ${c.kg.toLocaleString()} kg/mo`,
            )
            .join(
              "\n",
            )}\n\nFull pipeline context:\n${context}`,
        },
      ],
      maxTokens: 300,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

async function* streamChat(messages, context) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "chat",
      system: CHAT_SYSTEM_PREFIX + context,
      messages,
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
      if (raw === "[DONE]") return;
      try {
        const evt = JSON.parse(raw);
        if (
          evt.type === "content_block_delta" &&
          evt.delta?.type === "text_delta"
        ) {
          yield evt.delta.text;
        }
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
}

// Parse AI city rec text → [{city, reason, kg}]
function parseCityRecs(text) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
  return lines.slice(0, 3).map((line) => {
    const parts = line.split("—").map((s) => s.trim());
    const city = parts[0] || "—";
    const reason = parts[1] || "";
    const kgMatch = (parts[2] || "").match(/[\d,]+/);
    const kg = kgMatch ? parseInt(kgMatch[0].replace(/,/g, ""), 10) : null;
    return { city, reason, kg };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SpinnerDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-[#A32D2D] opacity-70"
          style={{
            animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}`}</style>
    </span>
  );
}

function NarrativeCard({ text, loading, error, onRegenerate }) {
  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#A32D2D]" />
          <h2 className="text-sm font-bold text-[#0D2137]">
            Pipeline Health Narrative
          </h2>
          <span className="rounded-full bg-[#FCEBEB] px-2 py-0.5 text-[10px] font-semibold text-[#A32D2D]">
            AI-generated
          </span>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={loading}
          className="flex items-center gap-1 rounded-md border border-[#E0E0E0] px-3 py-1.5 text-[12px] font-medium text-[#666666] transition-colors hover:border-[#A32D2D] hover:text-[#A32D2D] disabled:opacity-50"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Regenerate
        </button>
      </div>
      <div className="min-h-[56px] text-sm leading-relaxed text-[#333333]">
        {loading ? (
          <span className="text-[#888780]">
            Analysing pipeline… <SpinnerDots />
          </span>
        ) : error ? (
          <span className="text-[#888780] italic">{text}</span>
        ) : (
          text
        )}
      </div>
      <p className="mt-2 text-[11px] text-[#888888]">
        Model: claude-sonnet-4-20250514 · Based on live dashboard data
      </p>
    </div>
  );
}

function CityRecCard({ recs, loading, error, aiText }) {
  const isAI = !error && !loading && aiText;
  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#A32D2D]" />
        <h2 className="text-sm font-bold text-[#0D2137]">
          City Recommendations
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isAI
              ? "bg-[#FCEBEB] text-[#A32D2D]"
              : "bg-[#F1F1F1] text-[#666666]"
          }`}
        >
          {isAI ? "AI-generated" : "rule-based"}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[#888780]">
          Generating recommendations… <SpinnerDots />
        </div>
      ) : (
        <ol className="space-y-3">
          {recs.map((rec, i) => (
            <li key={i} className="flex gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: ["#A32D2D", "#C84040", "#D96060"][i] }}
              >
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-semibold text-[#0D2137]">
                  {rec.city}
                  {rec.kg && (
                    <span className="ml-2 text-[12px] font-normal text-[#888780]">
                      ~{rec.kg.toLocaleString()} kg/mo
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-[#555555]">{rec.reason}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-3 text-[11px] text-[#888888]">
        Next 30-day outreach priority · Based on volume + funnel data
      </p>
    </div>
  );
}

function AlertsCard({ alerts }) {
  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#A32D2D]" />
        <h2 className="text-sm font-bold text-[#0D2137]">Smart Alerts</h2>
        <span className="rounded-full bg-[#F1F1F1] px-2 py-0.5 text-[10px] font-semibold text-[#666666]">
          rule-based
        </span>
      </div>
      <ul className="space-y-3">
        {alerts.map((a, i) => (
          <li
            key={i}
            className="rounded-md border-l-[3px] p-3"
            style={{
              borderColor: a.borderColor,
              background: a.badgeBg + "55",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: a.badgeBg, color: a.badgeColor }}
                  >
                    {a.badge}
                  </span>
                  <span className="text-[13px] font-semibold text-[#0D2137]">
                    {a.title}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[#444444]">{a.body}</p>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-[#888780]">→ {a.action}</p>
          </li>
        ))}
        {alerts.length === 0 && (
          <li className="text-sm text-[#888780]">
            No active alerts — pipeline looks healthy.
          </li>
        )}
      </ul>
    </div>
  );
}

function ChatCard({ context }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const SUGGESTIONS = [
    "Which cities should we prioritise this week?",
    "How does our buyer demand compare to supply?",
    "What is the best chemistry to process for maximum margin?",
  ];

  async function send(text) {
    const question = (text || input).trim();
    if (!question || streaming) return;
    setInput("");
    setError("");

    const userMsg = { role: "user", content: question };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      let accumulated = "";
      for await (const chunk of streamChat(
        nextMessages,
        context,
      )) {
        accumulated += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: accumulated,
          };
          return updated;
        });
      }
    } catch (err) {
      const errMsg = err.message || "Unknown error";
      if (errMsg.includes("NO_KEY") || errMsg.includes("401")) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content:
              "AI chat requires an Anthropic API key. Set NEXT_PUBLIC_ANTHROPIC_KEY in your .env file.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: `Sorry, I couldn't fetch a response right now. (${errMsg})`,
          },
        ]);
      }
      setError(errMsg);
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#A32D2D]" />
        <h2 className="text-sm font-bold text-[#0D2137]">Ask Your Data</h2>
        <span className="rounded-full bg-[#FCEBEB] px-2 py-0.5 text-[10px] font-semibold text-[#A32D2D]">
          streaming
        </span>
      </div>

      {/* Suggestion chips */}
      {messages.length === 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-[#E0E0E0] px-3 py-1 text-[12px] text-[#555555] transition-colors hover:border-[#A32D2D] hover:text-[#A32D2D]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chat history */}
      <div
        ref={scrollRef}
        className="mb-3 max-h-72 min-h-[80px] space-y-3 overflow-y-auto rounded-lg bg-[#F8F9FA] p-3"
      >
        {messages.length === 0 ? (
          <p className="text-[13px] text-[#888780]">
            Ask anything about your suppliers, buyers, collection network, or
            market conditions.
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#A32D2D] text-white"
                    : "border border-[#E0E0E0] bg-white text-[#333333]"
                }`}
              >
                {m.content || (streaming && i === messages.length - 1 ? <SpinnerDots /> : "")}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about your pipeline data…"
          disabled={streaming}
          className="flex-1 rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm outline-none transition-colors focus:border-[#A32D2D] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => send()}
          disabled={!input.trim() || streaming}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: streaming ? "#C84040" : "#A32D2D" }}
        >
          {streaming ? "…" : "Send"}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-[#888888]">
        claude-sonnet-4-20250514 · max 400 tokens · context: live dashboard data
      </p>
    </div>
  );
}

// Computed once at module load from stable imported data (no props/state dependency).
const MODULE_CONTEXT = buildDashboardContext();
const MODULE_ALERTS = buildAlerts();

// ─── Main module ──────────────────────────────────────────────────────────────

export default function AIInsights() {
  const [narrativeText, setNarrativeText] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(true);
  const [narrativeError, setNarrativeError] = useState(false);

  const [cityRecs, setCityRecs] = useState([]);
  const [cityLoading, setCityLoading] = useState(true);
  const [cityAiText, setCityAiText] = useState("");
  const [cityError, setCityError] = useState(false);

  const alerts = MODULE_ALERTS;

  const loadNarrative = async () => {
    setNarrativeLoading(true);
    setNarrativeError(false);
    try {
      const text = await fetchNarrative(MODULE_CONTEXT);
      setNarrativeText(text);
    } catch (err) {
      setNarrativeError(true);
      const msg = err.message || "";
      if (msg.includes("NO_KEY") || msg.includes("401")) {
        setNarrativeText("(Rule-based) " + fallbackNarrative());
      } else {
        setNarrativeText(fallbackNarrative());
      }
    } finally {
      setNarrativeLoading(false);
    }
  };

  const loadCityRecs = async () => {
    setCityLoading(true);
    setCityError(false);
    try {
      const text = await fetchCityRecs(MODULE_CONTEXT);
      setCityAiText(text);
      const parsed = parseCityRecs(text);
      setCityRecs(parsed.length >= 1 ? parsed : fallbackCityRecs());
    } catch {
      setCityError(true);
      setCityRecs(fallbackCityRecs());
    } finally {
      setCityLoading(false);
    }
  };

  // Load once on first mount
  const hasFetched = useRef(false);
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadNarrative();
    loadCityRecs();
  }, []);

  return (
    <div className="space-y-4">
      {/* Row 1 — Health Narrative */}
      <NarrativeCard
        text={narrativeText}
        loading={narrativeLoading}
        error={narrativeError}
        onRegenerate={loadNarrative}
      />

      {/* Row 2 — City Recs + Smart Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CityRecCard
            recs={cityRecs}
            loading={cityLoading}
            error={cityError}
            aiText={cityAiText}
          />
        </div>
        <div className="lg:col-span-2">
          <AlertsCard alerts={alerts} />
        </div>
      </div>

      {/* Row 3 — Ask Your Data */}
      <ChatCard context={MODULE_CONTEXT} />
    </div>
  );
}
