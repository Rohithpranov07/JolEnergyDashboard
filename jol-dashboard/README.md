# Jol Energy — Business Intelligence Dashboard

A SaaS-quality, single-page BI dashboard for **Jol Energy Pvt. Ltd.**, a Li-ion battery recycling startup in South India. Built as part of the SDE & Data Analytics internship task round (Jun 2026).

**Live URL:** *(add after Vercel deployment)*

---

## What it does

Leadership gets a real-time view of five operational domains in one URL:

| Module | Tab | What you see |
|---|---|---|
| M1 Supplier Pipeline | Suppliers | 40 scrap-supplier leads — animated funnel, city volume bar, state heatmap, filterable table, stale-lead alert |
| M2 Buyer Pipeline | Buyers | 20 off-taker leads — supply/demand funnels, product-mix donut, LOI gradient badges |
| M3 Collection Network | Collection | Leaflet map with 32 geocoded collection points, 80 km hub circles, hub economics table |
| M4 Market Intelligence | Market | 30-day multi-metal price chart, interactive margin calculator, policy tracker |
| M5 AI Insights | AI Insights | Claude-generated health narrative, city recommendation, rule-based smart alerts, streaming "ask your data" chat |

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16.2.7 (App Router, JavaScript) | Server-side API route keeps Anthropic key off the client |
| UI | React 19.2.4 + Tailwind CSS v4 | Fast iteration; `@import "tailwindcss"` syntax |
| Charts | Recharts 3.x | React 19 compatible (recharts 2 requires React 18) |
| Map | Leaflet 1.9.4 + react-leaflet 5.x | Loaded client-only via `next/dynamic({ ssr: false })` |
| CSV | PapaParse 5.x | Blob + `createObjectURL` download |
| AI | Anthropic API (`claude-sonnet-4-20250514`) | Proxied through `/api/ai` Next.js route |
| Deploy | Vercel | Zero-config Next.js hosting |

---

## Local setup

```bash
cd jol-dashboard
npm install
```

Create `.env` in `jol-dashboard/`:

```env
NEXT_PUBLIC_ANTHROPIC_KEY=sk-ant-...   # your Anthropic API key
```

> The key is used **server-side only** via the `/api/ai` route — it is never sent to the browser.
> If the key is omitted the dashboard works fully; the AI Insights module falls back to rule-based text and shows a setup banner.

```bash
npm run dev      # http://localhost:3000
npm run build    # production build verification
```

---

## Deploying to Vercel

