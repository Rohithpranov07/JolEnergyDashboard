import { supplierStats } from "../data/supplierLeads.js";

// Pipeline health composite (0–100). Mirrors PRD §02 / TASK-09 computeHealthScore.
function computeScore(stats) {
  const total = stats.total || 0;
  if (!total) return 0;
  const get = (s) => stats.byStage?.[s] ?? 0;
  const contacted = get("Contacted");
  const qualified = get("Qualified");
  const interested = get("Interested");
  const loi = get("LOI Received");

  const advanced = contacted + qualified + interested + loi;
  const contactRate = advanced / total;
  const qualRate = (qualified + interested + loi) / Math.max(advanced, 1);
  const coverageScore = Math.min((stats.totalKg || 0) / 10000, 1);
  const velocityScore = 0.6; // fixed baseline for dummy data

  return Math.round(
    contactRate * 30 + qualRate * 25 + velocityScore * 20 + coverageScore * 25,
  );
}

function arcColor(score) {
  if (score <= 40) return "#E24B4A";
  if (score <= 70) return "#EF9F27";
  return "#1D9E75";
}

export default function HealthScore({ score, size = 64 }) {
  const value =
    typeof score === "number" ? score : computeScore(supplierStats);
  const pct = Math.max(0, Math.min(100, value));

  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;
  const center = size / 2;
  const color = arcColor(pct);

  return (
    <div className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E6F1FB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ transition: "stroke-dasharray 800ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold leading-none text-[#0D2137]" style={{ fontSize: 14 }}>
          {value}
        </span>
        <span className="mt-0.5 text-[10px] leading-none text-gray-500">Health</span>
      </div>
    </div>
  );
}
