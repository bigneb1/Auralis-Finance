import { z } from "zod";
import { keccak256, stringToHex } from "viem";
import type { AIProvenance, AssetRating, EligibilityResult, Policy, Portfolio, RebalanceProposal } from "@auralis/types";
import { stableJson } from "../rating/engine";
import { callJsonModel } from "./router";

const memoryCache = new Map<string, CacheRecord>();
const hash = (v: unknown) => keccak256(stringToHex(typeof v === "string" ? v : stableJson(v)));

export const RatingExplanationSchema = z.object({
  rationale: z.string().min(40).max(900),
  counterfactual: z.string().min(20).max(500),
});
export const CopilotSchema = z.object({
  summary: z.string().min(20).max(900),
  actions: z.array(z.string().min(1).max(240)).max(6).default([]),
  outcome: z.string().min(3).max(500),
  reasoningFactors: z.array(z.string().min(1).max(240)).max(8).default([]),
  caveats: z.array(z.string().min(1).max(240)).max(6).default([]),
});

const CacheRecordSchema = z.object({
  result: z.unknown(),
  modelId: z.string(),
  promptHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  responseHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  generatedAt: z.string().datetime(),
});
type CacheRecord = z.infer<typeof CacheRecordSchema>;

type StructuredOptions = { cacheBasis?: string; prompt: string };

async function structured<T>(key: string, input: unknown, schema: z.ZodType<T>, fallback: T, options: StructuredOptions): Promise<{ result: T; provenance: AIProvenance }> {
  const inputHash = hash(input);
  const promptHash = hash(options.prompt);
  const cacheKey = `v2:${key}:${options.cacheBasis ?? inputHash}`;
  const cached = await getCached(cacheKey, schema);
  if (cached) return { result: cached.result, provenance: prov(cached.modelId, input, cached.promptHash as `0x${string}`, cached.responseHash as `0x${string}`, true, cached.generatedAt) };

  let result = fallback;
  let modelId = "offline/template";
  try {
    const response = await callJsonModel(options.prompt);
    modelId = response.modelId;
    result = response.modelId === "offline/template" ? schema.parse(fallback) : schema.parse(extractJson(response.text));
  } catch {
    result = schema.parse(fallback);
  }

  const parsed = schema.parse(result);
  const responseHash = hash(parsed);
  const generatedAt = new Date().toISOString();
  await setCached(cacheKey, key, { result: parsed, modelId, promptHash, responseHash, generatedAt });
  return { result: parsed, provenance: prov(modelId, input, promptHash, responseHash, false, generatedAt) };
}

function prov(modelId: string, input: unknown, promptHash: `0x${string}`, responseHash: `0x${string}`, cached: boolean, generatedAt: string): AIProvenance {
  return { modelId, methodologyVersion: 100, inputVector: input as Record<string, unknown>, promptHash, responseHash, cached, generatedAt };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced ?? trimmed;
  try { return JSON.parse(candidate); } catch {}
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
  throw new Error("Model response did not contain JSON");
}

async function getCached<T>(cacheKey: string, schema: z.ZodType<T>): Promise<{ result: T } & Omit<CacheRecord, "result"> | null> {
  const memory = memoryCache.get(cacheKey);
  if (memory) return parseCacheRecord(memory, schema);
  const persistent = await getPersistentCache(cacheKey).catch(() => null);
  if (!persistent) return null;
  memoryCache.set(cacheKey, persistent);
  return parseCacheRecord(persistent, schema);
}

function parseCacheRecord<T>(record: CacheRecord, schema: z.ZodType<T>): ({ result: T } & Omit<CacheRecord, "result">) | null {
  const parsed = CacheRecordSchema.safeParse(record);
  if (!parsed.success) return null;
  const result = schema.safeParse(parsed.data.result);
  if (!result.success) return null;
  return { ...parsed.data, result: result.data };
}

async function setCached(cacheKey: string, task: string, record: CacheRecord) {
  memoryCache.set(cacheKey, record);
  await setPersistentCache(cacheKey, task, record).catch(() => undefined);
}

async function getPersistentCache(cacheKey: string): Promise<CacheRecord | null> {
  const upstash = await upstashGet(cacheKey);
  if (upstash) return upstash;
  return supabaseGet(cacheKey);
}
async function setPersistentCache(cacheKey: string, task: string, record: CacheRecord) {
  await Promise.allSettled([upstashSet(cacheKey, record), supabaseSet(cacheKey, task, record)]);
}

