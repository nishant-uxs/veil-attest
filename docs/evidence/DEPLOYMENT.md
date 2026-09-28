# Deployment evidence

## Preview (Level 1 — deployed)

- **Network:** Midnight Preview
- **Deployer (unshielded):** `mn_addr_preview17s08gxcaq3sdpp5n7k6t2vu6jug3vvy3lnyfa626rwqypxa4xh4quw5p8u`
- **Faucet:** https://midnight-tmnight-preview.nethermind.dev/
- **Faucet tx:** `0074523babca69479fc8e05afee2d82e5016bbadbc311b1668719404318fd82f2c` (5000 tNight; wallet shows 10,000 tNight total)
- **NIGHT→DUST registration:** submitted `00d05ebaa95ff553df71d9589f3f5503952527e4771ef2cfb1bbeb9e00c549a3c7` (2 UTXOs)
- **Dust receiver:** `mn_dust_preview1w0zre33ajcjhgc64hq8azsd99cw7jqpq02cun5zu383kqhd6aduzyp6dknc`
- **Contract address:** `8a9c34f505b2adf457da53a9ab24eee27495d461f2eecd03939c07288952001c`
- **Deployed at:** `2026-09-28T19:10:14.797Z`
- **Log:** `docs/evidence/preview-deploy.txt`

Screenshot: `docs/screenshots/deploy-evidence.html` (Preview deploy success)

## Preprod (funded; DUST sync still lagging)

- **Network:** Midnight Preprod
- **Deployer (unshielded):** `mn_addr_preprod1f6dnm935n5gaua6rm0fwd8legvn9mam5k8nrkwu8kknr4mqaf79qx5ggjy`
- **Faucet:** https://midnight-tmnight-preprod.nethermind.dev/
- **Faucet tx:** `007e6b1cdc34df455011d787a746bf7ed3f524b97e532ddca119513fb14da83301` (1000 tNight)
- **tNIGHT balance:** funded
- **Blocker:** public Preprod path still hits fee/accrual issues (`dust.balance` / error 138) after registration — Preview deploy used for Level 1 instead
- **Contract address:** _n/a — use Preview address above_

Screenshot: `docs/screenshots/faucet-preprod-funded.png` (if present)

## Local undeployed (toolchain smoke test)

Verified the same Compact artifact + deploy pipeline against the local Docker stack:

- **Network:** undeployed (local node + indexer + proof-server)
- **Deployer:** `mn_addr_undeployed1h3ssm5ru2t6eqy4g3she78zlxn96e36ms6pq996aduvmateh9p9sk96u7s`
- **Contract address:** `4bc7772135ed400d3b6404e558feaf0d69b1ff1e535316300b2005b73883fb1b`

## Screenshots

- `docs/screenshots/compile-evidence.html` — successful compile (3 circuits)
- `docs/screenshots/deploy-evidence.html` — Preview contract address
- `docs/screenshots/faucet-preview-funded.png` — Preview faucet confirmation (if captured)
