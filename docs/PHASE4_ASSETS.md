# Phase 4 Assets — Drafts While Video Is Pending

Purpose: prepare the Phase 4 submission copy. The canonical live URL is finalized as `https://auralisfinance.xyz` and is filled in everywhere below. Demo-video and X-thread links remain as placeholders until the recordings and final posts exist.

Related docs: [Submission Checklist](./SUBMISSION_CHECKLIST.md), [Pitch](./PITCH.md), [Judge Guide](./JUDGE_GUIDE.md), [Video Script](./video-script.md), [Contracts](./CONTRACTS.md).

## Domain plan

Use **one canonical domain**:

- Primary: `https://auralisfinance.xyz`
- Optional alias: `https://www.auralisfinance.xyz` → redirect/canonicalize to apex
- Vercel URL: fallback/internal deployment URL only, not the brand link for submission

### Vercel DNS records

After the Vercel project is connected, add the domain in Vercel, then set DNS where `auralisfinance.xyz` is registered:

| Host | Type | Value |
|---|---|---|
| `@` | `A` | `76.76.21.21` |
| `www` | `CNAME` | `cname.vercel-dns.com` |

Use `auralisfinance.xyz` everywhere in public copy once DNS is live. There is no need for a second purchased domain.

## Step 4.2 — X / Twitter thread draft

Status: copy-ready draft, **do not post until demo video links are filled**.

Remaining placeholders:

- `[DEMO_VIDEO_URL]` → YouTube unlisted demo video
- `[SHORT_CLIP_URL]` → 30–60s short clip if posted separately

### Main thread — 10 posts

**1/10**
Auralis Finance is the AI risk and compliance layer for tokenized real-world assets on Mantle.

Most RWA apps show yield. Auralis answers the missing questions: what is the risk, may this wallet hold it, and can the decision be verified later?

#MantleAIHackathon @0xMantle

**2/10**
The hook: we rated Mantle RWAs in a public explorer — no wallet needed.

Open `https://auralisfinance.xyz/ratings` and check the asset ratings, risk scores, methodology version, and proof framing.

This is designed as infrastructure other Mantle apps can consume.

**3/10**
Auralis has 3 pillars:

1. Ratings — seven-dimension RWA risk scoring
2. Compliance — wallet eligibility and attestations
3. Guardrails — policy-safe AI portfolio decisions

AI explains. Deterministic code decides. Users sign. Mantle verifies.

**4/10**
Demo asset: USDY.

Auralis computes a deterministic rating across asset, issuer, liquidity, peg, oracle, contract, and concentration risk. The AI turns that vector into a plain-language rationale, but it never invents the score.

Clip: `[SHORT_CLIP_URL]`

**5/10**
Ratings are verifiable.

`AuralisRatingRegistry` stores rating hashes on Mantle mainnet. The app can recompute the rating hash and verify it against the registry instead of asking users to trust a black-box AI answer.

**6/10**
Compliance is the differentiator.

A wallet scan checks jurisdiction, sanctions/risk flags, and asset-class rules. For Treasury-style RWAs like USDY, Auralis produces Eligible / Restricted / Denied verdicts with cited reasons.

**7/10**
Attestations are privacy-preserving.

The verdict and report hash go on-chain. Sensitive inputs stay off-chain. The user signs the attestation; Auralis never holds funds and never signs for the user.

**8/10**
The agent can simulate rebalances, but it cannot run away.

Policy checks cover exposure, protocol concentration, liquidity, confidence, slippage, cooldown, and human approval. If a proposal violates policy, it is blocked before execution.

**9/10**
Mantle mainnet contracts:

Agent Registry: `0x2939Df04CAfcd310f764d928559f2BF9F284a2f4`
Rating Registry: `0xF59c877C83E6519A606810b4d8DA52Ccf34d5A22`
Compliance Attestor: `0xe4eE2b0984FF9F604bF03d0521808037Ea5d3b34`
Policy Guard: `0xFaD41c7d7e777853CF7aC04641Df0D88B27A7b0E`

**10/10**
Links:

Live app: `https://auralisfinance.xyz`
Demo video: `[DEMO_VIDEO_URL]`
GitHub: https://github.com/talk2francis/Auralis-Finance
Judge guide: https://github.com/talk2francis/Auralis-Finance/blob/main/docs/JUDGE_GUIDE.md

Built for #MantleAIHackathon @0xMantle

## 5 follow-up posts for Community Voting

**Follow-up 1 — build-in-public**
Auralis is built around one core design rule: AI explains, deterministic code decides, users sign, Mantle verifies.

That keeps the UX intelligent without giving an AI agent custody or autonomous execution rights.

`https://auralisfinance.xyz`

**Follow-up 2 — ratings spotlight**
The public ratings explorer is the viral surface: Mantle RWA ratings with no wallet required.

Each rating includes grade, risk score, methodology version, and proof framing — built to be consumed by users, wallets, and DeFi apps.

`https://auralisfinance.xyz/ratings`

**Follow-up 3 — compliance spotlight**
Compliance should not be hidden behind PDFs.

Auralis turns wallet eligibility into a structured, explainable, and attestable workflow: scan → verdict → report hash → Mantle proof.

`https://auralisfinance.xyz/app/compliance`

**Follow-up 4 — methodology spotlight**
Auralis scores RWA risk across seven dimensions: asset, issuer, liquidity, peg, oracle, contract, and concentration.

The goal is not hype — it is repeatable risk methodology that makes tokenized assets easier to evaluate.

