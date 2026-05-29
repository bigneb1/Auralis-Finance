import { makeAsset } from "./common";

export async function getAssetState() {
  return makeAsset({
    assetId: "mantle:usdy",
    symbol: "USDY",
    name: "Ondo US Dollar Yield",
    assetClass: "US_TREASURY_RWA",
    // Canonical Ondo USDY on Mantle mainnet — verified on-chain: symbol "USDY",
    // name "Ondo U.S. Dollar Yield", 18 decimals.
    address: "0x5bE26527e817998A7206475496fDE1E68957c5A6",
    price: 1.006,
    nominalApy: 4.85,
    tvlUsd: 42800000,
    supply: 42500000,
    issuerTag: "Ondo Finance",
    liquidityDepthUsd: 6200000,
    pegDeviationBps: 6,
    contractAgeDays: 640,
    concentrationTopHolderPct: 16,
    proofOfReserve: true,
    mock: false,
    source: "verified Mantle USDY address (on-chain symbol/name) + static price/risk feeds",
  });
}
