/**
 * Fresh Preprod wallet → fund → wait for projected DUST → register → deploy.
 * Avoids error 138 from registering too soon after faucet (midnight-wallet#415).
 */
import { spawn } from "node:child_process";
import { WebSocket } from "ws";
(globalThis as any).WebSocket = WebSocket;

import * as Rx from "rxjs";
import {
  DustAddress,
  MidnightBech32m,
} from "@midnight-ntwrk/wallet-sdk";
import { getNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { unshieldedToken } from "@midnight-ntwrk/ledger-v8";
import {
  NETWORK_CONFIGS,
  getOrCreateWallet,
  loadState,
  saveState,
} from "../src/network.ts";
import { createWallet, persistWalletState } from "../src/wallet.ts";

const WAIT_BEFORE_REGISTER_MS =
  Number(process.env.MIDNIGHT_PRE_REGISTER_WAIT_MS) || 20 * 60 * 1000;
const DUST_WAIT_MS = Number(process.env.MIDNIGHT_DUST_WAIT_MS) || 20 * 60 * 1000;

async function main() {
  const state = loadState() ?? {
    version: 1 as const,
    activeNetwork: "preprod" as const,
    wallets: {},
    deployments: {},
  };
  delete state.wallets.preprod;
  state.activeNetwork = "preprod";
  saveState(state);

  const walletRec = getOrCreateWallet("preprod");
  console.log("New Preprod mnemonic created (backup .midnight-state.json)");

  const walletCtx = await createWallet({
    network: "preprod",
    networkConfig: NETWORK_CONFIGS.preprod,
    seed: walletRec.seed,
    restore: false,
  });

  const faucetTimeout = Number(process.env.MIDNIGHT_FAUCET_TIMEOUT_MS) || 15 * 60 * 1000;
  const faucetUrl = NETWORK_CONFIGS.preprod.faucet!;
  const address = walletCtx.unshieldedKeystore.getBech32Address();
  console.log(`Fund this address from Preprod faucet:\n  ${address}\n  ${faucetUrl}`);

  const startFund = Date.now();
  while (Date.now() - startFund < faucetTimeout) {
    const s: any = await Rx.firstValueFrom(walletCtx.wallet.state());
    const bal = s.unshielded?.balances?.[unshieldedToken().raw] ?? 0n;
    if (bal === 0n) {
      await new Promise((r) => setTimeout(r, 15000));
      continue;
    }
    console.log(`Funded: ${bal.toLocaleString()} tNight at ${address}`);
    break;
  }

  const s0: any = await Rx.firstValueFrom(walletCtx.wallet.state());
  if ((s0.unshielded?.balances?.[unshieldedToken().raw] ?? 0n) === 0n) {
    console.error("Still unfunded — aborting");
    process.exit(1);
  }

  console.log(
    `Waiting ${Math.round(WAIT_BEFORE_REGISTER_MS / 60000)}m for projected DUST before registration (avoids error 138)...`,
  );
  await new Promise((r) => setTimeout(r, WAIT_BEFORE_REGISTER_MS));

  const s1: any = await Rx.firstValueFrom(walletCtx.wallet.state());
  const unregistered = (s1.unshielded?.availableCoins ?? []).filter(
    (c: any) => !c.meta?.registeredForDustGeneration,
  );
  if (unregistered.length === 0) {
    console.log("No unregistered UTXOs — maybe already registered. Checking dust...");
  } else {
    const target = String(
      DustAddress.encodePublicKey(getNetworkId(), s1.dust.publicKey),
    );
    const dustReceiver = MidnightBech32m.parse(target).decode(DustAddress, getNetworkId());
    console.log(`Registering ${unregistered.length} UTXOs → ${target}`);
    try {
      const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
        unregistered,
        walletCtx.unshieldedKeystore.getPublicKey(),
        (payload: Uint8Array) => walletCtx.unshieldedKeystore.signData(payload),
        dustReceiver,
      );
      const finalized = await walletCtx.wallet.finalizeRecipe(recipe);
      const txId = await walletCtx.wallet.submitTransaction(finalized);
      console.log(`Registration submitted: ${txId}`);
    } catch (e) {
      console.error("Registration failed:", e);
      console.error("Wait longer and re-run, or use Lace Generate tDUST.");
      await persistWalletState("preprod", walletCtx);
      await walletCtx.wallet.stop();
      process.exit(1);
    }
  }

  console.log("Waiting for DUST balance > 0...");
  const dustStart = Date.now();
  while (Date.now() - dustStart < DUST_WAIT_MS) {
    const s: any = await Rx.firstValueFrom(walletCtx.wallet.state());
    const dust = s.dust.balance(new Date());
    if (dust > 0n) {
      console.log(`DUST ready: ${dust}`);
      await persistWalletState("preprod", walletCtx);
      await walletCtx.wallet.stop();
      const child = spawn(
        "npm",
        ["run", "deploy", "--", "--network", "preprod"],
        {
          stdio: "inherit",
          shell: true,
          env: { ...process.env, MIDNIGHT_DUST_ACCRUAL_MS: "5000" },
        },
      );
      const code: number = await new Promise((resolve) =>
        child.on("exit", (c) => resolve(c ?? 1)),
      );
      process.exit(code);
    }
    process.stdout.write(`\r  dust=${dust} elapsed=${Math.round((Date.now() - dustStart) / 1000)}s   `);
    await new Promise((r) => setTimeout(r, 10000));
  }

  await persistWalletState("preprod", walletCtx);
  await walletCtx.wallet.stop();
  console.error("\nTimed out waiting for DUST");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
