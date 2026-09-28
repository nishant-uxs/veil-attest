/**
 * Let Preprod dust wallet sync catch up (can take ~2h), persist progress,
 * then deploy when dust.balance > 0.
 */
import { spawn } from "node:child_process";
import { WebSocket } from "ws";
(globalThis as any).WebSocket = WebSocket;

import * as Rx from "rxjs";
import { loadState, NETWORK_CONFIGS } from "../src/network.ts";
import { createWallet, persistWalletState } from "../src/wallet.ts";

const network = "preprod" as const;
const MAX_MS = Number(process.env.MIDNIGHT_DUST_SYNC_MS) || 4 * 60 * 60 * 1000;
const seed = loadState()!.wallets!.preprod!.seed!;

async function main() {
  const walletCtx = await createWallet({
    network,
    networkConfig: NETWORK_CONFIGS[network],
    seed,
    restore: true,
  });

  console.log(`Dust sync+deploy — timeout ${Math.round(MAX_MS / 60000)} min`);
  const start = Date.now();
  let lastPersist = 0;
  let lastLog = 0;

  while (Date.now() - start < MAX_MS) {
    const s: any = await Rx.firstValueFrom(walletCtx.wallet.state());
    const p = s.dust?.state?.progress ?? s.dust?.progress;
    const applied = BigInt(p?.appliedIndex ?? 0);
    const target = BigInt(p?.highestRelevantWalletIndex ?? 0);
    const dust = s.dust.balance(new Date());
    const elapsed = Math.round((Date.now() - start) / 1000);
    const pct = target > 0n ? Number((applied * 10000n) / target) / 100 : 0;

    if (elapsed - lastLog >= 30) {
      lastLog = elapsed;
      const rate = elapsed > 0 ? Number(applied) / elapsed : 0;
      const eta =
        rate > 0 && target > applied
          ? Math.round(Number(target - applied) / rate / 60)
          : "?";
      console.log(
        `${elapsed}s applied=${applied}/${target} (${pct}%) dust=${dust} eta~${eta}m`,
      );
    }

    if (Date.now() - lastPersist > 60_000) {
      await persistWalletState(network, walletCtx);
      lastPersist = Date.now();
      console.log("  (persisted wallet state)");
    }

    if (dust > 0n) {
      console.log(`DUST ready: ${dust}`);
      await persistWalletState(network, walletCtx);
      await walletCtx.wallet.stop();

      console.log("Starting deploy...");
      const child = spawn("npm", ["run", "deploy", "--", "--network", "preprod"], {
        stdio: "inherit",
        shell: true,
        env: {
          ...process.env,
          MIDNIGHT_DUST_ACCRUAL_MS: "0",
        },
      });
      const code: number = await new Promise((resolve) => child.on("exit", (c) => resolve(c ?? 1)));
      process.exit(code);
    }

    await new Promise((r) => setTimeout(r, 5000));
  }

  await persistWalletState(network, walletCtx);
  await walletCtx.wallet.stop();
  console.error("Timed out waiting for dust sync");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
