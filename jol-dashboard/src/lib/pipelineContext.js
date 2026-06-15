// Compact JSON snapshot of the live dashboard data, used to ground the AI
// chat / insights. Kept under ~800 tokens. Shared by AIInsights and the
// floating chat widget so there's one source of truth.

import { supplierLeads, supplierStats } from "../data/supplierLeads.js";
import { buyerStats } from "../data/buyerLeads.js";
import { collectionStats } from "../data/collectionPoints.js";
import { marketStats } from "../data/marketPrices.js";

// Format a metal price stat into an unambiguous, self-describing string so the
// model can't misread the raw number or its 30-day change.
function fmtMetal(stat) {
  const sign = stat.change30d >= 0 ? "+" : "";
  return `${stat.current.toLocaleString("en-US")} USD/metric-ton (${sign}${stat.change30d}% over 30 days)`;
}

function buildPipelineContext() {
  const staleLeads = supplierLeads.filter(
    (l) => l.lastContactDaysAgo >= 14 && l.stage === "Lead",
  ).length;

  // Every value carries its unit in the key or the value itself. The terse,
  // unit-less version let the model confuse, e.g., a collection-point COUNT
  // ("Bengaluru: 9") with a kg volume — so units are now explicit everywhere.
  return JSON.stringify({
    units: "Lead/buyer/point figures are counts. Volumes are kg per month unless suffixed MT (metric tons). Metal prices are USD per metric ton.",
    suppliers: {
      totalLeads: supplierStats.total,
      leadCountByState: supplierStats.byState,
      funnelStageLeadCounts: supplierStats.funnelStages.map(
        (s) => `${s.stage}: ${s.count} leads`,
      ),
      totalMonthlyVolume_kg: supplierStats.totalKg,
      tonPlusTierLeadCount: supplierStats.tonPlusTier,
      staleLeadCount: staleLeads,
      highInterestLeadCount: supplierStats.highInterest,
      citiesCovered: supplierStats.citiesCount,
      topCitiesByMonthlyVolume: supplierStats.cityVolumeChart
        .slice(0, 5)
        .map((c) => `${c.city}: ${c.kg.toLocaleString("en-US")} kg/month`),
    },
    buyers: {
      totalBuyers: buyerStats.total,
      buyerCountByCategory: buyerStats.byCategory,
      buyerCountByProduct: buyerStats.byProduct,
      totalMonthlyDemand_MT: buyerStats.totalConsumptionMT,
      highLoiBuyerCount: buyerStats.highLoiCount,
    },
    collection: {
      totalPoints: collectionStats.total,
      verifiedPoints: collectionStats.verified,
      fieldPoints: collectionStats.field,
      totalMonthlyVolume_kg: collectionStats.totalKg,
      pointCountByCity: collectionStats.byCity,
    },
    market: {
      cobalt: fmtMetal(marketStats.cobalt),
      nickel: fmtMetal(marketStats.nickel),
      lithiumCarbonate: fmtMetal(marketStats.liCarb),
      pricesAsOf: marketStats.latestDate,
    },
  });
}

// Stable module-level value (data is deterministic/seeded).
export const PIPELINE_CONTEXT = buildPipelineContext();
