import { Button, Card, CardContent, CardHeader, CardTitle, RiskRadar, StateWrapper } from "@auralis/ui";
import { UsdyRatingActions } from "../../../../../components/UsdyRatingActions";
import { getRatingWithAI } from "../../../../../lib/api";

export default async function AssetDetail({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const rating = await getRatingWithAI(assetId);
  const values = rating ? Object.values(rating.dimensionScores) : [28,35,42,24,18,31,45];
  return <div>
    <h1 className="font-display text-4xl">{(rating?.symbol ?? assetId).toUpperCase()}</h1>
    <p className="mt-2 text-[var(--text-secondary)]">{rating?.name ?? "Opportunity detail"}</p>
    <Card className="mt-6"><CardHeader><CardTitle>Risk profile</CardTitle></CardHeader><CardContent><StateWrapper status={rating ? "populated" : "empty"}><RiskRadar values={values} /><div className="mt-6 grid gap-3 text-sm md:grid-cols-4"><Metric label="Grade" value={rating?.grade ?? "NR"}/><Metric label="Risk score" value={String(rating?.riskScore ?? "—")}/><Metric label="Risk-adjusted APY" value={`${rating?.riskAdjustedApy ?? "—"}%`}/><Metric label="TVL" value={rating ? `$${rating.tvlUsd.toLocaleString()}` : "—"}/></div><div className="mt-6 flex flex-wrap gap-3"><Button>Add to simulator</Button><Button variant="secondary">Set exposure cap</Button><Button variant="secondary">Run eligibility check</Button></div></StateWrapper></CardContent></Card>
    {rating?.symbol === "USDY" && <UsdyRatingActions rating={rating} />}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[10px] bg-[var(--surface-muted)] p-3"><div className="text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">{label}</div><div className="mt-1 font-display text-xl">{value}</div></div>;
}
