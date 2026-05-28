import { z } from "zod";
import { getAllAssets } from "@auralis/adapters";
import { explainRating, rateAsset, stableJson } from "@auralis/core";
import { cacheGet, cacheSet, rateLimit } from "./cache";
import { getServerDb } from "./db";
import { keccak256, stringToHex } from "viem";
import type { AssetRating, Decision, Portfolio, Position } from "@auralis/types";

export const WalletSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
export const HashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
export const JurisdictionSchema = z.string().min(2).max(8).default("NG");
export const json = (body: unknown, init?: ResponseInit) => Response.json(body, init);
export const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" };
export const withCors = (body: unknown, init?: ResponseInit) => Response.json(body, { ...init, headers: { ...cors, ...(init?.headers ?? {}) } });
export function options() { return new Response(null, { status: 204, headers: cors }); }
export async function assertRateLimit(req: Request, wallet = "anon") {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const hit = await rateLimit(`${ip}:${wallet}`, 90, 60);
  if (!hit.ok) return json({ error: "rate_limited", ...hit }, { status: 429 });
  return null;
}

function toRateable(asset: Awaited<ReturnType<typeof getAllAssets>>[number]) {
  return { ...asset, ...asset.rawRiskSignals };
}
export async function getRatings(): Promise<AssetRating[]> {
  const cached = await cacheGet<AssetRating[]>("ratings:all:v1");
  if (cached) return cached;
  const ratings = (await getAllAssets()).map((asset) => {
    const deterministic = rateAsset(toRateable(asset), 0);
    return { ...deterministic, rationale: `${asset.symbol} scored by Auralis methodology v${deterministic.methodologyVersion}.`, counterfactual: "Rating can weaken if liquidity, peg, oracle freshness, or issuer proof quality deteriorates." };
  });
  await cacheSet("ratings:all:v1", ratings, 900);
  return ratings;
}
export async function getRating(assetId: string) { return (await getRatings()).find((r) => r.assetId === assetId || r.assetId.split(":").pop() === assetId.toLowerCase() || r.symbol.toLowerCase() === assetId.toLowerCase()); }
export async function getRatingWithAI(assetId: string) {
  const rating = await getRating(assetId);
  if (!rating) return null;
  const ai = await explainRating(rating);
  const db = getServerDb();
  let chain: Record<string, unknown> = {};
  if (db) {
    const { data } = await db.from("ratings").select("tx_hash,metadata_uri,anchored_at").eq("asset_id", rating.assetId).maybeSingle();
    if (data) chain = { txHash: data.tx_hash, metadataUri: data.metadata_uri, anchoredAt: data.anchored_at };
  }
  return { ...rating, ...chain, ratingJson: rating, rationale: ai.result.rationale, counterfactual: ai.result.counterfactual, aiProvenance: ai.provenance };
}
export async function persist(table: string, row: Record<string, unknown>) {
  const db = getServerDb();
  if (!db) return { stored: false, reason: "db_not_configured" };
  const { error } = await db.from(table).upsert(row);
  return error ? { stored: false, error: error.message } : { stored: true };
}
export function buildPortfolio(wallet: string, ratings: AssetRating[]): Portfolio {
  const selected = ratings.slice(0, 3);
  const total = 10000;
  const positions: Position[] = selected.map((r, i) => ({ assetId: r.assetId, symbol: r.symbol, name: r.name, balance: [4200, 3100, 2700][i] ?? 0, valueUsd: [4200, 3100, 2700][i] ?? 0, weightBps: [4200, 3100, 2700][i] ?? 0, apy: r.riskAdjustedApy, grade: r.grade, riskScore: r.riskScore }));
  return { wallet, totalValueUsd: total, blendedApy: Number((positions.reduce((s, p) => s + p.apy * p.weightBps, 0) / 10000).toFixed(2)), blendedRiskScore: Number((positions.reduce((s, p) => s + p.riskScore * p.weightBps, 0) / 10000).toFixed(2)), positions, updatedAt: new Date(0).toISOString() };
}
export const decisionHash = (value: unknown) => keccak256(stringToHex(stableJson(value)));
export function mockDecisions(wallet: string): Decision[] { return [{ decisionId: `decision:${wallet}:0`, wallet, actionType: "SCAN", decisionHash: decisionHash({ wallet, actionType: "SCAN" }), riskScore: 31, policyResult: "PASS", metadataUri: "ipfs://pending/decision", createdAt: new Date(0).toISOString() }]; }
