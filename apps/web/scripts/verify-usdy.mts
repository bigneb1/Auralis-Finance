/**
 * Headless USDY on-chain proof walkthrough (Mantle mainnet).
 *
 * Replicates exactly what the browser UI does (UsdyRatingActions / compliance /
 * simulator), but signs with a user-provided funded wallet instead of an
 * injected browser wallet. This is a normal user wallet (NOT the contract
 * deployer/owner key), so every tx is a genuine user-signed transaction.
 *
 * Run from apps/web:
 *   AURALIS_PK=0x... node --import tsx scripts/verify-usdy.mts
 *
 * The private key is read from AURALIS_PK only and is never written to disk
 * or printed. RPC + contract addresses load from the repo .env.local.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// --- load env (.env.local) before importing modules that read process.env ---
// Defaults to the repo-root .env.local (apps/web/scripts -> repo root); override with AURALIS_ENV_PATH.
const ENV_PATH = process.env.AURALIS_ENV_PATH || resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env.local");
for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const k = trimmed.slice(0, eq).trim();
  const v = trimmed.slice(eq + 1).trim();
  if (process.env[k] === undefined) process.env[k] = v;
}

const PK = process.env.AURALIS_PK;
if (!PK || !/^0x[0-9a-fA-F]{64}$/.test(PK)) {
  console.error("Missing/invalid AURALIS_PK env var");
  process.exit(1);
}

// dynamic imports so env is set first
const { createPublicClient, createWalletClient, http, formatEther } = await import("viem");
const { privateKeyToAccount } = await import("viem/accounts");
const { mantle } = await import("../lib/chain.ts");
const { addresses, ratingRegistryAbi, complianceAttestorAbi, policyGuardAbi } = await import("../lib/contracts.ts");
const { hashCanonical, idHash, gradeCode, verdictCode } = await import("../lib/proof.ts");
const { getAllAssets } = await import("@auralis/adapters");
const core = await import("@auralis/core");
const rateAsset = (core as any).rateAsset as (a: any, now?: number) => any;
const runComplianceWorkflow = (core as any).runComplianceWorkflow as (w: string, j: string, assets: any[]) => any;

const rpc = process.env.NEXT_PUBLIC_MANTLE_RPC_URL || process.env.MANTLE_RPC_URL || "https://rpc.mantle.xyz";
const account = privateKeyToAccount(PK as `0x${string}`);
const pub = createPublicClient({ chain: mantle, transport: http(rpc) });
const wallet = createWalletClient({ account, chain: mantle, transport: http(rpc) });
const explorer = (process.env.NEXT_PUBLIC_MANTLE_EXPLORER_URL || "https://explorer.mantle.xyz").replace(/\/$/, "");
const txUrl = (h: string) => `${explorer}/tx/${h}`;

const out: { step: string; status: string; tx?: string; url?: string; note?: string }[] = [];
function log(s: string) { console.log(s); }
const big = (_: string, v: unknown) => (typeof v === "bigint" ? v.toString() : v);

async function send(label: string, params: any): Promise<`0x${string}`> {
  log(`  → ${label}: simulating…`);
  const { request } = await pub.simulateContract({ account, ...params });
  const hash = await wallet.writeContract(request);
  log(`    submitted ${hash} — waiting for receipt…`);
  const rcpt = await pub.waitForTransactionReceipt({ hash });
  log(`    ${rcpt.status === "success" ? "✓ confirmed" : "✗ reverted"} in block ${rcpt.blockNumber} (gas ${rcpt.gasUsed})`);
  if (rcpt.status !== "success") throw new Error(`${label} reverted`);
  return hash;
}

// --- preflight ---
const bn = await pub.getBlockNumber();
const bal = await pub.getBalance({ address: account.address });
log(`Wallet:   ${account.address}`);
log(`Network:  Mantle chainId ${mantle.id} @ ${rpc} (block ${bn})`);
log(`Balance:  ${formatEther(bal)} MNT\n`);
if (bal === 0n) { console.error("Wallet has 0 MNT — cannot send transactions."); process.exit(1); }

// =====================================================================
// 1) USDY rating anchor
// =====================================================================
log("[1] USDY rating anchor");
const assets = await getAllAssets();
const usdy = assets.find((a: any) => a.symbol === "USDY");
if (!usdy) throw new Error("USDY asset not found");
const det = rateAsset({ ...usdy, ...(usdy as any).rawRiskSignals }, 0);
const canonicalPayload = {
  assetId: det.assetId, symbol: det.symbol, name: det.name, assetClass: det.assetClass,
  grade: det.grade, riskScore: det.riskScore, dimensionScores: det.dimensionScores,
  nominalApy: det.nominalApy, riskAdjustedApy: det.riskAdjustedApy, tvlUsd: det.tvlUsd,
  methodologyVersion: det.methodologyVersion, updatedAt: det.updatedAt,
};
const assetIdHash = idHash("USDY");
const canonicalHash = hashCanonical(canonicalPayload);
log(`  assetIdHash:   ${assetIdHash}`);
log(`  canonicalHash: ${canonicalHash}`);
const alreadyMatches = await pub.readContract({ address: addresses.ratingRegistry, abi: ratingRegistryAbi, functionName: "verifyRating", args: [assetIdHash, canonicalHash] });
if (alreadyMatches) {
  log("  ↻ already anchored (deterministic hash already latest on-chain) — idempotent, skipping anchor tx");
  out.push({ step: "Anchor USDY rating", status: "already-anchored" });
} else {
  try {
    const tx = await send("anchorRating", { address: addresses.ratingRegistry, abi: ratingRegistryAbi, functionName: "anchorRating", args: [assetIdHash, canonicalHash, gradeCode(det.grade), Math.round(det.riskScore), det.methodologyVersion, "ipfs://pending/usdy-rating"] });
    out.push({ step: "Anchor USDY rating", status: "sent", tx, url: txUrl(tx) });
  } catch (e: any) {
    log(`  ! anchor failed: ${e.shortMessage || e.message}`);
    out.push({ step: "Anchor USDY rating", status: "failed", note: e.shortMessage || e.message });
  }
}
const verified = await pub.readContract({ address: addresses.ratingRegistry, abi: ratingRegistryAbi, functionName: "verifyRating", args: [assetIdHash, canonicalHash] });
log(`  verifyRating → ${verified ? "MATCH ✓" : "MISMATCH ✗"}`);
out.push({ step: "verifyRating(USDY)", status: verified ? "MATCH" : "MISMATCH" });

// =====================================================================
// 2) Compliance attestation
// =====================================================================
log("\n[2] Compliance attestation");
const jurisdiction = "NG";
const report = runComplianceWorkflow(account.address, jurisdiction, assets);
const usdyResult = report.results.find((r: any) => r.assetClass === "US_TREASURY_RWA") ?? report.results[0];
const assetClassId = idHash("US_TREASURY_RWA");
log(`  reportHash: ${report.reportHash}`);
log(`  verdict (US_TREASURY_RWA): ${usdyResult.verdict}`);
const alreadyEligible = await pub.readContract({ address: addresses.complianceAttestor, abi: complianceAttestorAbi, functionName: "getVerdict", args: [account.address, assetClassId] }) as readonly [number, boolean];
if (alreadyEligible[1]) {
  log(`  ↻ active attestation already exists (verdict code ${alreadyEligible[0]}) — minting a fresh one anyway with this run's report hash`);
}
try {
  const tx = await send("mintAttestation", { address: addresses.complianceAttestor, abi: complianceAttestorAbi, functionName: "mintAttestation", args: [account.address, assetClassId, verdictCode(usdyResult.verdict), report.reportHash as `0x${string}`, idHash(jurisdiction), "ipfs://pending/usdy-compliance", 60n * 60n * 24n * 30n] });
  out.push({ step: "Mint compliance attestation", status: "sent", tx, url: txUrl(tx) });
} catch (e: any) {
  log(`  ! mint failed: ${e.shortMessage || e.message}`);
  out.push({ step: "Mint compliance attestation", status: "failed", note: e.shortMessage || e.message });
}
const elig = await pub.readContract({ address: addresses.complianceAttestor, abi: complianceAttestorAbi, functionName: "isEligible", args: [account.address, assetClassId] });
log(`  isEligible → ${elig ? "ELIGIBLE ✓" : "not eligible ✗"}`);
out.push({ step: "isEligible(US_TREASURY_RWA)", status: elig ? "ELIGIBLE" : "NOT_ELIGIBLE" });

// =====================================================================
// 3) Policy + rebalance
// =====================================================================
log("\n[3] Policy guard + rebalance");
const simAssets = [
  { symbol: "USDY", current: 42, risk: 28, apy: 4.8 },
  { symbol: "mETH", current: 31, risk: 34, apy: 3.2 },
  { symbol: "USDe", current: 27, risk: 48, apy: 8.4 },
];
const targets = { USDY: 45, mETH: 30, USDe: 25 };
const maxTarget = Math.max(...Object.values(targets));
const rebalanceParams = {
  portfolioHash: hashCanonical({ current: simAssets, targets, intent: "USDY_REBALANCE" }),
  topAssetBps: maxTarget * 100, topProtocolBps: maxTarget * 100, slippageBps: 22,
  aiConfidence: 82, liquidityScore: 78, notionalValue: 10_000n * 10n ** 18n,
  humanApproved: true, metadataURI: "ipfs://pending/usdy-rebalance",
};
let [ok, reason] = await pub.readContract({ address: addresses.policyGuard, abi: policyGuardAbi, functionName: "checkRebalance", args: [account.address, rebalanceParams] }) as readonly [boolean, string];
log(`  checkRebalance → ok=${ok} reason="${reason}"`);
if (!ok) {
  log("  setting USDY demo policy first…");
  try {
    const tx = await send("setPolicy", { address: addresses.policyGuard, abi: policyGuardAbi, functionName: "setPolicy", args: [5000, 5000, 50, 70, 60, 0, 100_000n * 10n ** 18n] });
    out.push({ step: "Set USDY policy", status: "sent", tx, url: txUrl(tx) });
  } catch (e: any) {
    log(`  ! setPolicy failed: ${e.shortMessage || e.message}`);
    out.push({ step: "Set USDY policy", status: "failed", note: e.shortMessage || e.message });
  }
  [ok, reason] = await pub.readContract({ address: addresses.policyGuard, abi: policyGuardAbi, functionName: "checkRebalance", args: [account.address, rebalanceParams] }) as readonly [boolean, string];
  log(`  checkRebalance (after policy) → ok=${ok} reason="${reason}"`);
}
out.push({ step: "checkRebalance", status: ok ? "PASS" : "BLOCK", note: reason });
try {
  const tx = await send("tryExecuteRebalance", { address: addresses.policyGuard, abi: policyGuardAbi, functionName: "tryExecuteRebalance", args: [rebalanceParams] });
  out.push({ step: "Execute rebalance", status: "sent", tx, url: txUrl(tx) });
} catch (e: any) {
  log(`  ! tryExecuteRebalance failed: ${e.shortMessage || e.message}`);
  out.push({ step: "Execute rebalance", status: "failed", note: e.shortMessage || e.message });
}

// =====================================================================
// 4) Read back chain events for this wallet (what the Decisions page shows)
// =====================================================================
log("\n[4] Chain events for this wallet (Decisions page source)");
const fromBlock = bn > 2_000_000n ? bn - 2_000_000n : 0n;
const { parseAbiItem } = await import("viem");
const evs = {
  RatingAnchored: parseAbiItem("event RatingAnchored(bytes32 indexed assetId, bytes32 indexed ratingHash, uint8 grade, uint8 riskScore, address indexed submitter, bool official, string metadataURI)"),
  AttestationMinted: parseAbiItem("event AttestationMinted(uint256 indexed id, address indexed subject, bytes32 indexed assetClassId, uint8 verdict, address attester, uint64 validUntil, string metadataURI)"),
  RebalanceExecuted: parseAbiItem("event RebalanceExecuted(uint256 indexed id, address indexed user, bytes32 portfolioHash, uint256 notionalValue, string metadataURI)"),
  RebalanceBlocked: parseAbiItem("event RebalanceBlocked(address indexed user, string reason)"),
};
const [anchored, minted, executed, blocked] = await Promise.all([
  pub.getLogs({ address: addresses.ratingRegistry, event: evs.RatingAnchored, args: { submitter: account.address }, fromBlock, toBlock: "latest" }),
  pub.getLogs({ address: addresses.complianceAttestor, event: evs.AttestationMinted, args: { subject: account.address }, fromBlock, toBlock: "latest" }),
  pub.getLogs({ address: addresses.policyGuard, event: evs.RebalanceExecuted, args: { user: account.address }, fromBlock, toBlock: "latest" }),
  pub.getLogs({ address: addresses.policyGuard, event: evs.RebalanceBlocked, args: { user: account.address }, fromBlock, toBlock: "latest" }),
]);
log(`  RatingAnchored:    ${anchored.length}`);
log(`  AttestationMinted: ${minted.length}`);
log(`  RebalanceExecuted: ${executed.length}`);
log(`  RebalanceBlocked:  ${blocked.length}`);

// =====================================================================
// Summary
// =====================================================================
log("\n========== SUMMARY ==========");
for (const r of out) {
  log(`${r.status.padEnd(16)} ${r.step}${r.tx ? `  ${r.url}` : r.note ? `  (${r.note})` : ""}`);
}
log("\nJSON:");
log(JSON.stringify({ wallet: account.address, chainId: mantle.id, assetIdHash, canonicalHash, reportHash: report.reportHash, results: out, events: { RatingAnchored: anchored.length, AttestationMinted: minted.length, RebalanceExecuted: executed.length, RebalanceBlocked: blocked.length } }, big, 2));
