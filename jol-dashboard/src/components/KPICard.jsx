"use client";

import useCountUp from "../utils/useCountUp.js";

function subtextColor(text) {
  const s = String(text);
  if (s.includes("↑") || s.includes("+")) return "#1D9E75"; // up = green
  if (s.includes("↓")) return "#E24B4A"; // down = red
  return "#888780"; // neutral grey
}

function InfoIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export default function KPICard({
  value,
  label,
  subtext,
  color = "#185FA5",
  source,
  animateOnMount = false,
}) {
  const display = useCountUp(value, 1200, animateOnMount);
  const shown =
    typeof display === "number" ? display.toLocaleString("en-IN") : display;

  return (
    <div className="relative rounded-xl border border-[#E0E0E0] bg-white p-4">
      {source && (
        <span className="group absolute right-3 top-3 cursor-help text-[#B8BDC4]">
          <InfoIcon />
          {/* Pure-CSS hover tooltip — PRD provenance requirement */}
          <span className="pointer-events-none absolute right-0 top-6 z-20 hidden w-max max-w-[240px] rounded-md bg-[#0D2137] px-2.5 py-1.5 text-[12px] leading-snug text-white shadow-lg group-hover:block">
            {source}
          </span>
        </span>
      )}

      <div className="pr-6 text-[28px] font-bold leading-tight" style={{ color }}>
        {shown}
      </div>
      <div className="mt-0.5 text-[13px] text-[#666666]">{label}</div>
      {subtext != null && subtext !== "" && (
        <div className="mt-1 text-[12px]" style={{ color: subtextColor(subtext) }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
