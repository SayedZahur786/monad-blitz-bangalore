# We-WhoCares 🏥⛓️

**Explainable AI claim decisions, recorded immutably on Monad.**

Health-insurance AI agents make opaque, black-box claim decisions — fuelling
grievances, distrust, and hard-to-fight appeals. We-WhoCares makes every
decision **fully explainable in plain language** and writes the decision + its
reasons (as a tamper-evident hash) to an **immutable audit trail on the Monad
blockchain**. Policyholders, insurers, and IRDAI can all verify exactly *why* a
decision was made.

**🔴 Live demo:** https://we-whocares.vercel.app

> Submitting to Monad Blitz Bangalore? See [`SUBMISSION_GUIDE.md`](./SUBMISSION_GUIDE.md).

## The 4-step core flow

1. **Submit Claim** — ABHA, policy, claim type, amount, a document description, and consent.
2. **AI Reasoning** — an AI agent adjudicates against sample policy rules and returns a structured decision + plain-language reasons + confidence.
3. **Record on Monad** — the backend commits `keccak256(decision + reasons)` to the `ClaimRegistry` contract.
4. **Transparent Decision** — a clear, colour-coded result page with reasons, inputs summary, timestamp, confidence, and a live blockchain proof (tx hash + explorer link + downloadable PDF).

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind v4 · custom shadcn-flavoured UI |
| Backend | Next.js API routes (`/api/analyze`, `/api/record`) |
| AI | Google **Gemini** (structured JSON) with a deterministic rules-engine fallback |
| Blockchain | **Monad testnet** — `ClaimRegistry.sol` (Foundry) |
| Onchain write | Server-signed with the agent wallet via `viem` |
| Extras | English ↔ Hindi toggle · PDF report (jsPDF) · pre-filled sample claims |

## Repository layout

```
contracts/   Foundry project — ClaimRegistry.sol + tests + deploy script
web/         Next.js app (frontend + API routes)
```

## Deployed contract

| | |
| --- | --- |
| Network | Monad Testnet (chainId 10143) |
| ClaimRegistry | [`0xe597FAf030831b9B1b91B641d24eDc715435De1c`](https://testnet.monadexplorer.com/address/0xe597FAf030831b9B1b91B641d24eDc715435De1c) |
| Deploy tx | [`0xcd62a5a4…369c83b`](https://testnet.monadexplorer.com/tx/0xcd62a5a45da0c394db8378e1984daba3cbca0c1c9808a831bbee7cfd0369c83b) |
| Verified | ✅ [MonadVision](https://testnet.monadvision.com/address/0xe597FAf030831b9B1b91B641d24eDc715435De1c) · [MonadScan](https://testnet.monadscan.com/address/0xe597FAf030831b9B1b91B641d24eDc715435De1c) |

## Why these design choices

- **Backend-signed recording.** The spec calls for "Continue as Demo" auth and
  "backend logs to the contract", so decisions are committed server-side with the
  agent wallet — no per-user wallet or gas needed, and tx hashes are real.
- **Graceful fallbacks.** No `GEMINI_API_KEY` → deterministic rules engine.
  No `MONAD_PRIVATE_KEY`/contract → clearly-flagged simulated proof. The full
  demo always completes.
- **Verifiable, not just stored.** Only a `keccak256` commitment goes on-chain.
  Anyone can re-hash the published decision and call `verifyReasons()` to prove
  the record wasn't altered.

## Quick start

### Contracts

```bash
cd contracts
forge build
forge test
```

### Web

```bash
cd web
cp .env.example .env.local   # add GEMINI_API_KEY, MONAD_PRIVATE_KEY, contract address
pnpm install
pnpm dev                     # http://localhost:3000
```

Without any keys the app still runs end-to-end (rules-engine AI + simulated proof).

## Compliance & India focus

ABHA · PM-JAY · IRDAI transparency · mandatory consent · plain-language reasons.

> Demo / hackathon MVP. Policy rules are illustrative samples, not real insurer policy.
