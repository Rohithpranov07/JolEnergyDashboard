// Compact JSON snapshot of the live dashboard data, used to ground the AI
// chat / insights. Kept under ~800 tokens. Shared by AIInsights and the
// floating chat widget so there's one source of truth.

import { supplierLeads, supplierStats } from "../data/supplierLeads.js";
import { buyerStats } from "../data/buyerLeads.js";
import { collectionStats } from "../data/collectionPoints.js";
import { marketStats } from "../data/marketPrices.js";

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

// Stable module-level value (data is deterministic/seeded).
export const PIPELINE_CONTEXT = buildPipelineContext();
