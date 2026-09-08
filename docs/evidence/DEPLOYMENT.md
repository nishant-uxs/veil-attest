# Deployment evidence

## Preprod (target for Level 1)

- **Network:** Midnight Preprod
- **Deployer (unshielded):** `mn_addr_preprod1f6dnm935n5gaua6rm0fwd8legvn9mam5k8nrkwu8kknr4mqaf79qx5ggjy`
- **Faucet:** https://midnight-tmnight-preprod.nethermind.dev/
- **Faucet tx:** `007e6b1cdc34df455011d787a746bf7ed3f524b97e532ddca119513fb14da83301` (1000 tNight)
- **tNIGHT balance:** funded (1000 tNight received)
- **NIGHT→DUST registration:** wallet shows UTXO `registeredForDustGeneration=true`
- **Blocker:** `dust.balance()` stays `0` on the public Preprod indexer/wallet-sdk path, so fee payment cannot complete yet
- **Contract address:** _pending — re-run `npm run deploy -- --network preprod` once DUST is visible (Lace Generate tDUST, or wait/resync)_

Screenshot: `docs/screenshots/faucet-preprod-funded.png`

## Local undeployed (toolchain smoke test)

Verified the same Compact artifact + deploy pipeline against the local Docker stack:

- **Network:** undeployed (local node + indexer + proof-server)
- **Deployer:** `mn_addr_undeployed1h3ssm5ru2t6eqy4g3she78zlxn96e36ms6pq996aduvmateh9p9sk96u7s`
- **Contract address:** `4bc7772135ed400d3b6404e558feaf0d69b1ff1e535316300b2005b73883fb1b`

## Screenshots

- `docs/screenshots/compile-output.png` — successful compile (3 circuits)
- `docs/screenshots/faucet-preprod-funded.png` — Preprod faucet confirmation
- `docs/screenshots/deploy-address.png` — Preprod contract address (after public deploy)
