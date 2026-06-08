"use client";

import { useEffect, useRef, useState } from "react";

// Mix a hex colour toward white by `amt` (0–1).
function lighten(hex, amt = 0.15) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.round(r + (255 - r) * amt);
  g = Math.round(g + (255 - g) * amt);
  b = Math.round(b + (255 - b) * amt);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const ROW_H = 44; // px per stage

/**
 * Custom SVG funnel (not Recharts). Each stage is a centered trapezoid whose
 * top width = its own count and bottom width = the next stage's count, giving a
 * connected taper. Bars grow horizontally on mount (scaleX, 400ms).
 *
 * Props: stages [{stage, count, color}], title, orientation, onStageClick(stage)
 */
export default function FunnelChart({
  stages = [],
  title,
  orientation = "vertical",
  onStageClick,
}) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = Math.max(1, ...stages.map((s) => s.count || 0));
  const clickable = typeof onStageClick === "function";

  /* Click ripple emitter */
  const emitRipple = (e, color) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    Object.assign(ripple.style, {
      left: `${x - 20}px`,
      top: `${y - 20}px`,
      width: '40px',
      height: '40px',
      background: `${color}44`,
    });
    e.currentTarget.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  };

  return (
    <div className="w-full" ref={containerRef}>
      {title && (
        <h3 className="mb-3 text-sm font-semibold text-[#0D2137]">{title}</h3>
      )}
      <div className="flex flex-col gap-1">
        {stages.map((s, i) => {
          const topW = ((s.count || 0) / max) * 100;
          const next = stages[i + 1];
          const botW = next ? ((next.count || 0) / max) * 100 : topW * 0.7;
          const prev = stages[i - 1];
          const conv =
            prev && prev.count > 0
              ? `${((s.count / prev.count) * 100).toFixed(0)}%`
              : null;

          const tl = (100 - topW) / 2;
          const tr = (100 + topW) / 2;
          const bl = (100 - botW) / 2;
          const br = (100 + botW) / 2;
          const base = s.color || "#185FA5";
          const fill = hovered === i ? lighten(base) : base;
          const isHov = hovered === i;

          return (
            <div key={s.stage} className="flex items-center gap-3">
              <div className="w-28 shrink-0 truncate text-right text-[13px] text-[#444444]">
                {s.stage}
              </div>
              <div
                className={
                  "relative h-11 flex-1 overflow-hidden" + (clickable ? " cursor-pointer" : "")
                }
                onClick={(e) => {
                  if (clickable) {
                    emitRipple(e, base);
                    onStageClick(s.stage);
                  }
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                title={`${s.stage}: ${s.count}`}
              >
                <svg
                  width="100%"
                  height={ROW_H}
                  viewBox="0 0 100 44"
                  preserveAspectRatio="none"
                  style={{
                    filter: isHov ? `drop-shadow(0 2px 8px ${base}44)` : 'none',
                    transition: 'filter 200ms ease',
                  }}
                >
                  <polygon
                    points={`${tl},0 ${tr},0 ${br},44 ${bl},44`}
                    fill={fill}
                    style={{
                      transform: `scaleX(${mounted ? (isHov ? 1.03 : 1) : 0})`,
                      transformOrigin: "50% 50%",
                      transition: `transform 420ms cubic-bezier(0.34,1.56,0.64,1) ${i * 70}ms, fill 150ms ease`,
                    }}
                  />
                </svg>
              </div>
              <div className="flex w-20 shrink-0 items-baseline justify-end gap-1">
                <span className="text-sm font-semibold text-[#0D2137]">
                  {s.count}
                </span>
                {conv && (
                  <span className="text-[11px] text-gray-400">{conv}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
