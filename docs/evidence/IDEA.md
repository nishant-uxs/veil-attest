# Idea Submission (paste into challenge form)

**Challenge period:** September Challenge (Active)  
**Task:** Idea Submission (unlocks Level 4+)  
**Idea list item:** Confidential Credentials — prove a credential is valid without disclosing it  
**Category (Q2):** Identity/credentials

## Q1 — What is your idea? (copy below)

```text
VeilAttest — Confidential Credentials on Midnight

VeilAttest is a privacy-first attestation / credential registry. Holders register a private claim (KYC status, membership, audit finding, etc.) as a Compact witness. The circuit hashes the claim and discloses only a commitment plus a public attestation count. Observers can verify that a valid attestation occurred and see the latest commitment, but never the plaintext credential.

Stack already live for Levels 1–2: Compact contract on Preprod, Lace/1AM DApp connector frontend (https://veil-attest.vercel.app), private-state management, and observable privacy UX (claim cleared after register; only commitment/count remain public).

For Levels 4–6 we will harden selective disclosure (richer credential schemas, verification flows), expand tests/CI, and grow the product proposal around confidential credentials for teams that need verifiable attestations without dumping sensitive data on-chain.
```

## Links for reviewers

- Repo: https://github.com/nishant-uxs/veil-attest
- Live demo: https://veil-attest.vercel.app
- Preprod contract: `00b40b4eb91eb8d6375c1215e1d7746cf066a19a57f795d2894c1cd11cffbf8f`