async function upstashGet(cacheKey: string): Promise<CacheRecord | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url}/get/${encodeURIComponent(cacheKey)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const body = await res.json() as { result?: string | null };
  return body.result ? CacheRecordSchema.parse(JSON.parse(body.result)) : null;
}
async function upstashSet(cacheKey: string, record: CacheRecord) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  await fetch(`${url}/set/${encodeURIComponent(cacheKey)}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(JSON.stringify(record)) });
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}
async function supabaseGet(cacheKey: string): Promise<CacheRecord | null> {
  const config = supabaseConfig();
  if (!config) return null;
  const res = await fetch(`${config.url}/rest/v1/ai_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=response_json,model_id,prompt_hash,response_hash,created_at&limit=1`, { headers: { apikey: config.key, Authorization: `Bearer ${config.key}` } });
  if (!res.ok) return null;
  const rows = await res.json() as { response_json: unknown; model_id: string; prompt_hash: string; response_hash: string; created_at: string }[];
  const row = rows[0];
  return row ? CacheRecordSchema.parse({ result: row.response_json, modelId: row.model_id, promptHash: row.prompt_hash, responseHash: row.response_hash, generatedAt: row.created_at }) : null;
}
async function supabaseSet(cacheKey: string, task: string, record: CacheRecord) {
  const config = supabaseConfig();
  if (!config) return;
  await fetch(`${config.url}/rest/v1/ai_cache?on_conflict=cache_key`, {
    method: "POST",
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ cache_key: cacheKey, task, prompt_hash: record.promptHash, response_hash: record.responseHash, response_json: record.result, model_id: record.modelId, created_at: record.generatedAt }),
  });
}

// AI never produces a score, grade, or verdict — deterministic engines decide.
export function parseRatingExplanation(value: unknown) { return RatingExplanationSchema.parse(value); }

export function explainRating(assetRating: AssetRating | Omit<AssetRating, "rationale" | "counterfactual">) {
  const prompt = [
    "You are Auralis Finance's rating explainer. Return ONLY JSON with keys rationale and counterfactual.",
    "Write a 2-3 sentence rationale for the deterministic rating. Do not change score, grade, or methodology.",
    "Counterfactual must describe what would have to worsen for the rating to fall.",
    stableJson(assetRating),
  ].join("\n");
  return structured("explainRating", assetRating, RatingExplanationSchema, { rationale: `${assetRating.symbol} is rated ${assetRating.grade} because deterministic methodology v${assetRating.methodologyVersion} balances its risk score of ${assetRating.riskScore} against liquidity, issuer, peg, oracle, contract, and concentration signals. The model explanation is unavailable, so this fallback preserves the audited score while summarizing the strongest known drivers.`, counterfactual: "Rating would weaken if liquidity, peg stability, oracle freshness, issuer proof quality, contract controls, or concentration metrics deteriorate materially." }, { cacheBasis: assetRating.ratingHash, prompt });
}

export function explainEligibility(result: EligibilityResult) {
  return structured("explainEligibility", result, z.object({ summary: z.string(), reasons: z.array(z.string()) }), { summary: `${result.verdict}: ${result.reasons.join(" ")}`, reasons: result.reasons }, { prompt: `Return JSON explaining this eligibility result: ${stableJson(result)}` });
}

export function proposeRebalance(portfolio: Portfolio, ratings: AssetRating[], policy: Policy) {
  const proposal: RebalanceProposal = { proposalId: `proposal:${portfolio.wallet}`, wallet: portfolio.wallet, portfolioHash: hash({ portfolio, ratings, policy }), fromPositions: portfolio.positions, toPositions: portfolio.positions, expectedApyDelta: 0, expectedRiskDelta: 0, estimatedSlippageBps: 0, aiConfidence: 75, rationale: "Current portfolio is within policy; no autonomous execution is proposed.", createdAt: "1970-01-01T00:00:00.000Z" };
  return structured("proposeRebalance", { portfolio, ratings, policy }, z.object({ proposal: z.custom<RebalanceProposal>(), reasoning: z.string() }), { proposal, reasoning: proposal.rationale }, { prompt: `Return JSON with proposal and reasoning. Do not invent execution. ${stableJson({ portfolio, ratings, policy })}` });
}

export function copilotAnswer(question: string, context: Record<string, unknown>) {
  const input = { question, context };
  const prompt = [
    "You are Auralis Finance's policy-aware copilot. Return ONLY compact JSON matching this TypeScript shape:",
    "{ summary: string; actions: string[]; outcome: string; reasoningFactors: string[]; caveats: string[] }",
    "Be specific to the user question and context. Do not give legal/financial advice. Do not claim to execute transactions. If asked compliance, answer from supplied context and recommend a fresh scan when wallet data is absent.",
    stableJson(input),
  ].join("\n");
  return structured("copilotAnswer", input, CopilotSchema, { summary: `I could not reach live ELFA inference, but Auralis can still reason from deterministic context for: ${question}`, actions: ["Run or refresh the compliance scan before relying on eligibility", "Review policy limits before changing allocations"], outcome: "No autonomous action was taken; user-signed review is required.", reasoningFactors: Object.keys(context).length ? Object.keys(context) : ["question", "available context"], caveats: ["Fallback response; verify against live compliance and portfolio data", "Informational only, not legal or financial advice"] }, { prompt });
}
