# VeilAttest

Privacy-first attestation registry on **Midnight**. Register a private claim as a witness; only a commitment and a count become public ledger state.

Built for the Midnight **New Moon → Full** Level 1 (New Moon) track: Compact contract, ZK circuits, and deployment on Preview/Preprod.

## Initial product idea

VeilAttest lets teams and individuals attest to business claims (KYC status, inventory counts, audit findings, membership eligibility) without putting the raw claim on-chain. The DApp supplies a 32-byte claim as a **private witness**. The circuit hashes that claim, uses `disclose()` only for the resulting commitment, and increments a public counter. Downstream apps can verify “an attestation happened and this commitment is the latest,” while the plaintext claim never leaves the prover’s private state.

## Public state vs private witness

| Layer | What | Visibility |
| --- | --- | --- |
| **Private witness** `privateClaim()` | Raw 32-byte claim from the DApp | Never written to the public ledger in cleartext |
| **Public ledger** `attestationCount` | Number of registrations | On-chain / indexer-visible |
| **Public ledger** `latestCommitment` | `persistentHash(claim)` after `disclose()` | On-chain / indexer-visible |

`disclose()` is intentional: only the commitment is promoted to public state. The witness itself stays private.

## Requirements

- Node.js **22+**
- Compact CLI in WSL/Linux — pin **`compact update 0.31.1`** (language 0.23 / runtime 0.16 matches Midnight.js 4.1.1)
- Docker (proof server on `:6300`; full stack for undeployed)
- For Preview/Preprod: faucet-funded unshielded address (`mn_addr_…`)

## Quick start

```bash
# Inside WSL / Linux, from the repo root
npm install
npm run compile
npm test
docker compose up -d proof-server
npm run deploy -- --network preprod   # or: preview | undeployed
```

On first Preview/Preprod deploy the CLI prints your unshielded wallet address and the faucet URL. Fund the address, wait for tNIGHT, then the script registers UTXOs for DUST and deploys.

## Project layout

```
contracts/veil-attest.compact
contracts/managed/veil-attest/
src/deploy.ts
src/witnesses.ts
tests/veil-attest.test.ts
docs/evidence/
docs/screenshots/
```

## Circuits

| Circuit | Role |
| --- | --- |
| `registerAttestation` | Hash private claim → disclose commitment → bump count |
| `getAttestationCount` | Read public count |
| `getLatestCommitment` | Read public commitment |

## Evidence (Level 1 checklist)

- [x] Toolchain + `compact compile` → `managed/` with circuits and keys
- [x] Passing test suite (`npm test`)
- [x] README: setup, public vs private, product idea
- [ ] Contract deployed on Preview or Preprod (see `docs/evidence/DEPLOYMENT.md`)
- [x] Screenshot: compile output
- [ ] Screenshot: deployed address on Preview/Preprod
- [ ] ≥5 meaningful commits on a public GitHub repo

## License

MIT
