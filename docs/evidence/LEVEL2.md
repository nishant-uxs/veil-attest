# Level 2 — Waxing Crescent evidence

## Mission

Contract wired to a frontend UI, with Lace connected on **Preprod**.

## Checklist status

| Item | Status |
| --- | --- |
| Lace connect / disconnect | Implemented in `frontend/` |
| Circuit call from UI | `registerAttestation` via Midnight.js + Lace |
| Observable privacy behavior | Claim form cleared after success; only commitment/count public |
| Preprod contract address | _pending deploy — fill after `npm run deploy -- --network preprod`_ |
| Live demo (Vercel) | _pending `vercel --prod`_ |
| Demo video | Record: Connect Lace → Join → Register claim → show commitment |
| ≥8 commits | See `git log` on `main` |
| README privacy + mermaid | Done |

## How to record the demo video

1. Open the Vercel demo URL in Chrome with Lace (Midnight) installed.
2. Set Lace network to **Preprod**; ensure tNIGHT + tDUST available.
3. Click **Connect Lace** → approve → show address.
4. Confirm contract address → **Join contract**.
5. Enter a private claim → **Call registerAttestation** → approve in Lace.
6. Show: plaintext cleared, `attestationCount` incremented, `latestCommitment` updated.
7. Click **Disconnect**.

## Commands

```bash
cd frontend && npm install && npm run build
vercel --prod
```
