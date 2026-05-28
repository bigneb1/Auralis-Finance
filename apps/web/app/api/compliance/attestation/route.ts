import { z } from "zod";
import { json, persist, WalletSchema, HashSchema } from "../../../../lib/api";
import { getServerDb } from "../../../../lib/db";

const Body = z.object({
  wallet: WalletSchema,
  assetClass: z.string().min(1),
  verdict: z.string().min(1),
  checkHash: HashSchema,
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  validUntil: z.string().optional(),
});

export async function POST(req: Request) {
  const body = Body.parse(await req.json());
  const db = getServerDb();
  if (db) await db.from("compliance_reports").update({ tx_hash: body.txHash }).eq("check_hash", body.checkHash);
  const storage = await persist("attestations", {
    id: `${body.wallet}:${body.checkHash}`,
    wallet: body.wallet,
    asset_class: body.assetClass,
    verdict: body.verdict,
    check_hash: body.checkHash,
    tx_hash: body.txHash,
    valid_until: body.validUntil,
  });
  return json({ ok: true, storage });
}
