@AGENTS.md

# Jol Energy — Business Intelligence Dashboard

A single-page, SaaS-quality BI dashboard for Jol Energy Pvt. Ltd. (a Li-ion battery
**recycling startup**). It gives leadership a live view of: supplier (scrap inflow)
pipeline, buyer (recovered-metal-salt offtake) pipeline, the grassroots collection
network on a geo-map, battery-metal market intelligence, and an embedded Claude AI
insights layer. Built for an SDE & Data Analytics internship task round (Jun 2026).

**The whole point:** ship a *deployed, clickable React-style app on a public URL* — not a
static Power BI file. Every metric must cite its data provenance (ⓘ tooltips). Deploy to Vercel.

## Stack (CHANGED from the PRD)

The PRD/Task PDFs specify **Vite + React 18**. We are using **Next.js instead**. Resolved versions in this repo:

- **Next.js 16.2.7** (App Router, `src/` dir, JavaScript — not TypeScript) · **React 19.2.4** · **Tailwind v4**
- Charts: **recharts 3.x** · Map: **leaflet 1.9.4 + react-leaflet 5.x** · CSV: **papaparse 5.x** · AI: **@anthropic-ai/sdk 0.100** (+ raw streaming fetch)
- recharts 3 / react-leaflet 5 were chosen because the scaffold pulled React 19 (the PRD's recharts 2 / react-leaflet 4 require React 18).

### Next.js-specific deviations from the PRD (IMPORTANT)
1. **Env var is `NEXT_PUBLIC_ANTHROPIC_KEY`** (the PRD says `VITE_ANTHROPIC_KEY`). Accessed via `process.env.NEXT_PUBLIC_ANTHROPIC_KEY` (not `import.meta.env`). Placeholder lives in `.env` (gitignored). Optionally we may route the Claude call through a Next API route (`app/api/.../route.js`) to keep the key server-side — the cleaner Next pattern — but PRD-style browser-direct is acceptable.
2. **No `vercel.json` SPA rewrite** — Next handles routing/refresh natively.
3. **App shell** lives in a `'use client'` component rendered by `src/app/page.js` (the PRD's `App.jsx` with `useState(activeTab)`). Tab state in URL via `?tab=` (`window.history.pushState`).
4. Any component using state/hooks/events/browser APIs needs the **`'use client'`** directive (KPICard, FunnelChart, LeadTable, all modules, AIInsights, AlertsPanel).
5. **Leaflet (M3)** must be loaded client-only via `next/dynamic` with `{ ssr: false }`. In Next, `import iconUrl from '...png'` returns a static-image **object** — use `iconUrl.src` for the Leaflet icon fix. Leaflet CSS is imported once in `src/app/layout.js`.
6. Next 16 has breaking changes vs. older conventions — consult `node_modules/next/dist/docs/` (see @AGENTS.md) before relying on memory.

## Five modules (signature colors)

| ID | Component | Role | Color | Key features |
|----|-----------|------|-------|--------------|
| M1 | `SupplierPipeline.jsx` | Scrap inflow pipeline | `#185FA5` blue | Animated funnel, city volume bar (Recharts), 5-cell state heatmap, filterable 40-lead table, stale-lead alert |
| M2 | `BuyerPipeline.jsx` | Offtake/revenue pipeline | `#0A7864` teal | Side-by-side supply/demand funnels, product-mix donut, category bars, 20-buyer table w/ LOI badges |
| M3 | `CollectionNetwork.jsx` | Grassroots collection | `#B45309` amber | Leaflet map, 80km hub circles, color-coded pins, hub-economics sidebar, city/category charts |
| M4 | `MarketIntelligence.jsx` | External price signals | `#534AB7` purple | 30-day multi-line price chart, **interactive margin calculator**, scrap ref table, policy tracker |
| M5 | `AIInsights.jsx` | Claude API layer | `#A32D2D` red | Auto health narrative, city recommendation, rule-based smart alerts, streaming "ask your data" chat |

Reusable: `KPICard.jsx` (animated count-up + ⓘ provenance tooltip), `FunnelChart.jsx` (custom SVG funnel), `HealthScore.jsx` (SVG ring gauge), `LeadTable.jsx` (sort/filter/expand/CSV), `AlertsPanel.jsx` (slide-in drawer), `MarginCalculator.jsx`, `GeoMap.jsx`.
Utils: `useCountUp.js` (done), `healthScore.js`, `formatters.js`, `exportCsv.js`.

## Data layer — `src/data/*.js` (pre-generated, deterministic/seeded, DO NOT regenerate)

All four files import & evaluate cleanly; numbers match the PRD's headline KPIs exactly.

- **`supplierLeads.js`** → `supplierLeads` (40), `supplierStats` = `{ total:40, totalKg, highInterest, tonPlusTier:12, staleLeads:15 (number, NOT array), verifiedPhone, byStage, byState, byCity, byTier, funnelStages[{stage,color,count}], cityVolumeChart[{city,kg}], citiesCount:11 }`. Lead fields incl. `stage, interest, lastContactDate, lastContactDaysAgo, monthlyKgEstimate, attemptCount, volTier, batteryType[], phone, email, source, sourceUrl, verified`. Funnel stages: Lead→Contacted→Qualified→Interested→LOI Received.
- **`buyerLeads.js`** → `buyerLeads` (20), `buyerStats` = `{ total:20, byStage, byProduct, byCategory, funnelStages, productDonut[{product,count}], totalConsumptionMT:1083, highLoiCount:7 }`. Buyer fields incl. `category (SALT_MFR|CELL_MAKER|CAM_MAKER|METAL_RECOV), products[], consumptionMT, currentSupplier, stage, loiProbability, sampleRequested`. Funnel: Lead→Contacted→Sample Requested→Discussion→LOI Received.
- **`collectionPoints.js`** → `collectionPoints` (32), `collectionStats` = `{ total:32, verified:17, field:15, byCity, byType, totalKg, cityVolume[{city,kg}] }`, `collectionHubs` (3: Chennai/Bengaluru/Hyderabad, each `{lat,lng,radiusKm,color,...}`), `hubEconomics`. Point fields incl. `lat, lng, type (REGISTRY|PRO|INDIAMART|FIELD), category, monthlyKgEstimate, willingness, verified, distanceToHubKm`.
- **`marketPrices.js`** → `USD_INR (95.0)`, `priceHistory` (30 days, each `{date,dateShort,cobalt_usd,nickel_usd,liCarb_usd,...}`), `currentPrices`, `sparklines`, `scrapPriceRef`, `policyTracker`, `chemistryProfiles` (NMC622/NMC811/LFP), `calcRecoveryValueINR(chemistry,inputKg,processingCostPerKg=25)` → `{grossINR,processingCostINR,netINR,netPerKgINR}`, `marketStats` = `{ latestDate, cobalt:{current,change30d}, nickel:{...}, liCarb:{...}, ... }`. **Sanity: `calcRecoveryValueINR(chemistryProfiles[0],1000).netPerKgINR === 1116`** (PRD's ₹1,116/kg NMC622 figure).

⚠ Known prompt/data mismatches to handle in code: `supplierStats.staleLeads`/`tonPlusTier` are **numbers** (counts), but some task prompts write `.staleLeads.length` — recompute the filtered array where a list is needed (`supplierLeads.filter(l => l.lastContactDaysAgo >= 14 && l.stage === 'Lead')`).

## Health score (top-bar ring gauge)

`score = contactRate*30 + qualRate*25 + velocityScore*20 + coverageScore*25` (0–100, rounded).
`contactRate = advanced/total`; `qualRate = (qualified+interested+loi)/max(advanced,1)`; `coverageScore = min(totalKg/10000,1)`; `velocityScore = 0.6` (fixed baseline). Arc color: 0–40 red `#E24B4A`, 41–70 amber `#EF9F27`, 71–100 teal `#1D9E75`. Lives in `src/utils/healthScore.js` + `HealthScore.jsx`.

## Build sequence (from the Task PDF — run in order; cumulative)

`TASK-00` scaffold ✅ → `TASK-09` utils → `TASK-01` app shell + health ring → `TASK-02` reusable components (KPICard/FunnelChart/LeadTable) → `TASK-03..07` modules M1–M5 → `TASK-08` alerts panel + global polish (progress bar, count-up on tab switch, CSV verify) → `TASK-10` Vercel deploy + README.

**Progress:** TASK-00 ✅ (scaffold, deps, data, light theme), TASK-01 ✅ (app shell `Dashboard.jsx` + `HealthScore.jsx`, tabs, `?tab=` URL state, alert-bell badge), TASK-02 ✅ (`useCountUp.js`, `KPICard.jsx`, `FunnelChart.jsx` custom-SVG funnel, `LeadTable.jsx` search/sort/badges/expand/pagination/CSV). TASK-03 ✅ (`SupplierPipeline.jsx` — M1). TASK-04 ✅ (`BuyerPipeline.jsx` — M2). TASK-05 ✅ (M3 — `CollectionNetwork.jsx` + `CollectionMap.jsx`). TASK-06 ✅ (M4 — `MarketIntelligence.jsx`). TASK-07 ✅ (M5 — `AIInsights.jsx` + `src/app/api/ai/route.js`: auto health narrative (Claude API → rule-based fallback), city recommendation engine (AI-parsed → fallback), smart alerts (3 fire from real data: 15 stale leads / 7 high-LOI buyers / cobalt +13.6%), streaming "ask your data" chat (SSE → `content_block_delta` → `delta.text`); `NEXT_PUBLIC_ANTHROPIC_KEY` used server-side in API route; module-level constants avoid ref-during-render lint error; wired into AI Insights tab). All lint clean + build passes. Next: TASK-08 (alerts panel + global polish) or TASK-09 (utils).

M4 notes: `currentPrices.metals` has 4 metals but `sparklines` only 3 (no `liMetal`) → sparkline guarded. ROW-2 line colors use spec values (nickel `#0A7864`, liCarb `#B45309`), distinct from card `metal.color`. Default calc state (1000kg/NMC622/₹25) = ₹1,116/kg net (PRD headline).

M3 Next.js pattern: Leaflet must live in a separate component loaded via `dynamic(() => import("./CollectionMap.jsx"), { ssr: false })` from a `'use client'` parent — importing `leaflet`/`react-leaflet` at SSR throws `window is not defined`. PNG marker imports resolve to static-image objects → use `.src`. We use `L.divIcon` for all pins so the classic grey-box default-marker bug can't occur. The interactive map (tiles/pins/popups) renders client-only — not visible in SSR/curl, needs a live browser to eyeball.

Data note (M2): `buyerStats.byProduct` has **8** products incl. **`CuSO4`** (4 buyers) which is NOT in the spec's 7-colour list — added `CuSO4=#1F9AA6` and included it in the "Metal salt products" source tooltip so the count (8) stays honest. Buyer/supplier `funnelStages` already carry the spec's teal/blue ramps. Buyer data has no "Sample Requested" leads (count 0) — funnel guards against /0 conversion %.

Data note: actual `supplierStats.byState` has **Tamil Nadu = 17** (not 15 as the task text says); heatmap/KPIs are driven from real data, totals = 40. Recharts works inside `'use client'` modules (SSR renders chart container empty, hydrates on client) — no dynamic import needed so far.

Note: Next 16 + React 19 enforce `react-hooks/set-state-in-effect` — never call `setState` synchronously in an effect body. Use rAF callbacks (async) for animation, and the "adjust state during render" pattern (compare a signature against a `useState` prev value) instead of reset-in-effect. Run `npx eslint <files>` before declaring a task done.

## Conventions / polish requirements

- Card style: white bg, 1px `#E0E0E0` border, 8–12px radius, 16px padding. Page bg `#F8F9FA`.
- Animated count-up KPIs (1.2s, requestAnimationFrame), top page-load progress bar, funnel bar grow on mount (400ms), map pins drop staggered, alert panel slide-in (translateX 250ms).
- Provenance ⓘ tooltip (source name + URL + date) on every KPI/metric — pure CSS hover.
- Export-CSV per table (PapaParse blob download). Shareable filter state in URL params.
- Recharts for Line/Bar/Pie/donut; **custom SVG** for the funnel; Leaflet for the map.
- Claude (M5): model `claude-sonnet-4-20250514` per PRD, max_tokens ~350, 1 call/module-view, streaming for chat (SSE → `content_block_delta` → `delta.text`), graceful rule-based fallback when key missing/call fails, `anthropic-version: 2023-06-01`.

## Submission deliverables (final)

Public Vercel URL (highest-impact artefact) · Excel lead DB · evidence folder (email/WhatsApp/map screenshots) · 2–3 page insights report (3 numbered, data-backed recommendations) · 10–15 slide deck · README documenting real vs dummy fields.
