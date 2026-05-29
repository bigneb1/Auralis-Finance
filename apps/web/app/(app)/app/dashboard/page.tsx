"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { ArrowRight, Plus, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Button, Card, KpiStat, RatingSeal, Skeleton, StateWrapper, StatusPill } from "@auralis/ui";
import { Donut, LineChart, AssetIcon } from "../../../../components/marketing";
import { publicClient } from "../../../../lib/contracts";

const erc20Abi = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
] as const;

// Asset classes that are realistically same-day redeemable.
const LIQUID_CLASSES = new Set(["US_TREASURY_RWA", "SYNTH_DOLLAR", "REGULATED_YIELD", "LST"]);

type AssetMeta = { assetId: string; symbol: string; name: string; assetClass: string; address: `0x${string}`; price: number; nominalApy: number; riskAdjustedApy: number; riskScore: number; grade: string; liquidityDepthUsd: number };
type Position = { symbol: string; name: string; assetClass: string; grade: string; amount: number; value: number; apy: number; riskScore: number };
type PortfolioState = { status: "loading" | "live" | "demo" | "error"; total: number; apy: number; risk: number; liquidity: number; positions: Position[] };

// ---- Sample (demo) data — only shown behind the "Demo portfolio" badge ----
const samplePositions = [
  { symbol: "USDY", name: "Ondo US Dollar Yield", source: "Ondo Finance", value: "$7.72M", weight: 42, apy: "4.85%", grade: "A", band: "Low" },
  { symbol: "mETH", name: "Mantle Staked Ether", source: "Mantle LSP", value: "$5.71M", weight: 31, apy: "3.15%", grade: "AA", band: "Low" },
  { symbol: "USDe", name: "Ethena USDe", source: "Ethena", value: "$4.99M", weight: 27, apy: "8.40%", grade: "BBB", band: "Medium" },
];
const sampleDecisions: { action: string; sub: string; outcome: string; tone: "amber" | "emerald" | "teal" | "neutral" }[] = [
  { action: "Rebalance simulated", sub: "USDY → mETH · 18m ago", outcome: "Simulated", tone: "amber" },
  { action: "Compliance attestation", sub: "US_TREASURY_RWA · 1h ago", outcome: "Executed", tone: "emerald" },
  { action: "Policy update", sub: "Max slippage lowered · 4h ago", outcome: "Logged", tone: "teal" },
];

