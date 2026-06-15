// Human-readable snapshot of the live dashboard data, used to ground the AI
// chat / insights. Kept under ~800 tokens. Shared by AIInsights and the
// floating chat widget so there's one source of truth.
//
// This is deliberately written as plain labelled prose (not raw JSON) so the
// model can quote figures naturally and map the user's wording to the right
// number — feeding it camelCase keys made it parrot field names like
// "tonPlusTierLeadCount" and claim values weren't "linked" to the question.

import { supplierLeads, supplierStats } from "../data/supplierLeads.js";
import { buyerStats } from "../data/buyerLeads.js";
import { collectionStats } from "../data/collectionPoints.js";
import { marketStats } from "../data/marketPrices.js";

const n = (v) => Number(v).toLocaleString("en-US");

// "Tamil Nadu 17, Karnataka 11, …"
const pairs = (obj, labels = {}) =>
  Object.entries(obj)
    .map(([k, v]) => `${labels[k] ?? k} ${v}`)
    .join(", ");

const fmtMetal = (s) =>
  `$${n(s.current)}/metric ton (${s.change30d >= 0 ? "+" : ""}${s.change30d}% over 30 days)`;

const BUYER_CATEGORY_LABELS = {
  SALT_MFR: "metal-salt manufacturers",
  CELL_MAKER: "cell makers",
  CAM_MAKER: "cathode-active-material makers",
  METAL_RECOV: "metal recovery",
};

function buildPipelineContext() {
  const staleLeads = supplierLeads.filter(
    (l) => l.lastContactDaysAgo >= 14 && l.stage === "Lead",
  ).length;

  const funnel = supplierStats.funnelStages
    .map((s) => `${s.stage} ${s.count}`)
    .join(", ");

  const topCities = supplierStats.cityVolumeChart
    .slice(0, 5)
    .map((c) => `${c.city} ${n(c.kg)} kg/month`)
    .join(", ");

  return `JOL ENERGY — live dashboard data (figures are counts unless a unit is shown).

SUPPLIERS (scrap-inflow pipeline):
- Total supplier leads: ${supplierStats.total}
- Leads in the 1-ton-plus / ton-plus volume tier (each ≥1,000 kg per month): ${supplierStats.tonPlusTier}
- High-interest leads: ${supplierStats.highInterest}
- Stale leads (no contact in 14+ days, still at "Lead" stage): ${staleLeads}
- Cities covered: ${supplierStats.citiesCount}
- Total estimated monthly scrap volume: ${n(supplierStats.totalKg)} kg/month
- Conversion funnel (leads per stage): ${funnel}
- Leads by state: ${pairs(supplierStats.byState)}
- Top cities by monthly volume: ${topCities}

BUYERS (recovered-metal offtake pipeline):
- Total buyers: ${buyerStats.total}
- Buyers by category: ${pairs(buyerStats.byCategory, BUYER_CATEGORY_LABELS)}
- Buyers by product (metal salt): ${pairs(buyerStats.byProduct)}
- Total monthly demand across buyers: ${n(buyerStats.totalConsumptionMT)} metric tons/month
- Buyers with high LOI (letter-of-intent) probability: ${buyerStats.highLoiCount}

COLLECTION NETWORK (grassroots collection points):
- Total collection points: ${collectionStats.total}
- Registry-verified points: ${collectionStats.verified}
- Field-sourced points: ${collectionStats.field}
- Total estimated monthly collection volume: ${n(collectionStats.totalKg)} kg/month
- Collection points by city: ${pairs(collectionStats.byCity)}

BATTERY-METAL MARKET PRICES (as of ${marketStats.latestDate}):
- Cobalt: ${fmtMetal(marketStats.cobalt)}
- Nickel: ${fmtMetal(marketStats.nickel)}
- Lithium carbonate: ${fmtMetal(marketStats.liCarb)}`;
}

// Stable module-level value (data is deterministic/seeded).
export const PIPELINE_CONTEXT = buildPipelineContext();
