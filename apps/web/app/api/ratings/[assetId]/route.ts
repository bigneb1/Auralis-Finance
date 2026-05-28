import { z } from "zod";
import { getRatingWithAI, json, assertRateLimit, persist } from "../../../../lib/api";

const PatchBody = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  metadataUri: z.string().min(1).default("ipfs://pending/usdy-rating"),
  ratingJson: z.record(z.string(), z.unknown()),
  ratingHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  methodologyVersion: z.number().int().positive(),
});

export async function GET(req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const limited = await assertRateLimit(req);
  if (limited) return limited;
  const { assetId } = await params;
  const rating = await getRatingWithAI(assetId);
  return rating ? json(rating) : json({ error: "not_found" }, { status: 404 });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const limited = await assertRateLimit(req);
  if (limited) return limited;
  const { assetId } = await params;
  const body = PatchBody.parse(await req.json());
  const rating = await getRatingWithAI(assetId);
  if (!rating) return json({ error: "not_found" }, { status: 404 });
  const storage = await persist("ratings", {
    asset_id: rating.assetId,
    rating_json: body.ratingJson,
    rating_hash: body.ratingHash,
    methodology_version: body.methodologyVersion,
    tx_hash: body.txHash,
    metadata_uri: body.metadataUri,
    anchored_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  return json({ ok: true, storage });
}
