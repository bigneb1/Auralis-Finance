import { AlertTriangle, CheckCircle2, CircleDollarSign, XCircle } from "lucide-react";
import { cn } from "../lib";
import { Card, StatusPill } from "../primitives";

type Verdict = "ELIGIBLE" | "RESTRICTED" | "DENIED" | "NOT_CHECKED";

export function EligibilityChip({ verdict }: { verdict: Verdict }) {
  const map = {
    ELIGIBLE: [CheckCircle2, "eligible", "Eligible"],
    RESTRICTED: [AlertTriangle, "restricted", "Restricted"],
    DENIED: [XCircle, "denied", "Denied"],
    NOT_CHECKED: [AlertTriangle, "pending", "Not checked"],
  } as const;
  const [Icon, status, label] = map[verdict];
  return <StatusPill status={status}><Icon size={13} />{label}</StatusPill>;
}

export function KpiStat({ label, value, delta }: { label: string; value: string; delta?: string }) {
  const negative = delta?.trim().startsWith("-");
  return <Card className="p-5"><div className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">{label}</div><div className="mt-2 font-display text-[32px] font-normal leading-none tracking-[-0.01em] text-[var(--ink)]">{value}</div>{delta && <div className="mt-3"><StatusPill tone={negative ? "rose" : "emerald"}>{negative ? "↓" : "↑"} {delta.replace(/^[-+]/, "")}</StatusPill></div>}</Card>;
}

export function ConfidenceMeter({ value }: { value: number }) { const v = Math.max(0, Math.min(100, value)); return <div><div className="mb-1 flex justify-between text-xs"><span>Confidence</span><span>{v}%</span></div><div className="h-2 rounded-full bg-[var(--surface-muted)]"><div className="h-2 rounded-full bg-[var(--teal)]" style={{ width: `${v}%` }} /></div></div>; }
export function ProofCard({ label, hash }: { label: string; hash: string }) { return <Card className="p-4"><div className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">{label}</div><div className="mt-1 font-mono text-sm text-[var(--ink)]">{hash.slice(0, 10)}…{hash.slice(-6)}</div></Card>; }
export function AllocationDonut({ percent }: { percent: number }) { const p = Math.max(0, Math.min(100, percent)); return <div className="grid h-28 w-28 place-items-center rounded-full" style={{ background: `conic-gradient(var(--teal) ${p}%, var(--surface-muted) 0)` }}><div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--surface)] font-display">{p}%</div></div>; }
export function AssetIcon({ symbol }: { symbol: string }) { return <span className={cn("inline-grid h-9 w-9 place-items-center rounded-full bg-[var(--teal-wash)] text-xs font-semibold text-[var(--teal)]")}><CircleDollarSign size={16} />{symbol.slice(0, 1)}</span>; }
