"use client";

import useCountUp from "../utils/useCountUp.js";

/* Map accent hex to a soft glow rgba for the corner wash */
function makeGlow(hex) {
  const map = {
    "#185FA5": "rgba(24,95,165,0.14)",
    "#3D7FE8": "rgba(61,127,232,0.14)",
    "#0A7864": "rgba(10,120,100,0.13)",
    "#10B98A": "rgba(16,185,138,0.14)",
    "#B45309": "rgba(180,83,9,0.14)",
    "#F59E0B": "rgba(245,158,11,0.16)",
    "#534AB7": "rgba(83,74,183,0.14)",
    "#8B7FF5": "rgba(139,127,245,0.16)",
    "#A32D2D": "rgba(163,45,45,0.13)",
    "#F0656A": "rgba(240,101,106,0.15)",
  };
  return map[hex] || "rgba(61,127,232,0.14)";
}

function subtextColor(text) {
  const s = String(text);
  if (s.includes("↑") || s.includes("+")) return "#047857";
  if (s.includes("↓")) return "#DC2626";
  return "var(--text-muted)";
}

function InfoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  );
}

export default function KPICard({
  value,
  label,
  subtext,
  color = "#3D7FE8",
  source,
  animateOnMount = false,
  onClick,
  active,
}) {
  const display = useCountUp(value, 1200, animateOnMount);
  const shown =
    typeof display === "number" ? display.toLocaleString("en-IN") : display;
  const glow = makeGlow(color);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);

    /* 3D parallax tilt (±2° max) */
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateY = ((x - cx) / cx) * 2;   // -2 to +2 deg
    const rotateX = ((cy - y) / cy) * 2;   // -2 to +2 deg
    e.currentTarget.style.transform = active
      ? `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`
      : `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = active ? 'translateY(-2px)' : '';
  };

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`kpi-card-premium spotlight-card border-shimmer glass-card group relative overflow-hidden rounded-2xl p-5 ${onClick ? "pressable cursor-pointer" : ""}`}
      style={{ 
        "--kpi-color": color, 
        "--kpi-glow": glow,
        border: active ? `1.5px solid ${color}` : undefined,
        boxShadow: active ? `0 4px 20px ${color}22, var(--shadow-sm)` : undefined,
        transform: active ? "translateY(-2px)" : undefined,
        transition: "transform 400ms cubic-bezier(0.23,1,0.32,1), box-shadow 300ms ease, border-color 300ms ease",
        willChange: "transform",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Source tooltip */}
      {source && (
        <span className="group/tip absolute right-3 top-3 cursor-help text-[#C2C8D2] transition-colors hover:text-[var(--text-secondary)]">
          <InfoIcon />
          <span className="tooltip-animated absolute right-0 top-5 z-20 w-max max-w-56 rounded-xl px-3 py-2 text-[11px] leading-snug"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              backdropFilter: "blur(14px) saturate(180%)",
              boxShadow: "var(--shadow-md)",
            }}>
            {source}
          </span>
        </span>
      )}

      {/* Number */}
      <div
        className="kpi-number-reveal alive-number tnum pr-8 text-[2.15rem] font-bold leading-none tracking-[-0.02em]"
        style={{ color }}
      >
        {shown}
      </div>

      {/* Label */}
      <div className="mt-2 text-[12.5px] font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>

      {/* Subtext */}
      {subtext != null && subtext !== "" && (
        <div className="mt-1 text-[11px] font-semibold" style={{ color: subtextColor(subtext) }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
