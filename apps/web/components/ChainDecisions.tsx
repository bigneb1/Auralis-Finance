"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { useAccount } from "wagmi";
import { parseAbiItem, type Address, type Hex } from "viem";
import { Button, Card, ConfidenceMeter, ProofCard, StateWrapper, StatusPill } from "@auralis/ui";
import { addresses, publicClient } from "../lib/contracts";
import { explorerTxUrl } from "../lib/deployments";

type Row = { id: string; action: string; sub: string; assets: string[]; confidence: number; policy: "Pass" | "Warn" | "Block"; tx: Hex; block: bigint; outcome: "Anchored" | "Attested" | "Logged" | "Executed" | "Rejected"; reasoning: string };

const ratingAnchored = parseAbiItem("event RatingAnchored(bytes32 indexed assetId, bytes32 indexed ratingHash, uint8 grade, uint8 riskScore, address indexed submitter, bool official, string metadataURI)");
const attestationMinted = parseAbiItem("event AttestationMinted(uint256 indexed id, address indexed subject, bytes32 indexed assetClassId, uint8 verdict, address attester, uint64 validUntil, string metadataURI)");
const decisionLogged = parseAbiItem("event DecisionLogged(uint256 indexed decisionId, bytes32 indexed decisionHash, address indexed agent, bytes32 actionType, uint8 riskScore)");
const rebalanceExecuted = parseAbiItem("event RebalanceExecuted(uint256 indexed id, address indexed user, bytes32 portfolioHash, uint256 notionalValue, string metadataURI)");
const rebalanceBlocked = parseAbiItem("event RebalanceBlocked(address indexed user, string reason)");

