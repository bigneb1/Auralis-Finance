import { ExternalLink } from "lucide-react";
import { StatusPill } from "@auralis/ui";
import { mantleDeployment, explorerAddressUrl } from "../lib/deployments";

/** The four contracts actually deployed on Mantle mainnet (chainId 5000). */
export const deployedContracts = [
  { key: "ratingRegistry", label: "Rating Registry", address: mantleDeployment.contracts.ratingRegistry },
  { key: "complianceAttestor", label: "Compliance Attestor", address: mantleDeployment.contracts.complianceAttestor },
  { key: "policyGuard", label: "Policy Guard", address: mantleDeployment.contracts.policyGuard },
  { key: "agentRegistry", label: "Agent Registry", address: mantleDeployment.contracts.agentRegistry },
] as const;

function shortAddr(a: string) { return `${a.slice(0, 6)}…${a.slice(-4)}`; }

/** Small pill marking whether a rating is anchored on-chain or a precomputed off-chain preview. */
export function AnchorBadge({ anchored, className = "" }: { anchored: boolean; className?: string }) {
  return <span className={className}>
    <StatusPill tone={anchored ? "teal" : "neutral"}>{anchored ? "On-chain · Mantle" : "Off-chain preview"}</StatusPill>
  </span>;
}

/** Full card listing the deployed contracts with Mantle Explorer links. */
export function ContractsCard({ title = "Deployed contracts · Mantle mainnet" }: { title?: string }) {
  return <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{title}</div>
      <StatusPill tone="teal">chainId 5000</StatusPill>
    </div>
    <div className="mt-4 grid gap-2">
      {deployedContracts.map((c) => <a key={c.key} href={explorerAddressUrl(c.address)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 transition hover:border-[var(--teal)] hover:bg-[var(--teal-wash)]">
        <span className="text-sm font-medium">{c.label}</span>
        <span className="inline-flex items-center gap-1 font-mono text-xs text-[var(--teal)]">{shortAddr(c.address)}<ExternalLink size={12} /></span>
      </a>)}
    </div>
  </div>;
}

/** Compact footer strip of contract links. */
export function ContractsFooterStrip({ light = false }: { light?: boolean }) {
  const base = light ? "text-white/55 hover:text-white" : "text-[var(--text-secondary)] hover:text-[var(--ink)]";
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
    <span className={light ? "font-semibold text-white/70" : "font-semibold text-[var(--text-secondary)]"}>Mantle contracts:</span>
    {deployedContracts.map((c) => <a key={c.key} href={explorerAddressUrl(c.address)} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 font-mono ${base}`}>{c.label} {shortAddr(c.address)}<ExternalLink size={11} /></a>)}
  </div>;
}