`https://auralisfinance.xyz/methodology`

**Follow-up 5 — business vision**
Auralis can become paid infrastructure for the Mantle RWA ecosystem:

- Intelligence API
- Treasury monitoring tier
- Compliance attestation fees

The product is revenue-first, not token-first.

`https://auralisfinance.xyz/business`

## Step 4.3 — DoraHacks BUIDL submission draft

Status: paste-ready except placeholders for live app, video, and final X thread links.

### Project name

Auralis Finance

### One-line pitch

Auralis is the AI risk and compliance layer for tokenized real-world assets on Mantle.

### What type of real-world asset are you bringing on-chain?

Auralis works with the real-world assets already tokenized on Mantle — tokenized U.S. Treasury and credit instruments such as USDY and QCDT-style regulated yield products, tokenized equities such as xStocks, and institutional index assets such as MI4 — alongside yield-bearing crypto-RWA assets like mETH/cmETH and synthetic-dollar yield such as USDe/sUSDe.

What Auralis newly brings on-chain is the missing layer for these assets: machine-readable, verifiable risk ratings and compliance/eligibility attestations — the credit-rating and due-diligence data that real-world finance depends on, published permanently on Mantle.

### How does AI play a role?

AI is the reasoning and explanation layer in three places.

1. Rating: an AI service explains deterministic, auditable risk signals such as collateral proof freshness, issuer/counterparty exposure, liquidity depth, depeg deviation, oracle freshness, and smart-contract surface.
2. Compliance: the agent interprets asset-class restrictions and jurisdiction rules against a screened wallet profile, then produces an eligibility verdict with cited reasons.
3. Portfolio: the Auralis agent proposes risk- and compliance-constrained rebalances, explains the reasoning, and passes through deterministic policy checks before any execution.

AI never holds keys and never auto-executes. It advises; deterministic code enforces; the human signs.

### How is it realized on Mantle?

Auralis is deployed on Mantle Mainnet, chainId `5000`. Four contracts store permanent, explorer-verifiable records:

- `AuralisAgentRegistry` — agent identity and metadata
- `AuralisRatingRegistry` — asset rating hashes and verification
- `AuralisComplianceAttestor` — compliance verdict attestations
- `AuralisPolicyGuard` — policy configuration and guarded decision checks

Auralis reads Mantle RWA data, computes deterministic ratings and eligibility verdicts, and links proofs to Mantle Explorer. The on-chain registries are public so other Mantle apps can consume Auralis as infrastructure.

### Track + path

Track: AI × RWA

Path: Path B — [AI-Driven] RWA Application

Justification: Auralis does not tokenize a new asset. Instead, it solves the post-issuance trust layer for tokenized RWAs: risk ratings, compliance eligibility, policy-safe AI recommendations, and on-chain proofs. This matches Path B because the product has clear asset categories, defined users, and a complete AI-driven application experience.

### Links

- Live app: `https://auralisfinance.xyz`
- GitHub: https://github.com/talk2francis/Auralis-Finance
- Demo video: `[DEMO_VIDEO_URL]`
- X thread: `[X_THREAD_URL]`
- Judge Guide: https://github.com/talk2francis/Auralis-Finance/blob/main/docs/JUDGE_GUIDE.md

### Mantle mainnet contracts

| Contract | Address | Explorer |
|---|---|---|
| AuralisAgentRegistry | `0x2939Df04CAfcd310f764d928559f2BF9F284a2f4` | https://explorer.mantle.xyz/address/0x2939Df04CAfcd310f764d928559f2BF9F284a2f4 |
| AuralisRatingRegistry | `0xF59c877C83E6519A606810b4d8DA52Ccf34d5A22` | https://explorer.mantle.xyz/address/0xF59c877C83E6519A606810b4d8DA52Ccf34d5A22 |
| AuralisComplianceAttestor | `0xe4eE2b0984FF9F604bF03d0521808037Ea5d3b34` | https://explorer.mantle.xyz/address/0xe4eE2b0984FF9F604bF03d0521808037Ea5d3b34 |
| AuralisPolicyGuard | `0xFaD41c7d7e777853CF7aC04641Df0D88B27A7b0E` | https://explorer.mantle.xyz/address/0xFaD41c7d7e777853CF7aC04641Df0D88B27A7b0E |

### How to evaluate in 5 minutes

Use the Judge Guide: https://github.com/talk2francis/Auralis-Finance/blob/main/docs/JUDGE_GUIDE.md

Fast path: open the live app, open `/ratings`, inspect USDY, verify the rating/proof framing, run `/app/compliance`, inspect the eligibility verdict, then open `/app/simulator`, `/app/decisions`, and `/app/agent`.

### Feature → scorecard mapping

| Feature | Scorecard dimension |
|---|---|
| Seven-dimension deterministic RWA ratings | AI × RWA depth, technical completeness |
| AI explanations with provenance | Verifiable AI, UX clarity |
| USDY closed loop | Real-world validity, demo quality |
| Compliance scan + eligibility verdicts | Compliance awareness, practical utility |
| Attestation design | Mantle proof layer, auditability |
| Policy-guarded simulator | Automated risk management, safety |
| Public ratings/API surfaces | Ecosystem contribution, business potential |
| Non-custodial user-signed model | Security and trust |
| Domain/public docs/judge guide | Completeness and judge readiness |

### Computing-credit application

Phase II computing-credit application status: **Francis to confirm**.

If not submitted yet, submit before final DoraHacks submission because Nansen and AI inference credits directly support the production data and explanation layers.
