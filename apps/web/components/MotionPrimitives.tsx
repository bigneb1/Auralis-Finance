"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function RouteTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({ value }: { value: string }) {
  const number = Number(value.replace(/[^0-9.]/g, ""));
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce || Number.isNaN(number) ? number : 0);
  const display = useTransform(mv, (latest) => value.replace(number.toString(), formatLike(value, latest)));
  useEffect(() => {
    if (reduce || Number.isNaN(number)) { mv.set(Number.isNaN(number) ? 0 : number); return; }
    const controls = animate(mv, number, { duration: 0.6, ease: "easeOut" });
    return () => controls.stop();
  }, [number, reduce, mv]);
  if (Number.isNaN(number)) return <>{value}</>;
  return <motion.span>{display}</motion.span>;
}

export function MotionDonut({ percent, label = "allocation" }: { percent: number; label?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-label={`${label}: ${percent}%`}
      className="grid h-28 w-28 place-items-center rounded-full"
      initial={reduce ? false : { background: "conic-gradient(var(--teal) 0%, var(--surface-muted) 0)" }}
      animate={{ background: `conic-gradient(var(--teal) ${percent}%, var(--surface-muted) 0)` }}
      transition={{ duration: reduce ? 0 : 0.22, ease: "easeOut" }}
    >
      <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--surface)] font-display">{percent}%</div>
    </motion.div>
  );
}

export function MotionSegmentDonut({ a, b, label = "target" }: { a: number; b: number; label?: string }) {
  const reduce = useReducedMotion();
  const safeA = Math.max(0, Math.min(100, a));
  const safeB = Math.max(0, Math.min(100, b));
  const gradient = `conic-gradient(var(--teal) 0 ${safeA}%, #1F58A8 ${safeA}% ${safeA + safeB}%, #8C97A8 ${safeA + safeB}% 100%)`;
  return (
    <motion.div
      aria-label={`${label}: ${safeA}/${safeB}/${Math.max(0, 100 - safeA - safeB)}`}
      className="grid h-36 w-36 place-items-center rounded-full"
      initial={reduce ? false : { background: "conic-gradient(var(--teal) 0 0%, #1F58A8 0% 0%, #8C97A8 0% 100%)" }}
      animate={{ background: gradient }}
      transition={{ duration: reduce ? 0 : 0.22, ease: "easeOut" }}
    >
      <div className="grid h-24 w-24 place-items-center rounded-full bg-[var(--surface)] text-center"><span className="font-display text-xl">100%</span><span className="-mt-5 text-xs text-[var(--text-secondary)]">target</span></div>
    </motion.div>
  );
}

export function DrawOnBar({ value }: { value: number }) {
  const reduce = useReducedMotion();
  return <motion.div className="h-2 rounded-full bg-[var(--teal)]" initial={reduce ? false : { width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: reduce ? 0 : 0.2 }} />;
}

function formatLike(original: string, latest: number) {
  const decimals = original.includes(".") ? 2 : 0;
  return latest.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}
