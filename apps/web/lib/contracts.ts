import { createPublicClient, http, type Address } from "viem";
import { mantle } from "./chain";
import { mantleDeployment } from "./deployments";

function envAddress(value: string | undefined, fallback: Address): Address {
  return value && value.trim().length > 0 ? (value as Address) : fallback;
}

export const addresses = {
  ratingRegistry: envAddress(
    process.env.NEXT_PUBLIC_AURALIS_RATING_REGISTRY,
    mantleDeployment.contracts.ratingRegistry,
  ),
  complianceAttestor: envAddress(
    process.env.NEXT_PUBLIC_AURALIS_COMPLIANCE_ATTESTOR,
    mantleDeployment.contracts.complianceAttestor,
  ),
  agentRegistry: envAddress(
    process.env.NEXT_PUBLIC_AURALIS_AGENT_REGISTRY,
    mantleDeployment.contracts.agentRegistry,
  ),
  policyGuard: envAddress(
    process.env.NEXT_PUBLIC_AURALIS_POLICY_GUARD,
    mantleDeployment.contracts.policyGuard,
  ),
};

export const publicClient = createPublicClient({ chain: mantle, transport: http() });

export const ratingRegistryAbi = [
  { type: "event", name: "RatingAnchored", inputs: [{ name: "assetId", type: "bytes32", indexed: true }, { name: "ratingHash", type: "bytes32", indexed: true }, { name: "grade", type: "uint8", indexed: false }, { name: "riskScore", type: "uint8", indexed: false }, { name: "submitter", type: "address", indexed: true }, { name: "official", type: "bool", indexed: false }, { name: "metadataURI", type: "string", indexed: false }] },
  { type: "event", name: "DecisionLogged", inputs: [{ name: "decisionId", type: "uint256", indexed: true }, { name: "decisionHash", type: "bytes32", indexed: true }, { name: "agent", type: "address", indexed: true }, { name: "actionType", type: "bytes32", indexed: false }, { name: "riskScore", type: "uint8", indexed: false }] },
  { type: "function", name: "verifyRating", stateMutability: "view", inputs: [{ name: "assetId", type: "bytes32" }, { name: "ratingHash", type: "bytes32" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "ratingHistoryLength", stateMutability: "view", inputs: [{ name: "assetId", type: "bytes32" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "anchorRating", stateMutability: "nonpayable", inputs: [{ name: "assetId", type: "bytes32" }, { name: "ratingHash", type: "bytes32" }, { name: "grade", type: "uint8" }, { name: "riskScore", type: "uint8" }, { name: "methodologyVersion", type: "uint16" }, { name: "metadataURI", type: "string" }], outputs: [{ name: "official", type: "bool" }] },
  { type: "function", name: "logDecision", stateMutability: "nonpayable", inputs: [{ name: "decisionHash", type: "bytes32" }, { name: "actionType", type: "bytes32" }, { name: "riskScore", type: "uint8" }, { name: "metadataURI", type: "string" }], outputs: [{ name: "decisionId", type: "uint256" }] },
] as const;

export const complianceAttestorAbi = [
  { type: "event", name: "AttestationMinted", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "subject", type: "address", indexed: true }, { name: "assetClassId", type: "bytes32", indexed: true }, { name: "verdict", type: "uint8", indexed: false }, { name: "attester", type: "address", indexed: false }, { name: "validUntil", type: "uint64", indexed: false }, { name: "metadataURI", type: "string", indexed: false }] },
  { type: "function", name: "isEligible", stateMutability: "view", inputs: [{ name: "wallet", type: "address" }, { name: "assetClassId", type: "bytes32" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "getVerdict", stateMutability: "view", inputs: [{ name: "wallet", type: "address" }, { name: "assetClassId", type: "bytes32" }], outputs: [{ name: "verdict", type: "uint8" }, { name: "active", type: "bool" }] },
  { type: "function", name: "mintAttestation", stateMutability: "payable", inputs: [{ name: "subject", type: "address" }, { name: "assetClassId", type: "bytes32" }, { name: "verdict", type: "uint8" }, { name: "checkHash", type: "bytes32" }, { name: "jurisdictionTag", type: "bytes32" }, { name: "metadataURI", type: "string" }, { name: "validitySeconds", type: "uint64" }], outputs: [{ name: "id", type: "uint256" }] },
  { type: "function", name: "revoke", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }], outputs: [] },
] as const;

const rebalanceParamComponents = [
  { name: "portfolioHash", type: "bytes32" },
  { name: "topAssetBps", type: "uint16" },
  { name: "topProtocolBps", type: "uint16" },
  { name: "slippageBps", type: "uint16" },
  { name: "aiConfidence", type: "uint8" },
  { name: "liquidityScore", type: "uint16" },
  { name: "notionalValue", type: "uint256" },
  { name: "humanApproved", type: "bool" },
  { name: "metadataURI", type: "string" },
] as const;

export const policyGuardAbi = [
  { type: "event", name: "RebalanceExecuted", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "user", type: "address", indexed: true }, { name: "portfolioHash", type: "bytes32", indexed: false }, { name: "notionalValue", type: "uint256", indexed: false }, { name: "metadataURI", type: "string", indexed: false }] },
  { type: "event", name: "RebalanceBlocked", inputs: [{ name: "user", type: "address", indexed: true }, { name: "reason", type: "string", indexed: false }] },
  { type: "function", name: "checkRebalance", stateMutability: "view", inputs: [{ name: "user", type: "address" }, { name: "p", type: "tuple", components: rebalanceParamComponents }], outputs: [{ name: "ok", type: "bool" }, { name: "reason", type: "string" }] },
  { type: "function", name: "setPolicy", stateMutability: "nonpayable", inputs: [{ name: "maxPerAssetBps", type: "uint16" }, { name: "maxPerProtocolBps", type: "uint16" }, { name: "maxSlippageBps", type: "uint16" }, { name: "minConfidence", type: "uint8" }, { name: "minLiquidityScore", type: "uint16" }, { name: "cooldownSeconds", type: "uint32" }, { name: "humanApprovalThreshold", type: "uint256" }], outputs: [] },
  { type: "function", name: "tryExecuteRebalance", stateMutability: "nonpayable", inputs: [{ name: "p", type: "tuple", components: rebalanceParamComponents }], outputs: [{ name: "ok", type: "bool" }, { name: "rebalanceId", type: "uint256" }, { name: "reason", type: "string" }] },
] as const;
