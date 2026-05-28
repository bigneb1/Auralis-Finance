"use client";

import { useMemo, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button, Card, StatusPill } from "@auralis/ui";
import { addresses, ratingRegistryAbi } from "../lib/contracts";
import { explorerTxUrl } from "../lib/deployments";
import { gradeCode, hashCanonical, idHash } from "../lib/proof";

type Rating = { assetId: string; symbol: string; name: string; assetClass: string; grade: string; riskScore: number; dimensionScores: Record<string, number>; nominalApy: number; riskAdjustedApy: number; tvlUsd: number; methodologyVersion: number; updatedAt: string; ratingHash: string; ratingJson?: unknown; txHash?: string; metadataUri?: string };

function canonicalRatingPayload(rating: Rating) {
  return {
    assetId: rating.assetId,
    symbol: rating.symbol,
    name: rating.name,
    assetClass: rating.assetClass,
    grade: rating.grade,
    riskScore: rating.riskScore,
    dimensionScores: rating.dimensionScores,
    nominalApy: rating.nominalApy,
    riskAdjustedApy: rating.riskAdjustedApy,
    tvlUsd: rating.tvlUsd,
    methodologyVersion: rating.methodologyVersion,
    updatedAt: rating.updatedAt,
  };
}

export function UsdyRatingActions({ rating }: { rating: Rating }) {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(rating.txHash as `0x${string}` | undefined);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [persisted, setPersisted] = useState(Boolean(rating.txHash));
  const { writeContractAsync, isPending } = useWriteContract();
  const assetIdHash = useMemo(() => idHash(rating.symbol === "USDY" ? "USDY" : rating.assetId), [rating.assetId, rating.symbol]);
  const canonicalPayload = useMemo(() => canonicalRatingPayload(rating), [rating]);
  const canonicalHash = useMemo(() => hashCanonical(canonicalPayload), [canonicalPayload]);
  const { data: onchainMatch, refetch } = useReadContract({ address: addresses.ratingRegistry, abi: ratingRegistryAbi, functionName: "verifyRating", args: [assetIdHash, canonicalHash], query: { enabled: verifyOpen } });
  const receipt = useWaitForTransactionReceipt({ hash: txHash, query: { enabled: Boolean(txHash) } });

  async function anchor() {
    const hash = await writeContractAsync({ address: addresses.ratingRegistry, abi: ratingRegistryAbi, functionName: "anchorRating", args: [assetIdHash, canonicalHash, gradeCode(rating.grade), Math.round(rating.riskScore), rating.methodologyVersion, "ipfs://pending/usdy-rating"] });
    setTxHash(hash);
    await fetch(`/api/ratings/${rating.assetId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ txHash: hash, metadataUri: "ipfs://pending/usdy-rating", ratingJson: canonicalPayload, ratingHash: canonicalHash, methodologyVersion: rating.methodologyVersion }) });
    setPersisted(true);
  }

  const confirmed = receipt.status === "success";
  return <Card className="mt-6 space-y-4">
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">USDY on-chain rating proof</div><p className="mt-2 text-sm text-[var(--text-secondary)]">Anchor and verify the canonical deterministic USDY rating with a connected wallet on Mantle.</p></div><div className="flex flex-wrap gap-2"><StatusPill status={persisted ? "operational" : "pending"}>{persisted ? "Tx persisted" : "Not anchored here yet"}</StatusPill>{confirmed && <StatusPill status="operational">Confirmed</StatusPill>}</div></div>
    <div className="grid gap-2 text-sm"><div>Canonical hash: <code className="break-all font-mono">{canonicalHash}</code></div><div>Asset ID hash: <code className="break-all font-mono">{assetIdHash}</code></div>{txHash && <div>Tx: <a className="break-all font-mono text-[var(--teal)]" href={explorerTxUrl(txHash)} target="_blank" rel="noreferrer">{txHash}</a></div>}</div>
    <div className="flex flex-wrap gap-2"><Button onClick={anchor} disabled={!address || isPending}>{isPending ? "Open wallet…" : "Anchor USDY rating"}</Button><Button variant="secondary" onClick={async()=>{setVerifyOpen(true); await refetch();}}>Verify this rating</Button></div>
    {verifyOpen && <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">On-chain verifyRating result: <span className={onchainMatch ? "text-[var(--emerald)]" : "text-[var(--rose)]"}>{onchainMatch ? "MATCH" : "MISMATCH / not latest"}</span></div>}
  </Card>;
}
