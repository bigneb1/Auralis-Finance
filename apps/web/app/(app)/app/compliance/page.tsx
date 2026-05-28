"use client";

import { useMemo, useState } from "react";
import type { ComplianceReport, EligibilityResult, Verdict } from "@auralis/types";
import { Button, Card, CardContent, CardHeader, CardTitle, ConfidenceMeter, EligibilityChip, EmptyState, ErrorState, ProofCard, Skeleton, StateWrapper, StatusPill } from "@auralis/ui";
import { TxButton } from "../../../../components/TxButton";

const assetRows = [
  { classId: "US_TREASURY_RWA", label: "US Treasury RWA", example: "USDY" },
  { classId: "REGULATED_YIELD", label: "Regulated Yield", example: "Aave / vaults" },
  { classId: "SYNTH_DOLLAR", label: "Synthetic Dollar", example: "USDe" },
  { classId: "LST", label: "Liquid Staking", example: "mETH / cmETH" },
  { classId: "INDEX_RWA", label: "RWA Index", example: "MI4" },
] as const;
const tabs = ["Wallet Scan", "Eligibility Matrix", "Compliance Report", "Attestations"] as const;
type Tab = typeof tabs[number];
type UiState = "idle" | "loading" | "populated" | "empty" | "error" | "stale";

const demoWallet = "0x1111111111111111111111111111111111111111";
const stateLabels: Record<UiState, string> = { idle: "Not checked", loading: "Scanning", populated: "Current", empty: "No report", error: "Error", stale: "Stale" };

function verdictTone(verdict: Verdict) {
  return verdict === "ELIGIBLE" ? "border-[var(--emerald)]/30 bg-emerald-50" : verdict === "DENIED" ? "border-[var(--rose)]/30 bg-red-50" : verdict === "RESTRICTED" ? "border-[var(--amber)]/30 bg-yellow-50" : "border-[var(--border)] bg-[var(--surface-muted)]";
}

