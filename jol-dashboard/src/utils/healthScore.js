export function computeHealthScore(supplierStats) {
  const { total, funnelStages, totalKg } = supplierStats;
  if (!total) return 0;

  const contacted = funnelStages.find((s) => s.stage === "Contacted")?.count || 0;
  const qualified = funnelStages.find((s) => s.stage === "Qualified")?.count || 0;
  const interested = funnelStages.find((s) => s.stage === "Interested")?.count || 0;
  const loi = funnelStages.find((s) => s.stage === "LOI Received")?.count || 0;

  const advancedCount = contacted + qualified + interested + loi;
  const contactRate = advancedCount / total;
  const qualRate = (qualified + interested + loi) / Math.max(advancedCount, 1);
  const coverageScore = Math.min(totalKg / 10000, 1);
  const velocityScore = 0.6;

  const score = contactRate * 30 + qualRate * 25 + velocityScore * 20 + coverageScore * 25;
  return Math.round(score);
}
