import { makeAsset } from "./common";

export async function getAssetState() {
  return makeAsset({ assetId: "mantle:usde", symbol: "USDe", name: "Ethena USDe", assetClass: "SYNTH_DOLLAR", address: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", price: 0.999, nominalApy: 8.4, tvlUsd: 58000000, supply: 58100000, issuerTag: "Ethena", liquidityDepthUsd: 8900000, pegDeviationBps: 10, contractAgeDays: 560, concentrationTopHolderPct: 22, proofOfReserve: false, mock: false, source: "verified Mantle USDe address (on-chain symbol/name) + static price/risk feeds" });
}
