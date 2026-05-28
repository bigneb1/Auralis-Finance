import { z } from "zod";
import { decisionHash, json, persist, WalletSchema } from "../../../lib/api";

const Body = z.object({ wallet: WalletSchema, actionType: z.string().min(1), riskScore: z.number().min(0).max(100), policyResult: z.enum(["PASS", "WARN", "FAIL"]), txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional() });

export async function POST(req: Request) {
  const body = Body.parse(await req.json());
  const createdAt = new Date().toISOString();
  const decisionId = `decision:${body.wallet}:${body.actionType}:${body.txHash ?? createdAt}`;
  const decision = { decisionId, ...body, decisionHash: decisionHash({ decisionId, ...body, createdAt }), metadataUri: "ipfs://pending/decision", createdAt };
  const storage = await persist("decisions", { id: decisionId, wallet: body.wallet, decision_json: decision, decision_hash: decision.decisionHash, action_type: body.actionType, outcome: body.policyResult, tx_hash: body.txHash });
  return json({ ...decision, storage });
}
