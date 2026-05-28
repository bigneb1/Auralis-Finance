# USDY On-Chain Proof (Mantle Mainnet)

This is a live, reproducible record of the end-to-end USDY flow executed on
**Mantle mainnet (chainId 5000)** with a user-signed wallet — not a deployer
key, not a mock. It demonstrates the same calls the browser UI makes
(`UsdyRatingActions`, the compliance page, and the simulator).

- **Date:** 2026-05-29
- **Signer (user wallet):** `0x0C1Fc3B41717a068f836e1B737F3cB0251789783`
- **Network:** Mantle mainnet, chainId `5000`, block ~`95,939,33x`

## Contracts

| Contract | Address |
|---|---|
| AuralisRatingRegistry | `0xF59c877C83E6519A606810b4d8DA52Ccf34d5A22` |
| AuralisComplianceAttestor | `0xe4eE2b0984FF9F604bF03d0521808037Ea5d3b34` |
| AuralisPolicyGuard | `0xFaD41c7d7e777853CF7aC04641Df0D88B27A7b0E` |

## Deterministic hashes

| Field | Value |
|---|---|
| `assetIdHash = keccak256("USDY")` | `0xeb3420dc333cd737f3fc1d31d856a828e115a3cf3ba02411617a9bd7a2c92d32` |
| Canonical rating hash | `0x6cfa184f64ec7925a70713df1a369f038ea566de22d95a27e84d129430775037` |
| Compliance report hash | `0x771602411957197a818ae76e0166b3f167786b63518a62d0774215c4991de7ec` |

## Transactions

| # | Action | On-chain result | Tx |
|---|---|---|---|
| 1 | `anchorRating(USDY)` | `verifyRating` → **MATCH** | [`0xce473b…d67cd4`](https://explorer.mantle.xyz/tx/0xce473bd6a99600ed78b296430a7d81aa14d22a933b32cd869b5ccc8204d67cd4) |
| 2 | `mintAttestation(US_TREASURY_RWA)` | `isEligible` → **ELIGIBLE** | [`0x1bda92…d4cb58`](https://explorer.mantle.xyz/tx/0x1bda92066304ec8aa7d433956652ac74e69c7ecd473e315a35b28fe668d4cb58) |
| 3 | `setPolicy` (USDY demo policy) | `checkRebalance` → **PASS** | [`0x4801a3…f29de9`](https://explorer.mantle.xyz/tx/0x4801a3d2b62ad8543f40d640d6258e9eb7b536733ab4398efe4eb51c6cf29de9) |
| 4 | `tryExecuteRebalance` | `RebalanceExecuted` emitted | [`0xd4882c…a8460d`](https://explorer.mantle.xyz/tx/0xd4882cd832e7d143aca413d74479154725ab0f11350b71c67323eddefea8460d) |

Filtering events by this wallet (exactly what the **Decisions** page renders)
returns: `RatingAnchored × 1`, `AttestationMinted × 1`, `RebalanceExecuted × 1`,
`RebalanceBlocked × 0`.

## Reproduce

The canonical hash is fully deterministic (rating computed with a fixed
`updatedAt`), so the rating hash above is stable. To replay the writes with your
own funded wallet:

```bash
cd apps/web
AURALIS_PK=0x<your_funded_mantle_key> ./node_modules/.bin/tsx scripts/verify-usdy.mts
```

The script (`apps/web/scripts/verify-usdy.mts`) is idempotent for the rating
anchor — because the deterministic rating hash can only be anchored once, a
re-run detects the existing anchor via `verifyRating` and skips re-anchoring.
The private key is read only from `AURALIS_PK` and is never written to disk.
