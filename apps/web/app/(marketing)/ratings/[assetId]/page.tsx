import Link from "next/link";
import { notFound } from "next/navigation";
import { getRatingWithAI, getRatings } from "../../../../lib/api";
import { Card, CardContent, CardHeader, CardTitle, RatingSeal, RiskRadar } from "@auralis/ui";
import { AIProvenance } from "../../../../components/AIProvenance";
import { UsdyRatingActions } from "../../../../components/UsdyRatingActions";

export async function generateStaticParams() {
  const ratings = await getRatings();
  return ratings.map((rating) => ({ assetId: rating.assetId }));
}

export default async function PublicRatingDetail({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  const rating = await getRatingWithAI(decodeURIComponent(assetId));
  if (!rating) notFound();
  const values = Object.values(rating.dimensionScores);
  const chainRating = rating as typeof rating & { txHash?: string };
  return <main className="mx-auto max-w-6xl px-4 py-16">
    <Link href="/ratings" className="text-sm text-[var(--teal)]">← Back to ratings</Link>
    <section className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <p className="text-sm font-medium text-[var(--teal)]">Public Auralis rating</p>
        <h1 className="mt-2 font-display text-5xl">{rating.symbol} · {rating.name}</h1>
        <p className="mt-4 max-w-3xl text-[var(--text-secondary)]">{rating.rationale}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Risk score" value={String(rating.riskScore)} />
          <Metric label="Risk-adjusted APY" value={`${rating.riskAdjustedApy}%`} />
          <Metric label="Methodology" value={`v${rating.methodologyVersion}`} />
        </div>
      </div>
      <Card><CardHeader><CardTitle>Rating seal</CardTitle></CardHeader><CardContent className="grid place-items-center gap-5"><RatingSeal grade={rating.grade} size="lg"/><RiskRadar values={values}/></CardContent></Card>
    </section>
    <section className="mt-8 grid gap-4 md:grid-cols-2">
      {Object.entries(rating.dimensionScores).map(([key, score]) => <Card key={key}><CardContent className="p-4"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-normal capitalize tracking-[-0.01em]">{key.replace(/([A-Z])/g, " $1")}</h2><span className="font-display text-2xl">{score}</span></div><p className="mt-2 text-sm text-[var(--text-secondary)]">Risk contribution from the {key.replace(/([A-Z])/g, " $1").toLowerCase()} dimension.</p></CardContent></Card>)}
    </section>
    <Card className="mt-8"><CardHeader><CardTitle>Verifiable proof</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>Rating hash: <code className="break-all font-mono">{rating.ratingHash}</code></p>{chainRating.txHash && <p>Anchored tx: <a className="break-all font-mono text-[var(--teal)]" href={`https://explorer.mantle.xyz/tx/${chainRating.txHash}`} target="_blank" rel="noreferrer">{chainRating.txHash}</a></p>}<p>Verify through <code className="break-all font-mono">AuralisRatingRegistry.verifyRating(assetId, ratingHash)</code> on Mantle mainnet.</p><p className="text-[var(--text-secondary)]">Counterfactual: {rating.counterfactual}</p><AIProvenance provenance={rating.aiProvenance}/></CardContent></Card>
    {rating.symbol === "USDY" && <UsdyRatingActions rating={chainRating} />}
  </main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-4"><div className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{label}</div><div className="mt-1 font-display text-2xl">{value}</div></CardContent></Card>;
}