1. Push this repo to GitHub (already done — `github.com/Rohithpranov07/JolEnergyDashboard`).
2. Go to [vercel.com/new](https://vercel.com/new) → **Import** `JolEnergyDashboard`.
3. Set **Root Directory** → `jol-dashboard`.
4. Add environment variable in the Vercel dashboard:
   - **Key:** `NEXT_PUBLIC_ANTHROPIC_KEY`
   - **Value:** your key from [console.anthropic.com](https://console.anthropic.com)
5. Click **Deploy**. Vercel auto-detects Next.js — no `vercel.json` needed.

After deploy, paste the public URL above and test in an incognito window.

---

## Data provenance — real vs. generated fields

### Supplier leads (40 records · `src/data/supplierLeads.js`)

| Field | Status | Source |
|---|---|---|
| `company`, `city`, `state`, `address` | **Real** | TNPCB / KSPCB / CPCB authorised recycler PDFs; IndiaMART GST-confirmed listings; company websites |
| `phone`, `email` | **Real** (where `verified: true`) | Same official sources |
| `source`, `sourceUrl` | **Real** | Direct links to registry pages |
| `monthlyKgEstimate` | **Generated** (seeded, reproducible) | PRD tier midpoints: 250 / 750 / 2 000 / 4 500 kg/mo |
| `lastContactDaysAgo`, `attemptCount` | **Generated** (seeded) | PRD dummy-data rules |
| `stage`, `interest`, `volTier` | **Generated** (seeded) | PRD stage distribution spec |

### Buyer leads (20 records · `src/data/buyerLeads.js`)

| Field | Status | Source |
|---|---|---|
| `company`, `category` | **Real** | Company websites, investor reports |
| `consumptionMT`, `products` | **Real** | Annual reports / capacity filings |
| `currentSupplier` | **Real** (where public) | Procurement disclosures |
| `loiProbability`, `stage`, `sampleRequested` | **Generated** (seeded) | PRD scoring rubric |

### Collection points (32 records · `src/data/collectionPoints.js`)

| Field | Status | Source |
|---|---|---|
| `name`, `lat`, `lng`, `city` — 17 verified points | **Real** | TNPCB/KSPCB registry PDFs, Saahas PRO list, IndiaMART |
| `name`, `lat`, `lng` — 15 field-survey points | **Generated** | Placeholders from field survey — to be verified on-ground |
| `monthlyKgEstimate` | **Generated** | Category lookup table (PRD §4.4) |
| `willingness` | **Generated** (seeded) | PRD dummy rules |

### Market prices (`src/data/marketPrices.js`)

All price history, sparklines, and current prices are **generated** with realistic ranges seeded from LME/FastMarkets published price bands (Jun 2026). The `calcRecoveryValueINR` formula uses actual NMC622/NMC811/LFP stoichiometry — the ₹1,116/kg NMC622 figure is a real recovery benchmark.

---

## Key implementation notes

**Leaflet in Next.js** — Leaflet accesses `window` at import time, crashing SSR. `CollectionMap.jsx` is loaded via `next/dynamic({ ssr: false })`. PNG marker imports return a Next static-image object; use `markerIcon.src ?? markerIcon` for the `iconUrl`.

**Tailwind v4** — uses `@import "tailwindcss"` (not `@tailwind base/components/utilities`). Canonical utility classes like `max-w-350` (= `max-w-[1400px]`).

**React 19 / Next 16 lint rule `react-hooks/set-state-in-effect`** — `setState` must not be called synchronously in effect bodies. All animations use `requestAnimationFrame` callbacks; pagination reset uses React's "adjust state during render" pattern (compare a `prevSig` state value in render, no effect).

**Health score formula** — `contactRate×30 + qualRate×25 + velocityScore×20 + coverageScore×25` → **66/100 amber** from real data (`computeHealthScore` in `src/utils/healthScore.js`).

---

## Project structure

```
jol-dashboard/
├── src/
│   ├── app/
│   │   ├── api/ai/route.js        # Anthropic API proxy (server-side key)
│   │   ├── layout.js              # Leaflet CSS import + metadata
│   │   ├── globals.css            # Tailwind v4 + CSS vars
│   │   └── page.js                # Server entry → <Dashboard />
│   ├── components/
│   │   ├── Dashboard.jsx          # App shell, tabs, progress bar, bell
│   │   ├── HealthScore.jsx        # SVG ring gauge (score 66, amber)
│   │   ├── AlertsPanel.jsx        # Slide-in alerts drawer (250ms)
│   │   ├── KPICard.jsx            # Animated KPI + ⓘ provenance tooltip
│   │   ├── FunnelChart.jsx        # Custom SVG trapezoid funnel
│   │   ├── LeadTable.jsx          # Sort / filter / expand / CSV export
│   │   ├── SupplierPipeline.jsx   # M1 — supplier pipeline
│   │   ├── BuyerPipeline.jsx      # M2 — buyer pipeline
│   │   ├── CollectionNetwork.jsx  # M3 — wrapper + sidebar
│   │   ├── CollectionMap.jsx      # M3 — Leaflet map (client-only)
│   │   ├── MarketIntelligence.jsx # M4 — market intelligence
│   │   └── AIInsights.jsx         # M5 — AI insights (Claude API)
│   ├── data/
│   │   ├── supplierLeads.js       # 40 leads + supplierStats
│   │   ├── buyerLeads.js          # 20 leads + buyerStats
│   │   ├── collectionPoints.js    # 32 points + hubs + hubEconomics
│   │   └── marketPrices.js        # 30-day prices + margin calculator
│   └── utils/
│       ├── useCountUp.js          # Animated count-up React hook
│       ├── healthScore.js         # computeHealthScore()
│       ├── formatters.js          # fmtINR / fmtKg / stageColor / …
│       └── exportCsv.js           # downloadCsv() via PapaParse
└── .env                           # NEXT_PUBLIC_ANTHROPIC_KEY (gitignored)
```

---

## Submission checklist

- [ ] Public Vercel URL *(paste here after deploy)*
- [ ] Excel lead database (export from Suppliers / Buyers tabs → CSV)
- [ ] Evidence folder (email / WhatsApp / map screenshots)
- [ ] 2–3 page insights report (3 numbered, data-backed recommendations)
- [ ] 10–15 slide deck
- [x] README documenting real vs. generated fields
