import { getAllAssets } from "@auralis/adapters";
import { rateAsset } from "@auralis/core";
import { assertRateLimit, json } from "../../../../lib/api";

// Metadata the dashboard needs to read + value on-chain balances. Risk fields
// come from the same deterministic engine the ratings use.
export async function GET(req: Request) {
  const limited = await assertRateLimit(req);
  if (limited) return limited;
  const assets = await getAllAssets();
  const items = assets.map((a) => {
    const det = rateAsset({ ...a, ...a.rawRiskSignals }, 0);
    return {
      assetId: a.assetId,
      symbol: a.symbol,
      name: a.name,
      assetClass: a.assetClass,
      address: a.address,
      price: a.price,
      nominalApy: a.nominalApy,
      riskAdjustedApy: det.riskAdjustedApy,
      riskScore: det.riskScore,
      grade: det.grade,
      liquidityDepthUsd: a.rawRiskSignals.liquidityDepthUsd,
    };
  });
  return json({ assets: items });
}
