# Deployment evidence

## Preview (deployed)

- **Network:** Midnight Preview
- **Deployer (unshielded):** `mn_addr_preview17s08gxcaq3sdpp5n7k6t2vu6jug3vvy3lnyfa626rwqypxa4xh4quw5p8u`
- **Faucet:** https://midnight-tmnight-preview.nethermind.dev/
- **Faucet tx:** `0074523babca69479fc8e05afee2d82e5016bbadbc311b1668719404318fd82f2c` (5000 tNight; wallet shows 10,000 tNight total)
- **NIGHT→DUST registration:** submitted `00d05ebaa95ff553df71d9589f3f5503952527e4771ef2cfb1bbeb9e00c549a3c7` (2 UTXOs)
- **Dust receiver:** `mn_dust_preview1w0zre33ajcjhgc64hq8azsd99cw7jqpq02cun5zu383kqhd6aduzyp6dknc`
- **Contract address:** `8a9c34f505b2adf457da53a9ab24eee27495d461f2eecd03939c07288952001c`
- **Deployed at:** `2026-09-28T19:10:14.797Z`
- **Log:** `docs/evidence/preview-deploy.txt`

Screenshot: `docs/screenshots/deploy-address.png` (Preview deploy success)

## Preprod (deployed — live demo)

- **Network:** Midnight Preprod
- **Contract address:** `00b40b4eb91eb8d6375c1215e1d7746cf066a19a57f795d2894c1cd11cffbf8f`
- **Deploy tx:** `30b5bf2faa96e478b11e243e32d25070a246bffbf51efcf4c199d8c73c457db1`
- **Block height:** `2760126`
- **Verified:** Preprod indexer `contractAction(address)` returns `__typename: ContractDeploy` for this address
- **Indexer:** https://indexer.preprod.midnight.network/api/v4/graphql
- **Frontend join:** paste address on https://veil-attest.vercel.app → **Join contract**
- **Demo video:** https://drive.google.com/file/d/1Gpf3KFH0XVrotMhKWadB_BfPEkMwIgVR/view?usp=sharing

CLI/SDK Preprod deploy hit DUST sync / error 138 for some wallets; the live Preprod instance was deployed via the connected wallet path in the frontend.

## Local undeployed (toolchain smoke test)

Verified the same Compact artifact + deploy pipeline against the local Docker stack:

- **Network:** undeployed (local node + indexer + proof-server)
- **Deployer:** `mn_addr_undeployed1h3ssm5ru2t6eqy4g3she78zlxn96e36ms6pq996aduvmateh9p9sk96u7s`
- **Contract address:** `4bc7772135ed400d3b6404e558feaf0d69b1ff1e535316300b2005b73883fb1b`

## Screenshots

- `docs/screenshots/compile-evidence.html` — successful compile (3 circuits)
- `docs/screenshots/deploy-evidence.html` — Preview contract address
- `docs/screenshots/faucet-preview-funded.png` — Preview faucet confirmation (if captured)
