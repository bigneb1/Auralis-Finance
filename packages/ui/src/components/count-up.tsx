"use client";

import { useEffect, useRef, useState } from "react";

/** Animates the numeric part of a string (e.g. "$18.42M", "9.18%", "42") from 0
 *  to its value over ~600ms on mount. Preserves any prefix/suffix. Honors
 *  prefers-reduced-motion (renders the final value immediately). */
export function CountUpValue({ value, duration = 600 }: { value: string; duration?: number }) {
  const target = Number(value.replace(/[^0-9.]/g, ""));
  const [display, setDisplay] = useState(() => (Number.isNaN(target) ? value : formatLike(value, 0)));
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (Number.isNaN(target)) { setDisplay(value); return; }
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setDisplay(formatLike(value, target)); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic — calm, not bouncy
      setDisplay(formatLike(value, target * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, target, duration]);

  if (Number.isNaN(target)) return <>{value}</>;
  return <>{display}</>;
}

function formatLike(original: string, latest: number) {
  const decimals = original.includes(".") ? 2 : 0;
  const num = latest.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  return original.replace(/[0-9,]*\.?[0-9]+/, num);
}
