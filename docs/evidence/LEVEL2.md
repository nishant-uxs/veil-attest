# Level 2 — Waxing Crescent evidence

## Mission

Contract wired to a frontend UI, with Lace / 1AM connected on **Preprod**.

## Checklist status

| Item | Status |
| --- | --- |
| Lace / 1AM connect / disconnect | Implemented in `frontend/` |
| Circuit call from UI | `registerAttestation` via Midnight.js + wallet |
| Observable privacy behavior | Claim form cleared after success; only commitment/count public |
| Preprod contract address | `00b40b4eb91eb8d6375c1215e1d7746cf066a19a57f795d2894c1cd11cffbf8f` (indexer-verified `ContractDeploy`) |
| Live demo (Vercel) | https://veil-attest.vercel.app |
| Demo video | https://drive.google.com/file/d/1Gpf3KFH0XVrotMhKWadB_BfPEkMwIgVR/view?usp=sharing |
| ≥8 commits | See `git log` on `main` |
| README privacy + mermaid | Done (both diagrams render on GitHub) |

## How to record the demo video

1. Open the Vercel demo URL in Chrome with 1AM or Lace (Midnight) installed.
2. Set wallet network to **Preprod**; ensure tNIGHT + tDUST available.
3. Click **Connect wallet** → pick 1AM or Lace → approve → show address.
4. Paste Preprod contract address → **Join contract** (or **Deploy new contract**).
5. Enter a private claim → **Call registerAttestation** → approve in wallet.
6. Show: plaintext cleared, `attestationCount` incremented, `latestCommitment` updated.
7. Click **Disconnect**.

## Commands

```bash
cd frontend && npm install && npm run build
vercel --prod
```