export default function CompliancePage() {
  const [tab, setTab] = useState<Tab>("Wallet Scan");
  const [wallet, setWallet] = useState(demoWallet);
  const [jurisdiction, setJurisdiction] = useState("NG");
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [status, setStatus] = useState<UiState>("idle");
  const [selected, setSelected] = useState<EligibilityResult | null>(null);
  const [flagsOpen, setFlagsOpen] = useState(true);
  const [mintOpen, setMintOpen] = useState(false);
  const [exported, setExported] = useState(false);
  const [attestations, setAttestations] = useState([{ assetClass: "US_TREASURY_RWA", verdict: "ELIGIBLE" as Verdict, validUntil: "2026-06-25T00:00:00.000Z", proof: `0x${"a".repeat(64)}`, txHash: "" }]);

  const resultsByClass = useMemo(() => new Map(report?.results.map((r) => [r.assetClass, r]) ?? []), [report]);
  const risks = useMemo(() => {
    if (!report) return [];
    const base = [report.walletScreen.sanctionsHit ? "Sanctions match detected" : "No sanctions hit", `Risk exposure score ${report.walletScreen.riskExposureScore}/100`, `Jurisdiction ${report.walletScreen.jurisdiction}`];
    return base.concat(report.results.filter((r) => r.verdict !== "ELIGIBLE").map((r) => `${r.assetClass}: ${r.verdict}`));
  }, [report]);

  async function runScan(stale = false) {
    setStatus("loading");
    setSelected(null);
    try {
      const res = await fetch("/api/compliance/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wallet, jurisdiction }) });
      if (!res.ok) throw new Error(await res.text());
      const next = await res.json() as ComplianceReport;
      setReport(next);
      setStatus(stale ? "stale" : next.results.length ? "populated" : "empty");
      setTab("Eligibility Matrix");
    } catch {
      setStatus("error");
    }
  }

  function exportReport() {
    setExported(true);
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auralis-compliance-${wallet.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function mintAttestation() {
    const first = report?.results.find((r) => r.verdict !== "NOT_CHECKED") ?? selected;
    if (!first || !report) return;
    setAttestations((rows) => [{ assetClass: first.assetClass, verdict: first.verdict, validUntil: first.validUntil ?? "2026-06-25T00:00:00.000Z", proof: report.reportHash, txHash: "pending-user-signature" }, ...rows]);
    setMintOpen(false);
    setTab("Attestations");
  }

  return <div className="mx-auto max-w-7xl space-y-6">
    <div className="rounded-[var(--radius-card)] border border-[var(--amber)]/30 bg-yellow-50 p-4 text-sm text-[var(--ink)]">Auralis provides compliance tooling and risk information, not legal advice.</div>
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--teal)]">Eligibility workflow</p><h1 className="mt-3 font-display text-4xl">Compliance & Eligibility Agent</h1><p className="mt-2 text-[var(--text-secondary)]">Scan a wallet, map eligibility by asset class, export the compliance report, then mint a user-signed attestation.</p></div><div className="flex flex-wrap gap-2">{Object.entries(stateLabels).map(([key,label])=><StatusPill key={key} status={status===key ? "operational" : "pending"}>{label}</StatusPill>)}</div></div>
    <div className="flex flex-wrap gap-2 border-b border-[var(--border)]">{tabs.map((t)=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-3 text-sm font-medium ${tab===t ? "border-b-2 border-[var(--teal)] text-[var(--teal)]" : "text-[var(--text-secondary)]"}`}>{t}</button>)}</div>

    {tab === "Wallet Scan" && <StateWrapper status={status === "idle" ? "populated" : status === "loading" ? "loading" : status === "error" ? "error" : status === "stale" ? "stale" : "populated"}><section className="grid gap-4 lg:grid-cols-[1fr_.9fr]">
      <Card><CardHeader><CardTitle>Run / Re-scan wallet</CardTitle></CardHeader><CardContent className="space-y-4"><label className="grid gap-1 text-sm">Wallet<input value={wallet} onChange={(e)=>setWallet(e.target.value)} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 font-mono" /></label><label className="grid gap-1 text-sm">Declared jurisdiction<input value={jurisdiction} onChange={(e)=>setJurisdiction(e.target.value.toUpperCase())} className="rounded-lg border border-[var(--border)] bg-white px-3 py-2" maxLength={8} /></label><div className="flex gap-2"><Button onClick={()=>runScan(false)} disabled={status==="loading"}>{status==="loading"?"Scanning…":"Run scan"}</Button><Button variant="secondary" onClick={()=>runScan(true)}>Mark stale re-scan</Button><Button variant="ghost" onClick={()=>{setReport(null);setStatus("empty");}}>Empty state</Button></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Screen summary</CardTitle></CardHeader><CardContent>{status==="loading" && <div className="space-y-3"><Skeleton className="h-8 w-2/3"/><Skeleton className="h-28 w-full"/></div>}{status==="error" && <ErrorState message="Scan failed. Check wallet format or API route." onRetry={()=>runScan(false)} />}{status==="empty" && <EmptyState title="No report generated yet" action={<Button onClick={()=>runScan(false)}>Run first scan</Button>} />}{(status==="idle" && !report) && <EmptyState title="Ready to run a wallet screen" />}{report && status!=="loading" && <div className="space-y-4"><div className="grid gap-3 md:grid-cols-3"><Metric label="Sanctions" value={report.walletScreen.sanctionsHit?"Hit":"Clear"}/><Metric label="Exposure" value={`${report.walletScreen.riskExposureScore}/100`}/><Metric label="Jurisdiction" value={report.walletScreen.jurisdiction}/></div><button className="text-sm text-[var(--teal)]" onClick={()=>setFlagsOpen(!flagsOpen)}>{flagsOpen?"Hide":"Expand"} risk-flag list</button>{flagsOpen && <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">{risks.map((risk)=><li key={risk}>{risk}</li>)}</ul>}{status==="stale" && <p className="text-xs text-[var(--amber)]">This report is marked stale; re-scan before minting.</p>}</div>}</CardContent></Card>
    </section></StateWrapper>}

    {tab === "Eligibility Matrix" && <StateWrapper status={report ? "populated" : "empty"}><section className="grid gap-4 lg:grid-cols-[1fr_360px]"><Card><CardHeader><CardTitle>RWAs × {jurisdiction || "Jurisdiction"}</CardTitle></CardHeader><CardContent>{!report ? <EmptyState title="Run a scan to populate the matrix" action={<Button onClick={()=>setTab("Wallet Scan")}>Go to scan</Button>} /> : <div className="overflow-hidden rounded-xl border border-[var(--border)]"><table className="w-full text-sm"><thead className="bg-[var(--surface-muted)] text-left"><tr><th className="p-3">Asset class</th><th className="p-3">Example</th><th className="p-3">Verdict</th><th className="p-3">Confidence</th></tr></thead><tbody>{assetRows.map((row)=>{const result=resultsByClass.get(row.classId as EligibilityResult["assetClass"]) ?? { wallet, assetClass: row.classId as EligibilityResult["assetClass"], verdict: "NOT_CHECKED" as Verdict, reasons: ["No scan result for this class yet."], confidence: 0}; return <tr key={row.classId} onClick={()=>setSelected(result)} className="cursor-pointer border-t border-[var(--border)] hover:bg-[var(--teal-wash)]"><td className="p-3 font-medium">{row.label}</td><td className="p-3 text-[var(--text-secondary)]">{row.example}</td><td className="p-3"><EligibilityChip verdict={result.verdict}/></td><td className="p-3">{result.confidence}%</td></tr>})}</tbody></table></div>}</CardContent></Card><SidePanel result={selected} /></section></StateWrapper>}

    {tab === "Compliance Report" && <StateWrapper status={report ? "populated" : "empty"}><section className="grid gap-4 lg:grid-cols-[1fr_340px]"><Card><CardHeader><CardTitle>Exportable report</CardTitle></CardHeader><CardContent>{!report ? <EmptyState title="No report to export" action={<Button onClick={()=>setTab("Wallet Scan")}>Run scan</Button>} /> : <div className="space-y-4"><div className="grid gap-3 md:grid-cols-4"><Metric label="Report" value={report.reportId.slice(0,18)+"…"}/><Metric label="Methodology" value={`v${report.methodologyVersion}`}/><Metric label="Generated" value={new Date(report.generatedAt).toLocaleDateString()}/><Metric label="Jurisdiction" value={report.walletScreen.jurisdiction}/></div><div className="grid gap-2">{report.results.map((r)=><div key={r.assetClass} className={`rounded-xl border p-3 ${verdictTone(r.verdict)}`}><div className="flex items-center justify-between"><span className="font-medium">{r.assetClass}</span><EligibilityChip verdict={r.verdict}/></div><p className="mt-2 text-sm text-[var(--text-secondary)]">{r.reasons.join(" ")}</p></div>)}</div></div>}</CardContent></Card><Card><CardHeader><CardTitle>Actions</CardTitle></CardHeader><CardContent className="space-y-3"><Button className="w-full" disabled={!report} onClick={exportReport}>Export PDF</Button><Button className="w-full" disabled={!report} onClick={()=>setMintOpen(true)}>Mint attestation</Button>{exported && <p className="text-xs text-[var(--emerald)]">Export generated as JSON report artifact for this build step.</p>}{report && <ProofCard label="Report hash" hash={report.reportHash}/>}</CardContent></Card></section></StateWrapper>}

    {tab === "Attestations" && <StateWrapper status={attestations.length ? "populated" : "empty"}><section className="space-y-4"><div className="flex justify-between"><h2 className="font-display text-2xl">Attestation history</h2><Button onClick={()=>setMintOpen(true)} disabled={!report}>Mint new attestation</Button></div><Card><CardContent className="pt-5"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-[var(--text-secondary)]"><th className="p-3">Asset class</th><th className="p-3">Verdict</th><th className="p-3">Valid until</th><th className="p-3">Proof</th><th className="p-3">Explorer</th><th className="p-3">Action</th></tr></thead><tbody>{attestations.map((a,i)=><tr key={`${a.assetClass}-${i}`} className="border-t border-[var(--border)]"><td className="p-3 font-medium">{a.assetClass}</td><td className="p-3"><EligibilityChip verdict={a.verdict}/></td><td className="p-3">{new Date(a.validUntil).toLocaleDateString()}</td><td className="p-3 font-mono">{a.proof.slice(0,10)}…</td><td className="p-3">{a.txHash && a.txHash.startsWith("0x") ? <a className="text-[var(--teal)]" href={`https://explorer.mantle.xyz/tx/${a.txHash}`}>Open</a> : <span className="text-[var(--text-secondary)]">Pending</span>}</td><td className="p-3"><Button size="sm" variant="secondary">Revoke</Button></td></tr>)}</tbody></table></div></CardContent></Card></section></StateWrapper>}

    {mintOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"><Card className="w-full max-w-lg"><CardHeader><CardTitle>Mint compliance attestation</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-[var(--text-secondary)]">This opens the user-signed attestation flow. The full TxButton → toast → explorer lifecycle is active; the user signs before anything is submitted.</p><div className="rounded-xl bg-[var(--surface-muted)] p-3 text-sm">Contract: AuralisComplianceAttestor.mintAttestation<br/>Network: Mantle Mainnet · chainId 5000.</div><div className="flex justify-end gap-2"><Button variant="secondary" onClick={()=>setMintOpen(false)}>Cancel</Button><TxButton intent="mintAttestation" onConfirmed={mintAttestation}>Mint attestation</TxButton></div></CardContent></Card></div>}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3"><div className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{label}</div><div className="mt-1 font-medium">{value}</div></div>; }
function SidePanel({ result }: { result: EligibilityResult | null }) { return <Card><CardHeader><CardTitle>Cell detail</CardTitle></CardHeader><CardContent>{!result ? <EmptyState title="Click a matrix cell"/> : <div className="space-y-4"><EligibilityChip verdict={result.verdict}/><div><div className="text-sm text-[var(--text-secondary)]">Asset class</div><div className="font-medium">{result.assetClass}</div></div><ConfidenceMeter value={result.confidence}/><div><div className="text-sm font-medium">Cited reasons</div><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">{result.reasons.map((reason)=><li key={reason}>{reason}</li>)}</ul></div>{result.validUntil && <Metric label="Valid until" value={new Date(result.validUntil).toLocaleDateString()} />}</div>}</CardContent></Card>; }
