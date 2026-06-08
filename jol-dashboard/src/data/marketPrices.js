// ─────────────────────────────────────────────────────────────────────────────
// marketPrices.js  –  Jol Energy Dashboard
//
// CONTENTS
//   1. priceHistory      → 30-day daily price series (Jun 7 – Jul 6, 2026)
//   2. currentPrices     → Latest snapshot with source citations
//   3. scrapPriceRef     → Battery scrap INR/kg ranges by category
//   4. policyTracker     → 4 active regulatory items
//   5. marginCalcConfig  → Chemistry-specific recovery yield for calculator
//
// METHODOLOGY
//   Anchor prices are REAL recorded values from:
//     Cobalt     → tradingeconomics.com/commodity/cobalt, May 2026  ($56,290/MT)
//     Nickel     → tradingeconomics.com/commodity/nickel, Jun 2026  ($15,500/MT)
//     Li Carbonate → metal.com/Lithium, SMM, 2025                   ($9,271/MT)
//     USD/INR    → exchange-rates.org, Jun 2026                       (~₹95.0)
//
//   30-day series: seeded random walk (±2% daily volatility for Co, ±1.5% Ni,
//   ±1% LiCarb). Same seed every load = reproducible.  The series starts at
//   the anchor and steps forward – each day's price is prev × (1 + Δ).
// ─────────────────────────────────────────────────────────────────────────────

// USD/INR conversion rate (update manually on submission day)
export const USD_INR = 95.0;

// ── Seeded random walk generator ─────────────────────────────────────────────
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
// Each metal gets its own independent seed
const randCo  = seededRand(31415);
const randNi  = seededRand(27182);
const randLi  = seededRand(14142);

function randomWalk(anchor, days, volPct, randFn) {
  const series = [];
  let price = anchor;
  for (let d = 0; d < days; d++) {
    const delta = (randFn() - 0.5) * 2 * volPct;
    price = price * (1 + delta);
    series.push(Math.round(price));
  }
  return series;
}

