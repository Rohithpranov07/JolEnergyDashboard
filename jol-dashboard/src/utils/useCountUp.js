"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated count-up hook.
 * Steps from 0 → target over `duration` ms using requestAnimationFrame,
 * easing out with ease = t => 1 - (1 - t)^3.
 *
 * If `target` is not a finite number (e.g. "$56,290"), animation is skipped
 * and the value is returned unchanged. If `enabled` is false, returns target.
 *
 * @param {number|string} target
 * @param {number} [duration=1200]
 * @param {boolean} [enabled=true]
 * @returns {number|string} current display value
 */
export default function useCountUp(target, duration = 1200, enabled = true) {
  const isNumeric = typeof target === "number" && Number.isFinite(target);
  const animate = isNumeric && enabled;
  const [value, setValue] = useState(animate ? 0 : target);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!animate) return undefined;

    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const start = performance.now();

    // setValue only runs inside the async rAF callback (not synchronously in
    // the effect body) – keeps the count-up smooth without cascading renders.
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * ease(t)));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, animate]);

  // Non-animated values are returned directly (no state needed).
  return animate ? value : target;
}
