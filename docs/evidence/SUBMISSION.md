# Submission evidence

## Overview

Privacy-first Confidential Credentials dApp on Midnight Preprod: Lace / 1AM wallet UI, circuit calls, tests, and CI.

## Idea (Level 4 unlock)

- **List item:** Confidential Credentials
- **Form category:** Identity/credentials
- **Paste text:** see [IDEA.md](./IDEA.md)

## Checklist status

| Item | Status |
| --- | --- |
| Lace / 1AM connect / disconnect | Implemented in `frontend/` |
| Circuit call from UI | `registerAttestation` via Midnight.js + wallet |
| Observable privacy behavior | Claim form cleared after success; only commitment/count public |
| Privacy model (observer can / cannot) | README **Privacy model** section |
| Product proposal | README **Product proposal** — Confidential Credentials |
| Preprod contract address | `00b40b4eb91eb8d6375c1215e1d7746cf066a19a57f795d2894c1cd11cffbf8f` |
| Live demo (Vercel) | https://veil-attest.vercel.app |
| Demo video (~1 min full flow) | https://drive.google.com/file/d/1Gpf3KFH0XVrotMhKWadB_BfPEkMwIgVR/view?usp=sharing |
| ≥3 tests passing | **10 passed** — `docs/screenshots/tests-passing.png` |
| CI/CD workflow + passing runs | `.github/workflows/ci.yml` + badge on README |
| Meaningful commits | See `git log` on `main` (≥10) |
| README privacy + mermaid | Done |

## Demo video outline (~1 minute)

1. Open https://veil-attest.vercel.app with 1AM or Lace on **Preprod**.
2. **Connect wallet** → approve → show address.
3. Join Preprod contract `00b40b4e…ffbf8f` (or deploy).
4. Enter private claim → **Call registerAttestation** → approve.
5. Show: plaintext cleared, `attestationCount` + `latestCommitment` updated.
6. **Disconnect**.

## Commands

```bash
npm test
cd frontend && npm ci && npm run build
# CI also runs on every push to main
```
