import { makeAsset } from "./common";

export async function getAssetState() {
  return makeAsset({ assetId: "mantle:meth", symbol: "mETH", name: "Mantle Staked Ether", assetClass: "LST", address: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0", price: 3840, nominalApy: 3.15, tvlUsd: 712000000, supply: 185416, issuerTag: "Mantle LSP", liquidityDepthUsd: 39000000, pegDeviationBps: 22, contractAgeDays: 820, concentrationTopHolderPct: 11, proofOfReserve: true, mock: false, source: "verified Mantle mETH address (on-chain symbol/name) + static price/risk feeds" });
}
