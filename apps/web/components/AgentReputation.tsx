"use client";

import { useCallback, useEffect, useState } from "react";
import { parseAbiItem } from "viem";
import { Button, Card, Skeleton } from "@auralis/ui";
import { CountUp } from "./MotionPrimitives";
import { addresses, publicClient } from "../lib/contracts";

const ratingAnchored = parseAbiItem("event RatingAnchored(bytes32 indexed assetId, bytes32 indexed ratingHash, uint8 grade, uint8 riskScore, address indexed submitter, bool official, string metadataURI)");
const attestationMinted = parseAbiItem("event AttestationMinted(uint256 indexed id, address indexed subject, bytes32 indexed assetClassId, uint8 verdict, address attester, uint64 validUntil, string metadataURI)");
const decisionLogged = parseAbiItem("event DecisionLogged(uint256 indexed decisionId, bytes32 indexed decisionHash, address indexed agent, bytes32 actionType, uint8 riskScore)");

type Counts = { ratings: number; attestations: number; decisions: number };

export function AgentReputation() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [status, setStatus] = useState<"loading" | "populated" | "error">("loading");

  const load = useCallback(async () => {
    setStatus((s) => (s === "populated" ? "populated" : "loading"));
    try {
      const latest = await publicClient.getBlockNumber();
      const fromBlock = latest > 2_000_000n ? latest - 2_000_000n : 0n;
      const [ratings, attestations, decisions] = await Promise.all([
        publicClient.getLogs({ address: addresses.ratingRegistry, event: ratingAnchored, fromBlock, toBlock: "latest" }),
        publicClient.getLogs({ address: addresses.complianceAttestor, event: attestationMinted, fromBlock, toBlock: "latest" }),
        publicClient.getLogs({ address: addresses.ratingRegistry, event: decisionLogged, fromBlock, toBlock: "latest" }),
      ]);
      setCounts({ ratings: ratings.length, attestations: attestations.length, decisions: decisions.length });
      setStatus("populated");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Defer to avoid setState-synchronously-in-effect (load() sets status).
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const tiles: [string, number | undefined][] = [
    ["Ratings anchored", counts?.ratings],
    ["Attestations minted", counts?.attestations],
    ["Decisions logged", counts?.decisions],
  ];

  if (status === "error") {
    return <Card className="p-5"><div className="text-sm text-[var(--rose)]">Could not load on-chain reputation.</div><Button className="mt-3" variant="secondary" size="sm" onClick={() => void load()}>Retry</Button></Card>;
  }

  return <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
    {tiles.map(([label, value]) => <Card key={label} className="p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{label}</div>
      {status === "loading" || value === undefined
        ? <Skeleton className="mt-2 h-8 w-16" />
        : <div className="mt-2 font-display text-3xl"><CountUp value={String(value)} /></div>}
    </Card>)}
    <p className="text-[11px] text-[var(--text-secondary)] xl:mt-1">Live counts from Mantle mainnet · last ~2M blocks.</p>
  </div>;
}
