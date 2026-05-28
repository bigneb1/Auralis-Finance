import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, RiskRadar, StateWrapper } from "@auralis/ui";
import { UsdyRatingActions } from "../../../../../components/UsdyRatingActions";
import { AnchorBadge } from "../../../../../components/onchain";
import { getRatingWithAI } from "../../../../../lib/api";

export default async function AssetDetail({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const rating = await getRatingWithAI(assetId);
  const anchored = rating?.symbol === "USDY";
  const values = rating ? Object.values(rating.dimensionScores) : [28,35,42,24,18,31,45];
  return <div>
    <div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-4xl">{(rating?.symbol ?? assetId).toUpperCase()}</h1>{rating && <AnchorBadge anchored={anchored} />}</div>
    <p className="mt-2 text-[var(--text-secondary)]">{rating?.name ?? "Opportunity detail"}</p>
    <Card className="mt-6"><CardHeader><CardTitle>Risk profile</CardTitle></CardHeader><CardContent><StateWrapper status={rating ? "populated" : "empty"}><RiskRadar values={values} /><div className="mt-6 grid gap-3 text-sm md:grid-cols-4"><Metric label="Grade" value={rating?.grade ?? "NR"}/><Metric label="Risk score" value={String(rating?.riskScore ?? "—")}/><Metric label="Risk-adjusted APY" value={`${rating?.riskAdjustedApy ?? "—"}%`}/><Metric label="TVL" value={rating ? `$${rating.tvlUsd.toLocaleString()}` : "—"}/></div><div className="mt-6 flex flex-wrap gap-3"><Link href="/app/simulator"><Button>Add to simulator</Button></Link><Link href="/app/policies"><Button variant="secondary">Set exposure cap</Button></Link><Link href="/app/compliance"><Button variant="secondary">Run eligibility check</Button></Link></div>{!anchored && <p className="mt-4 text-xs text-[var(--text-secondary)]">This rating is a precomputed off-chain preview from the Auralis rating engine. Only USDY is anchored on-chain today.</p>}</StateWrapper></CardContent></Card>
    {rating?.symbol === "USDY" && <UsdyRatingActions rating={rating} />}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[10px] bg-[var(--surface-muted)] p-3"><div className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">{label}</div><div className="mt-1 font-display text-xl">{value}</div></div>;
}
