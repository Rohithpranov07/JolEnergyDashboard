"use client";

import { useEffect, useState } from "react";
import { supplierStats } from "../data/supplierLeads.js";

function computeScore(stats) {
  const total = stats.total || 0;
  if (!total) return 0;
  const get = (s) => stats.byStage?.[s] ?? 0;
  const contacted  = get("Contacted");
  const qualified  = get("Qualified");
  const interested = get("Interested");
  const loi        = get("LOI Received");
  const advanced   = contacted + qualified + interested + loi;
  const contactRate  = advanced / total;
  const qualRate     = (qualified + interested + loi) / Math.max(advanced, 1);
  const coverageScore = Math.min((stats.totalKg || 0) / 10000, 1);
  const velocityScore = 0.6;
  return Math.round(contactRate * 30 + qualRate * 25 + velocityScore * 20 + coverageScore * 25);
}

function arcColor(score) {
  if (score <= 40) return "#F87171";
  if (score <= 70) return "#FBBF24";
  return "#34D399";
}

export default function HealthScore({ score, size = 64, accentColor }) {
  const value = typeof score === "number" ? score : computeScore(supplierStats);
  const pct   = Math.max(0, Math.min(100, value));

  const strokeWidth  = 5.5;
  const radius       = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash         = (pct / 100) * circumference;
  const center       = size / 2;
  const color        = arcColor(pct);

  /* Arc animates from 0 on mount */
  const [displayDash, setDisplayDash] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDisplayDash(dash));
    return () => cancelAnimationFrame(id);
  }, [dash]);

  return (
    <div
      className="relative inline-flex shrink-0 cursor-default"
      style={{ width: size, height: size }}
      title={`Pipeline health: ${value}/100`}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 glow-ring"
        style={{
          filter: `drop-shadow(0 0 6px ${color}55)`,
          '--glow-color': `${color}55`,
        }}
      >
        {/* Track */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth={strokeWidth}
        />
        {/* Arc */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${displayDash} ${circumference - displayDash}`}
          style={{ transition: "stroke-dasharray 950ms cubic-bezier(0.23,1,0.32,1), stroke 400ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="alive-number font-bold leading-none" style={{ fontSize: 13, color }}>
          {value}
        </span>
        <span className="mt-0.5 leading-none" style={{ fontSize: 9, color: "var(--text-muted)" }}>
          HEALTH
        </span>
      </div>
    </div>
  );
}
