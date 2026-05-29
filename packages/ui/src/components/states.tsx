import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { Button, Skeleton } from "../primitives";

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) { return <div className="grid place-items-center rounded-[var(--radius-card)] border border-dashed border-[var(--border)] p-8 text-center"><Inbox className="mb-3 text-[var(--text-secondary)]" /><div className="font-medium">{title}</div>{action && <div className="mt-4">{action}</div>}</div>; }
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) { return <div className="rounded-[var(--radius-card)] border border-[var(--rose)]/30 bg-[var(--rose-wash)] p-5"><div className="flex items-center gap-2 text-[var(--rose)]"><AlertTriangle size={18} />{message}</div>{onRetry && <Button className="mt-4" variant="secondary" onClick={onRetry}>Retry</Button>}</div>; }
export function StateWrapper({ status, children, onRetry }: { status: "loading" | "empty" | "error" | "populated" | "stale"; children: ReactNode; onRetry?: () => void }) {
  if (status === "loading") return <div className="space-y-3"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-24 w-full" /></div>;
  if (status === "empty") return <EmptyState title="Nothing here yet" />;
  if (status === "error") return <ErrorState message="Could not load this data." onRetry={onRetry} />;
  return <div data-stale={status === "stale"}>{children}{status === "stale" && <p className="mt-2 text-xs text-[var(--amber)]">Data may be stale.</p>}</div>;
}
