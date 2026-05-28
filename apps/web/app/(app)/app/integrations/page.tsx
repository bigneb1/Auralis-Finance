"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, StateWrapper, StatusPill } from "@auralis/ui";

type Status = "operational" | "degraded" | "not_configured";
type Health = {
  ok: boolean;
  environment: { network: string; chainId: number; rpc: string; explorer: string };
  security: { nonCustodial: boolean; serverKey: boolean; userSignedTransactionsOnly: boolean };
  system: { label: string; status: Status; detail: string }[];
  services: { id: string; label: string; status: Status; detail: string; checkedAt: string }[];
  time: string;
};

const pillStatus: Record<Status, "operational" | "degraded" | "pending"> = {
  operational: "operational",
  degraded: "degraded",
  not_configured: "pending",
};

export default function IntegrationsPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [status, setStatus] = useState<"loading" | "populated" | "error" | "stale">("loading");
  const [intervalMinutes, setIntervalMinutes] = useState(15);

  const load = useCallback(async (nextStatus: typeof status = "populated") => {
    try {
      setStatus((current) => current === "populated" ? "stale" : "loading");
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      setHealth((await res.json()) as Health);
      setStatus(nextStatus);
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load("populated"), 0);
    return () => window.clearTimeout(id);
  }, [load]);
  useEffect(() => {
    const id = window.setInterval(() => void load("populated"), Math.max(15, intervalMinutes) * 60_000);
    return () => window.clearInterval(id);
  }, [intervalMinutes, load]);

  const orderedServices = useMemo(() => health?.services ?? [], [health]);

  return <div className="space-y-6">
    <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--teal)]">Operational status</p>
        <h1 className="mt-3 font-display text-4xl text-[var(--ink)]">Integrations</h1>
        <p className="mt-2 max-w-3xl text-[var(--text-secondary)]">Live operational view for Auralis dependencies. Statuses are driven by <code>/api/health</code>, not hard-coded UI labels.</p>
      </div>
      <Button variant="secondary" onClick={() => load("populated")}>Refresh now</Button>
    </section>

    <StateWrapper status={status} onRetry={() => load("populated")}>
      {health && <div className="grid gap-5 xl:grid-cols-[1.4fr_.9fr]">
        <Card>
          <CardHeader><CardTitle>Connected services</CardTitle></CardHeader>
          <CardContent><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{orderedServices.map((service) => <article key={service.id} className="rounded-xl border border-[var(--border)] p-4">
            <div className="flex items-start justify-between gap-3"><h2 className="font-medium">{service.label}</h2><StatusPill status={pillStatus[service.status]}>{service.status.replace("_", " ")}</StatusPill></div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{service.detail}</p>
            <p className="mt-3 text-xs text-[var(--text-secondary)]">Checked {new Date(service.checkedAt).toLocaleString()}</p>
          </article>)}</div></CardContent>
        </Card>

        <div className="space-y-5">
          <Card><CardHeader><CardTitle>Environment</CardTitle></CardHeader><CardContent><dl className="grid gap-3 text-sm">
            <Row label="Network" value={health.environment.network} />
            <Row label="Chain ID" value={String(health.environment.chainId)} />
            <Row label="RPC" value={health.environment.rpc} />
            <Row label="Explorer" value={health.environment.explorer} />
          </dl></CardContent></Card>

          <Card><CardHeader><CardTitle>System health</CardTitle></CardHeader><CardContent><ul className="space-y-3">{health.system.map((item) => <li key={item.label} className="rounded-xl border border-[var(--border)] p-3">
            <div className="flex items-center justify-between gap-3"><span className="font-medium">{item.label}</span><StatusPill status={pillStatus[item.status]}>{item.status.replace("_", " ")}</StatusPill></div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.detail}</p>
          </li>)}</ul></CardContent></Card>

          <Card><CardHeader><CardTitle>Security controls</CardTitle></CardHeader><CardContent><ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li>✅ Non-custodial confirmed: {health.security.nonCustodial ? "yes" : "no"}</li>
            <li>✅ Server private key: {health.security.serverKey ? "present" : "none"}</li>
            <li>✅ Chain writes require user signatures: {health.security.userSignedTransactionsOnly ? "yes" : "no"}</li>
          </ul></CardContent></Card>

          <Card><CardHeader><CardTitle>Refresh interval</CardTitle></CardHeader><CardContent><label className="grid gap-2 text-sm"><span>Minutes between background refreshes (minimum 15)</span><input type="number" min={15} value={intervalMinutes} onChange={(event) => setIntervalMinutes(Math.max(15, Number(event.target.value) || 15))} className="h-10 rounded-[10px] border border-[var(--border)] px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)]" /></label></CardContent></Card>
        </div>
      </div>}
    </StateWrapper>
  </div>;
}

function Row({ label, value }: { label: string; value: string }) { return <div className="grid gap-1"><dt className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{label}</dt><dd className="break-all font-mono text-[var(--ink)]">{value}</dd></div>; }