function band(score: number) { return score <= 40 ? "Low" : score <= 55 ? "Medium" : "High"; }
function usd(n: number) { return n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(2)}`; }

export default function Dashboard() {
  const router = useRouter();
  const { address, status } = useAccount();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (status === "connecting" || status === "reconnecting") return;
    if (!address) { router.replace("/app"); return; }
    void fetch(`/api/users/${address}`).then((res) => res.json()).then(({ user }) => {
      if (user?.onboardingDone) setAllowed(true);
      else router.replace("/app");
    }).catch(() => router.replace("/app"));
  }, [address, status, router]);

  const [pf, setPf] = useState<PortfolioState>({ status: "loading", total: 0, apy: 0, risk: 0, liquidity: 0, positions: [] });

  const loadPortfolio = useCallback(async () => {
    if (!address) return;
    setPf((p) => ({ ...p, status: "loading" }));
    try {
      const { assets } = (await fetch("/api/portfolio/assets").then((r) => r.json())) as { assets: AssetMeta[] };
      const positions: Position[] = [];
      for (const a of assets) {
        try {
          const [bal, dec] = await Promise.all([
            publicClient.readContract({ address: a.address, abi: erc20Abi, functionName: "balanceOf", args: [address] }) as Promise<bigint>,
            publicClient.readContract({ address: a.address, abi: erc20Abi, functionName: "decimals" }).then((d) => Number(d)).catch(() => 18),
          ]);
          const amount = Number(formatUnits(bal, dec));
          if (amount > 0) positions.push({ symbol: a.symbol, name: a.name, assetClass: a.assetClass, grade: a.grade, amount, value: amount * a.price, apy: a.riskAdjustedApy, riskScore: a.riskScore });
        } catch { /* asset token not a live contract for this wallet — treat as 0 */ }
      }
      const total = positions.reduce((s, p) => s + p.value, 0);
      console.log("[dashboard] on-chain scan:", positions.length, "rated holdings, total $", total.toFixed(2));
      if (positions.length === 0 || total <= 0) { setPf({ status: "demo", total: 0, apy: 0, risk: 0, liquidity: 0, positions: [] }); return; }
      const apy = positions.reduce((s, p) => s + p.apy * p.value, 0) / total;
      const risk = positions.reduce((s, p) => s + p.riskScore * p.value, 0) / total;
      const liquidity = positions.filter((p) => LIQUID_CLASSES.has(p.assetClass)).reduce((s, p) => s + p.value, 0);
      setPf({ status: "live", total, apy, risk, liquidity, positions: positions.sort((a, b) => b.value - a.value) });
    } catch {
      setPf((p) => ({ ...p, status: "error" }));
    }
  }, [address]);

  useEffect(() => {
    if (!allowed || !address) return;
    const id = window.setTimeout(() => void loadPortfolio(), 0);
    return () => window.clearTimeout(id);
  }, [allowed, address, loadPortfolio]);

  if (!allowed) return <StateWrapper status="loading"><div className="min-h-[320px]" /></StateWrapper>;

  const live = pf.status === "live";
  const loading = pf.status === "loading";
  const isDemo = pf.status === "demo" || pf.status === "error";

  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[32px] font-normal tracking-[-0.01em]">Portfolio Dashboard</h1>
          {loading ? <StatusPill status="pending">Scanning wallet…</StatusPill>
            : live ? <StatusPill status="operational">Live · Mantle Mainnet</StatusPill>
            : <StatusPill tone="amber">Demo portfolio</StatusPill>}
        </div>
        <p className="mt-1 text-[var(--text-secondary)]">{live ? "Your live RWA & DeFi allocations, read from Mantle." : "Monitor your risk-aware RWA and DeFi allocations on Mantle."}</p>
        {isDemo && <p className="mt-1 text-sm text-[var(--amber)]">Sample data — connect a wallet with RWA holdings to see your live portfolio.</p>}
      </div>
      <div className="flex gap-3">
        <Link href="/app/compliance"><Button variant="secondary"><ShieldCheck size={14} />Run scan</Button></Link>
        <Link href="/app/simulator"><Button><SlidersHorizontal size={14} />Open simulator</Button></Link>
      </div>
    </div>

    {/* KPIs */}
    {loading ? <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Card key={i} className="p-5"><Skeleton className="h-4 w-28" /><Skeleton className="mt-3 h-8 w-28" /></Card>)}</div>
      : live ? <div className="grid gap-4 md:grid-cols-4">
          <KpiStat label="Total portfolio value" value={usd(pf.total)} />
          <KpiStat label="Blended APY" value={`${pf.apy.toFixed(2)}%`} />
          <KpiStat label="Auralis risk score" value={`${Math.round(pf.risk)}`} />
          <KpiStat label="Same-day liquidity" value={usd(pf.liquidity)} />
        </div>
      : <div className="grid gap-4 md:grid-cols-4">
          <KpiStat label="Total portfolio value" value="$18.42M" delta="+6.27%" />
          <KpiStat label="Blended APY" value="9.18%" delta="+0.73%" />
          <KpiStat label="Auralis risk score" value="42" delta="Low risk" />
          <KpiStat label="Available liquidity" value="$1.78M" />
        </div>}

    {/* Live layout: real allocation + holdings */}
    {live && <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
      <Card>
        <div className="mb-4 flex items-center justify-between"><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Allocation</div><StatusPill status="operational">{pf.positions.length} {pf.positions.length === 1 ? "asset" : "assets"}</StatusPill></div>
        <div className="flex h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">{pf.positions.map((p, i) => <span key={p.symbol} style={{ width: `${(p.value / pf.total) * 100}%`, background: ["#0E9E8C", "#1F58A8", "#8C97A8", "#B08442", "#0F9D58"][i % 5] }} />)}</div>
        <div className="mt-4 grid gap-2">{pf.positions.map((p, i) => <div key={p.symbol} className="flex justify-between text-sm"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm" style={{ background: ["#0E9E8C", "#1F58A8", "#8C97A8", "#B08442", "#0F9D58"][i % 5] }} />{p.symbol}</span><span className="font-mono">{usd(p.value)} <span className="text-[var(--text-secondary)]">· {((p.value / pf.total) * 100).toFixed(0)}%</span></span></div>)}</div>
      </Card>
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-5"><div><div className="font-medium">Positions</div><div className="mt-1 text-xs text-[var(--text-secondary)]">{pf.positions.length} on-chain holdings · live from Mantle</div></div><Link href="/app/opportunities"><Button size="sm" variant="secondary"><Plus size={14} />Add position</Button></Link></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase tracking-wide text-[var(--text-secondary)]"><tr><th className="p-4">Asset</th><th className="p-4">Balance</th><th className="p-4">Value</th><th className="p-4">APY</th><th className="p-4">Rating</th><th className="p-4">Risk</th></tr></thead><tbody>{pf.positions.map((p) => <tr key={p.symbol} className="border-t border-[var(--border)] hover:bg-[var(--teal-wash)]"><td className="p-4"><div className="flex items-center gap-3"><AssetIcon symbol={p.symbol} /><div><div className="font-medium">{p.name}</div><div className="text-xs text-[var(--text-secondary)]">{p.symbol}</div></div></div></td><td className="p-4 font-mono">{p.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td><td className="p-4"><div className="font-mono">{usd(p.value)}</div><div className="text-xs text-[var(--text-secondary)]">{((p.value / pf.total) * 100).toFixed(0)}%</div></td><td className="p-4 font-mono">{p.apy.toFixed(2)}%</td><td className="p-4"><RatingSeal grade={p.grade} size="sm" /></td><td className="p-4"><StatusPill tone={band(p.riskScore) === "Low" ? "emerald" : band(p.riskScore) === "Medium" ? "amber" : "rose"}>{band(p.riskScore)}</StatusPill></td></tr>)}</tbody></table></div>
      </Card>
    </div>}

    {live && <Card className="text-sm text-[var(--text-secondary)]">Performance history and AI recommendations populate as you transact through Auralis. <Link href="/app/decisions" className="text-[var(--teal)]">View your on-chain decisions →</Link></Card>}

    {/* Demo layout: the sample portfolio (clearly badged above) */}
    {isDemo && <>
      <div className="grid gap-4 xl:grid-cols-[1.05fr_1.35fr_1.1fr]">
        <Card><div className="mb-4 flex items-center justify-between"><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Allocation</div><StatusPill tone="amber">Sample</StatusPill></div><Donut /><div className="mt-5 grid gap-2">{[["DeFi", 46, "#0E9E8C", "$8.47M"], ["RWA", 32, "#1F58A8", "$5.89M"], ["Stablecoins", 22, "#8C97A8", "$4.06M"]].map(([l, p, c, v]) => <div key={String(l)} className="flex justify-between text-sm"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-sm" style={{ background: String(c) }} />{l}</span><span className="font-mono">{v} <span className="text-[var(--text-secondary)]">· {p}%</span></span></div>)}</div></Card>
        <Card><div className="mb-3 flex items-start justify-between"><div><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Performance</div><div className="mt-1 flex items-center gap-2"><span className="font-display text-2xl">+6.27%</span><StatusPill tone="amber">Sample · 30D</StatusPill></div></div></div><LineChart /></Card>
        <Card className="border-transparent bg-[var(--teal-wash)]"><div className="flex items-center justify-between"><div className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)]">AI Recommendation</div><StatusPill tone="amber">Sample</StatusPill></div><div className="mt-4 font-display text-xl leading-snug">Increase allocation to supervised RWA credit.</div><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">An illustrative recommendation. Connect a wallet with holdings and run the simulator for guidance on your real positions.</p><div className="mt-5"><Link href="/app/simulator"><Button size="sm">Open simulator <ArrowRight size={14} /></Button></Link></div></Card>
      </div>
      <Card className="p-0"><div className="flex items-center justify-between border-b border-[var(--border)] p-5"><div><div className="font-medium">Positions</div><div className="mt-1 text-xs text-[var(--text-secondary)]">Sample portfolio · not your holdings</div></div><Link href="/app/opportunities"><Button size="sm" variant="secondary"><Plus size={14} />Add position</Button></Link></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase tracking-wide text-[var(--text-secondary)]"><tr><th className="p-4">Asset</th><th className="p-4">Source</th><th className="p-4">Value</th><th className="p-4">APY</th><th className="p-4">Rating</th><th className="p-4">Risk</th></tr></thead><tbody>{samplePositions.map((p) => <tr key={p.symbol} className="border-t border-[var(--border)] hover:bg-[var(--teal-wash)]"><td className="p-4"><div className="flex items-center gap-3"><AssetIcon symbol={p.symbol} /><div><div className="font-medium">{p.name}</div><div className="text-xs text-[var(--text-secondary)]">{p.symbol}</div></div></div></td><td className="p-4 text-[var(--text-secondary)]">{p.source}</td><td className="p-4"><div className="font-mono">{p.value}</div><div className="text-xs text-[var(--text-secondary)]">{p.weight}%</div></td><td className="p-4 font-mono">{p.apy}</td><td className="p-4"><RatingSeal grade={p.grade} size="sm" /></td><td className="p-4"><StatusPill tone={p.band === "Low" ? "emerald" : "amber"}>{p.band}</StatusPill></td></tr>)}</tbody></table></div></Card>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card><div className="mb-4 flex items-center justify-between"><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Recent decisions</div><div className="flex items-center gap-2"><StatusPill tone="amber">Sample</StatusPill><Link href="/app/decisions" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--teal)]">View all <ArrowRight size={12} /></Link></div></div>{sampleDecisions.map((d) => <div key={d.action} className="flex items-center justify-between border-t border-[var(--border)] py-3"><div><div className="text-sm font-medium">{d.action}</div><div className="mt-1 text-xs text-[var(--text-secondary)]">{d.sub}</div></div><StatusPill tone={d.tone}>{d.outcome}</StatusPill></div>)}</Card>
        <Card><div className="mb-4 flex items-center justify-between"><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">System status</div><StatusPill status="operational">All systems operational</StatusPill></div>{["Rating engine", "Compliance engine", "Mantle RPC", "Price oracles", "On-chain logger"].map((s) => <div key={s} className="flex justify-between py-2 text-sm"><span>{s}</span><StatusPill status="operational">OK</StatusPill></div>)}</Card>
      </div>
    </>}
  </div>;
}