// Build date labels: Jun 7 → Jul 6, 2026
function buildDates(start, days) {
  const dates = [];
  const d = new Date(start);
  for (let i = 0; i < days; i++) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

const DAYS         = 30;
const START_DATE   = "2026-06-07";
const COBALT_BASE  = 56290;
const NICKEL_BASE  = 15500;
const LICARB_BASE  = 9271;

const dates      = buildDates(START_DATE, DAYS);
const cobaltSeries = randomWalk(COBALT_BASE,  DAYS, 0.020, randCo);
const nickelSeries = randomWalk(NICKEL_BASE,  DAYS, 0.015, randNi);
const liCarbSeries = randomWalk(LICARB_BASE,  DAYS, 0.010, randLi);

// ── 1. PRICE HISTORY (used by Recharts LineChart in Module 4) ─────────────────
export const priceHistory = dates.map((date, i) => ({
  date,
  dateShort: date.slice(5),          // "06-07" for chart x-axis
  cobalt_usd:  cobaltSeries[i],
  nickel_usd:  nickelSeries[i],
  liCarb_usd:  liCarbSeries[i],
  cobalt_inr:  Math.round(cobaltSeries[i] / 1000 * USD_INR),   // INR per kg
  nickel_inr:  Math.round(nickelSeries[i] / 1000 * USD_INR),
  liCarb_inr:  Math.round(liCarbSeries[i] / 1000 * USD_INR),
}));

// ── 2. CURRENT PRICES (KPI cards in Module 4) ─────────────────────────────────
export const currentPrices = {
  asOf: "2026-06-07",
  usdInr: USD_INR,
  metals: [
    {
      id:       "cobalt",
      name:     "Cobalt",
      formula:  "Co",
      usdPerMT: COBALT_BASE,
      inrPerKg: Math.round(COBALT_BASE / 1000 * USD_INR),
      trend:    "+67% YoY",
      trendDir: "up",
      source:   "Trading Economics",
      sourceUrl:"https://tradingeconomics.com/commodity/cobalt",
      note:     "LME spot; May 2026 peak – strategic for Jol's NMC recovery margin",
      color:    "#185FA5",
    },
    {
      id:       "nickel",
      name:     "Nickel",
      formula:  "Ni",
      usdPerMT: NICKEL_BASE,
      inrPerKg: Math.round(NICKEL_BASE / 1000 * USD_INR),
      trend:    "Stable ±3%",
      trendDir: "flat",
      source:   "Trading Economics",
      sourceUrl:"https://tradingeconomics.com/commodity/nickel",
      note:     "LME spot; key recovery product from NMC batteries",
      color:    "#0F6E56",
    },
    {
      id:       "liCarb",
      name:     "Lithium Carbonate",
      formula:  "Li₂CO₃",
      usdPerMT: LICARB_BASE,
      inrPerKg: Math.round(LICARB_BASE / 1000 * USD_INR),
      trend:    "Down from 2022 peak",
      trendDir: "down",
      source:   "Shanghai Metals Market (SMM)",
      sourceUrl:"https://metal.com/Lithium",
      note:     "Battery-grade Li₂CO₃. Down from $81,000/MT peak (2022).",
      color:    "#BA7517",
    },
    {
      id:       "liMetal",
      name:     "Lithium Metal",
      formula:  "Li",
      usdPerMT: 80354,
      inrPerKg: Math.round(80354 / 1000 * USD_INR),
      trend:    "Rising",
      trendDir: "up",
      source:   "SMM metal.com",
      sourceUrl:"https://metal.com/Lithium",
      note:     "Battery-grade Li metal; Feb 2025 SMM data",
      color:    "#534AB7",
    },
  ],
};

// Sparkline data (last 7 days of each 30-day series) for KPI card micro-charts
export const sparklines = {
  cobalt:  cobaltSeries.slice(-7),
  nickel:  nickelSeries.slice(-7),
  liCarb:  liCarbSeries.slice(-7),
};

// ── 3. BATTERY SCRAP PRICE REFERENCE (table in Module 4) ──────────────────────
export const scrapPriceRef = [
  {
    category:     "Mobile / smartphone battery",
    avgWeightG:   65,
    inrPerKgMin:  30,
    inrPerKgMax:  60,
    inrPerKgMid:  45,
    recoveryTier: "Low value, high volume",
    primaryMetal: "Li + Co (NMC/LCO)",
    densityNote:  "High density in mobile repair clusters",
    color:        "#B5D4F4",
  },
  {
    category:     "Tablet battery",
    avgWeightG:   225,
    inrPerKgMin:  40,
    inrPerKgMax:  70,
    inrPerKgMid:  55,
    recoveryTier: "Low-medium",
    primaryMetal: "Li + Co",
    densityNote:  "Moderate density; often mixed with mobile waste",
    color:        "#85B7EB",
  },
  {
    category:     "Power bank",
    avgWeightG:   350,
    inrPerKgMin:  35,
    inrPerKgMax:  65,
    inrPerKgMid:  50,
    recoveryTier: "Low-medium",
    primaryMetal: "Li + Co/Ni (18650 cells)",
    densityNote:  "Growing segment with accessory retail expansion",
    color:        "#378ADD",
  },
  {
    category:     "Laptop battery pack",
    avgWeightG:   450,
    inrPerKgMin:  50,
    inrPerKgMax:  80,
    inrPerKgMid:  65,
    recoveryTier: "Medium",
    primaryMetal: "Li + Ni + Co (NMC 18650)",
    densityNote:  "Laptop service centres – concentrated supply",
    color:        "#185FA5",
  },
  {
    category:     "E-scooter battery pack",
    avgWeightG:   10000,
    inrPerKgMin:  80,
    inrPerKgMax:  130,
    inrPerKgMid:  105,
    recoveryTier: "High",
    primaryMetal: "Li + Ni (NMC) or Li+Fe (LFP)",
    densityNote:  "Ola/Ather/TVS service hubs – premium feedstock",
    color:        "#0C447C",
  },
  {
    category:     "UPS Li-ion pack",
    avgWeightG:   17500,
    inrPerKgMin:  85,
    inrPerKgMax:  140,
    inrPerKgMid:  112,
    recoveryTier: "High",
    primaryMetal: "Li + Fe + P (LFP dominant)",
    densityNote:  "Industrial / data-centre supply chain",
    color:        "#0F6E56",
  },
  {
    category:     "Telecom Li-ion pack",
    avgWeightG:   30000,
    inrPerKgMin:  90,
    inrPerKgMax:  150,
    inrPerKgMid:  120,
    recoveryTier: "High",
    primaryMetal: "LFP dominant",
    densityNote:  "Bulk supply from tower companies (Indus, ATC, etc.)",
    color:        "#085041",
  },
  {
    category:     "EV car battery pack",
    avgWeightG:   400000,
    inrPerKgMin:  100,
    inrPerKgMax:  180,
    inrPerKgMid:  140,
    recoveryTier: "Highest",
    primaryMetal: "NMC 622/811 or LFP",
    densityNote:  "EV OEM service centres – highest value per unit",
    color:        "#04342C",
  },
];

// ── 4. POLICY TRACKER ─────────────────────────────────────────────────────────
export const policyTracker = [
  {
    id: "POL-001",
    title: "Battery Waste Management Rules, 2022",
    status: "Active",
    statusColor: "#3B6D11",
    effectiveDate: "2022-08-24",
    authority: "MoEFCC, Govt. of India",
    summary: "EPR obligations on battery producers. Recyclers must register on CPCB portal. Collection targets: 70% by 2026, 90% by 2028.",
    impact: "High – mandates formal recycling channel; boosts legitimate supply to Jol",
    sourceUrl: "https://moef.gov.in",
  },
  {
    id: "POL-002",
    title: "E-Waste Management Rules, 2022",
    status: "Active (from Apr 2023)",
    statusColor: "#3B6D11",
    effectiveDate: "2023-04-01",
    authority: "MoEFCC, Govt. of India",
    summary: "Mandatory CPCB registration for all recyclers/refurbishers. Formalises the informal e-waste sector. Strict GPS tracking of waste movement.",
    impact: "High – eliminates informal competition; all waste must flow through authorised recyclers",
    sourceUrl: "https://moef.gov.in",
  },
  {
    id: "POL-003",
    title: "FAME II (Faster Adoption & Manufacturing of EVs)",
    status: "Active",
    statusColor: "#3B6D11",
    effectiveDate: "2019-04-01",
    authority: "Ministry of Heavy Industries",
    summary: "₹10,000Cr subsidy scheme accelerating EV adoption. Creates growing inventory of EV batteries approaching end-of-life by 2026–2028.",
    impact: "Medium-High – drives future EV battery scrap volume; early mover advantage",
    sourceUrl: "https://heavyindustries.gov.in",
  },
  {
    id: "POL-004",
    title: "ACC PLI Scheme (Advanced Chemistry Cell)",
    status: "Active",
    statusColor: "#3B6D11",
    effectiveDate: "2021-05-12",
    authority: "Ministry of Heavy Industries",
    summary: "₹18,100Cr PLI for 50 GWh domestic cell manufacturing. Amara Raja, Exide, Ola, Reliance are beneficiaries – driving demand for domestic metal salts.",
    impact: "Very High – creates strategic domestic buyers for Jol's recovered NiSO4/CoSO4/Li2CO3",
    sourceUrl: "https://heavyindustries.gov.in",
  },
];

// ── 5. MARGIN CALCULATOR CONFIG ───────────────────────────────────────────────
// Used by the interactive margin calculator in Module 4
// recovery_pct = % of each metal recoverable from 1 kg of battery
export const chemistryProfiles = [
  {
    id:   "NMC622",
    name: "NMC 622 (Laptop / E-scooter)",
    constituents: [
      { metal:"cobalt",  pct:0.12, priceKey:"cobalt"  },
      { metal:"nickel",  pct:0.22, priceKey:"nickel"   },
      { metal:"lithium", pct:0.06, priceKey:"liCarb",  convFactor:5.323 },
    ],
    grossRecoveryFraction: 0.85,
    typicalInputKgPerMonth: 500,
    note: "Dominant in laptop, e-scooter, most mobile batteries",
  },
  {
    id:   "NMC811",
    name: "NMC 811 (EV / high-energy)",
    constituents: [
      { metal:"cobalt",  pct:0.065, priceKey:"cobalt"  },
      { metal:"nickel",  pct:0.32,  priceKey:"nickel"  },
      { metal:"lithium", pct:0.062, priceKey:"liCarb", convFactor:5.323 },
    ],
    grossRecoveryFraction: 0.87,
    typicalInputKgPerMonth: 300,
    note: "Higher Ni, lower Co – recovery value driven by Ni price",
  },
  {
    id:   "LFP",
    name: "LFP (Telecom / UPS / E-bus)",
    constituents: [
      { metal:"lithium", pct:0.045, priceKey:"liCarb", convFactor:5.323 },
      { metal:"iron",    pct:0.30,  priceKey:null      },
    ],
    grossRecoveryFraction: 0.80,
    typicalInputKgPerMonth: 400,
    note: "Lower recovery value per kg; higher volumes from telecom / UPS sector",
  },
];

// Helper: compute gross recovery value (INR) for given kg input
export function calcRecoveryValueINR(chemistry, inputKg, processingCostPerKg = 25) {
  let grossINR = 0;
  const latest = priceHistory[priceHistory.length - 1];

  chemistry.constituents.forEach(c => {
    if (!c.priceKey) return;
    const metalUsdPerMT = c.priceKey === "cobalt" ? latest.cobalt_usd
                        : c.priceKey === "nickel" ? latest.nickel_usd
                        : latest.liCarb_usd;
    const metalUsdPerKg = metalUsdPerMT / 1000;
    // for Li: 1 kg battery Li → x kg Li2CO3; convFactor = mass ratio
    const saleMassKg    = c.convFactor ? inputKg * c.pct * c.convFactor : inputKg * c.pct;
    grossINR += saleMassKg * metalUsdPerKg * USD_INR;
  });

  const netINR = (grossINR * chemistry.grossRecoveryFraction) - (inputKg * processingCostPerKg);
  return {
    grossINR:         Math.round(grossINR),
    processingCostINR: Math.round(inputKg * processingCostPerKg),
    netINR:            Math.round(netINR),
    netPerKgINR:       Math.round(netINR / inputKg),
  };
}

// ── DERIVED MARKET STATS ──────────────────────────────────────────────────────
export const marketStats = (() => {
  const latest  = priceHistory[priceHistory.length - 1];
  const oldest  = priceHistory[0];
  const cobaltChg = ((latest.cobalt_usd - oldest.cobalt_usd) / oldest.cobalt_usd * 100).toFixed(1);
  const nickelChg = ((latest.nickel_usd - oldest.nickel_usd) / oldest.nickel_usd * 100).toFixed(1);
  const liCarbChg = ((latest.liCarb_usd - oldest.liCarb_usd) / oldest.liCarb_usd * 100).toFixed(1);

  return {
    latestDate:       latest.date,
    cobalt:           { current: latest.cobalt_usd, change30d: parseFloat(cobaltChg) },
    nickel:           { current: latest.nickel_usd, change30d: parseFloat(nickelChg) },
    liCarb:           { current: latest.liCarb_usd, change30d: parseFloat(liCarbChg) },
    highestValueScrap:"EV car battery pack",
    avgNMCValueINR:   Math.round(calcRecoveryValueINR(chemistryProfiles[0], 1000).netPerKgINR),
  };
})();
