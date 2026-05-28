import { z } from "zod";
import { getServerDb } from "../../../../lib/db";
import { json, WalletSchema } from "../../../../lib/api";

const Params = z.object({ wallet: WalletSchema });
const PatchBody = z.object({
  walletAddress: WalletSchema.optional(),
  chainId: z.number().int().positive().optional(),
  jurisdiction: z.string().min(2).max(8).optional(),
  riskProfile: z.string().min(1).optional(),
  mode: z.string().min(1).optional(),
  liquidity: z.string().min(1).optional(),
  maxDrawdown: z.string().min(1).optional(),
  onboardingDone: z.boolean().optional(),
  displayName: z.string().min(1).optional(),
  appearance: z.string().min(1).optional(),
  notifications: z.record(z.string(), z.boolean()).optional(),
});

function normalize(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    walletAddress: row.wallet_address,
    chainId: row.chain_id,
    jurisdiction: row.jurisdiction,
    riskProfile: row.risk_profile,
    mode: row.mode,
    liquidity: row.liquidity,
    maxDrawdown: row.max_drawdown,
    onboardingDone: row.onboarding_done,
    displayName: row.display_name,
    appearance: row.appearance,
    notifications: row.notifications,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  const parsed = Params.safeParse(await params);
  if (!parsed.success) return json({ error: "invalid_wallet" }, { status: 400 });
  const db = getServerDb();
  if (!db) return json({ user: null, storage: { stored: false, reason: "db_not_configured" } });
  const { data, error } = await db.from("users").select("*").eq("wallet_address", parsed.data.wallet).maybeSingle();
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ user: normalize(data) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  const parsed = Params.safeParse(await params);
  if (!parsed.success) return json({ error: "invalid_wallet" }, { status: 400 });
  const body = PatchBody.parse(await req.json());
  const db = getServerDb();
  if (!db) return json({ user: null, storage: { stored: false, reason: "db_not_configured" } });
  const row = {
    wallet_address: body.walletAddress ?? parsed.data.wallet,
    chain_id: body.chainId,
    jurisdiction: body.jurisdiction,
    risk_profile: body.riskProfile,
    mode: body.mode,
    liquidity: body.liquidity,
    max_drawdown: body.maxDrawdown,
    onboarding_done: body.onboardingDone,
    display_name: body.displayName,
    appearance: body.appearance,
    notifications: body.notifications,
    updated_at: new Date().toISOString(),
  };
  const clean = Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
  const { data, error } = await db.from("users").upsert(clean, { onConflict: "wallet_address" }).select("*").single();
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ user: normalize(data), storage: { stored: true } });
}