export function ChainDecisions() {
  const { address } = useAccount();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter,setFilter]=useState("All");
  const filtered = useMemo(() => filter === "All" ? rows : rows.filter((r) => r.outcome === filter), [filter, rows]);
  const [sel,setSel]=useState<Row | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      setLoading(true); setError(null);
      try {
        const latest = await publicClient.getBlockNumber();
        const fallbackFrom = latest > 2_000_000n ? latest - 2_000_000n : 0n;
        const fromBlock = process.env.NEXT_PUBLIC_AURALIS_FROM_BLOCK ? BigInt(process.env.NEXT_PUBLIC_AURALIS_FROM_BLOCK) : fallbackFrom;
        const wallet = address as Address;
        const [rating, attest, decision, executed, blocked] = await Promise.all([
          publicClient.getLogs({ address: addresses.ratingRegistry, event: ratingAnchored, args: { submitter: wallet }, fromBlock, toBlock: "latest" }),
          publicClient.getLogs({ address: addresses.complianceAttestor, event: attestationMinted, args: { subject: wallet }, fromBlock, toBlock: "latest" }),
          publicClient.getLogs({ address: addresses.ratingRegistry, event: decisionLogged, args: { agent: wallet }, fromBlock, toBlock: "latest" }),
          publicClient.getLogs({ address: addresses.policyGuard, event: rebalanceExecuted, args: { user: wallet }, fromBlock, toBlock: "latest" }),
          publicClient.getLogs({ address: addresses.policyGuard, event: rebalanceBlocked, args: { user: wallet }, fromBlock, toBlock: "latest" }),
        ]);
        const next: Row[] = [
          ...rating.map((log) => ({ id: `rating-${log.transactionHash}-${log.logIndex}`, action: "USDY rating anchored", sub: `Risk score ${log.args.riskScore}; ${log.args.official ? "official" : "wallet-signed"} anchor`, assets: ["USDY"], confidence: 100 - Number(log.args.riskScore ?? 0), policy: "Pass" as const, tx: log.transactionHash, block: log.blockNumber, outcome: "Anchored" as const, reasoning: "A connected wallet anchored the deterministic USDY rating hash to AuralisRatingRegistry." })),
          ...attest.map((log) => ({ id: `attest-${log.transactionHash}-${log.logIndex}`, action: "Compliance attestation minted", sub: `Verdict code ${log.args.verdict}; valid until ${new Date(Number(log.args.validUntil ?? 0n) * 1000).toLocaleDateString()}`, assets: ["USDY", "US_TREASURY_RWA"], confidence: 94, policy: Number(log.args.verdict) === 1 ? "Pass" as const : "Warn" as const, tx: log.transactionHash, block: log.blockNumber, outcome: "Attested" as const, reasoning: "The connected wallet minted a compliance eligibility attestation for USDY's asset class." })),
          ...decision.map((log) => ({ id: `decision-${log.transactionHash}-${log.logIndex}`, action: "Decision logged", sub: `Risk score ${log.args.riskScore}`, assets: ["USDY"], confidence: 100 - Number(log.args.riskScore ?? 0), policy: "Pass" as const, tx: log.transactionHash, block: log.blockNumber, outcome: "Logged" as const, reasoning: "Auralis committed an AI-produced decision hash on Mantle via AuralisRatingRegistry.logDecision." })),
          ...executed.map((log) => ({ id: `rebalance-${log.transactionHash}-${log.logIndex}`, action: "USDY rebalance executed", sub: `Notional ${formatToken(Number(log.args.notionalValue ?? 0n))}`, assets: ["USDY", "mETH", "USDe"], confidence: 82, policy: "Pass" as const, tx: log.transactionHash, block: log.blockNumber, outcome: "Executed" as const, reasoning: "A user-signed tryExecuteRebalance passed AuralisPolicyGuard and emitted RebalanceExecuted." })),
          ...blocked.map((log) => ({ id: `blocked-${log.transactionHash}-${log.logIndex}`, action: "Rebalance blocked", sub: log.args.reason ?? "Guardrail failed", assets: ["USDY"], confidence: 0, policy: "Block" as const, tx: log.transactionHash, block: log.blockNumber, outcome: "Rejected" as const, reasoning: `AuralisPolicyGuard blocked the signed proposal: ${log.args.reason ?? "unknown reason"}.` })),
        ].sort((a, b) => Number(b.block - a.block));
        if (!cancelled) { setRows(next); setSel(next[0] ?? null); }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load chain events");
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [address, reloadKey]);

  const counts = ["All","Anchored","Attested","Logged","Executed","Rejected"].map((x) => [x, x === "All" ? rows.length : rows.filter((r) => r.outcome === x).length] as const);
  return <div className="space-y-5"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h1 className="font-display text-[32px] font-normal tracking-[-0.01em]">Decisions</h1><p className="mt-1 text-[var(--text-secondary)]">Live Mantle events for the connected wallet. No mock rows.</p></div><Button variant="secondary"><FileText size={14}/>Export CSV</Button></div>
    {!address ? <Card>Connect a wallet to load USDY proof events.</Card> : <StateWrapper status={loading ? "loading" : rows.length ? "populated" : "empty"}>{error && <Card className="border-[var(--rose)]"><div className="text-[var(--rose)]">{error}</div><Button variant="secondary" size="sm" className="mt-3" onClick={()=>setReloadKey(k=>k+1)}>Retry</Button></Card>}<div className="grid gap-3 md:grid-cols-6">{counts.map(([x,n])=><button key={x} onClick={()=>setFilter(x)} className={`rounded-[var(--radius-card)] border p-4 text-left shadow-[var(--shadow-soft)] transition ${filter===x?'border-[var(--teal)] bg-[var(--teal-wash)]':'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]'}`}><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{x==='All'?'All events':x}</div><div className="mt-2 font-display text-3xl">{n}</div></button>)}</div><section className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_380px]"><Card className="min-w-0 p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase tracking-wide text-[var(--text-secondary)]"><tr><th className="p-4">Action</th><th className="p-4">Assets</th><th className="p-4">Confidence</th><th className="p-4">Policy</th><th className="p-4">Tx hash</th><th className="p-4">Block</th><th className="p-4">Outcome</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id} onClick={()=>setSel(r)} className="cursor-pointer border-t border-[var(--border)] hover:bg-[var(--teal-wash)]"><td className="p-4"><div className="font-medium">{r.action}</div><div className="mt-1 text-xs text-[var(--text-secondary)]">{r.sub}</div></td><td className="p-4"><div className="flex gap-1">{r.assets.map(a=><span key={a} className="rounded-full bg-[var(--surface-muted)] px-2 py-1 font-mono text-xs">{a}</span>)}</div></td><td className="min-w-36 p-4"><ConfidenceMeter value={r.confidence}/></td><td className="p-4"><StatusPill tone={r.policy==='Pass'?'emerald':r.policy==='Warn'?'amber':'rose'}>{r.policy}</StatusPill></td><td className="p-4"><a onClick={e=>e.stopPropagation()} href={explorerTxUrl(r.tx)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-[var(--teal)]">{truncate(r.tx)}<ExternalLink size={12}/></a></td><td className="p-4 text-[var(--text-secondary)]">{String(r.block)}</td><td className="p-4"><StatusPill tone={r.outcome==='Rejected'?'rose':r.outcome==='Anchored'?'teal':'emerald'}>{r.outcome}</StatusPill></td></tr>)}</tbody></table></div></Card>{sel && <Card className="self-start space-y-4"><div><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Decision detail</div><h2 className="font-display text-2xl">{sel.action}</h2></div><p className="text-sm text-[var(--text-secondary)]">{sel.sub} · {sel.assets.join(' + ')}</p><ConfidenceMeter value={sel.confidence}/><div><div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Reasoning summary</div><p className="text-sm leading-6">{sel.reasoning}</p></div><ProofCard label="Mantle transaction" hash={sel.tx}/><a className="inline-flex items-center gap-2 text-sm text-[var(--teal)]" href={explorerTxUrl(sel.tx)} target="_blank" rel="noreferrer">Open in Mantle Explorer <ExternalLink size={14}/></a></Card>}</section></StateWrapper>}</div>;
}

function truncate(x:string){return `${x.slice(0,8)}…${x.slice(-6)}`}
function formatToken(value: number){ return value ? `$${(value / 1e18).toLocaleString()}` : "$0"; }
