import type {
  ConnectedAPI,
  InitialAPI,
  Configuration,
  ConnectionStatus,
} from "@midnight-ntwrk/dapp-connector-api";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { firstValueFrom, interval, map, filter, take, timeout, throwError, concatMap, catchError } from "rxjs";

declare global {
  interface Window {
    midnight?: { [key: string]: InitialAPI };
  }
}

const LS_RDNS = "veil-attest-rdns";
const LS_NETWORK = "veil-attest-network";

export type WalletSnapshot = {
  initialAPI?: InitialAPI;
  connectedAPI?: ConnectedAPI;
  serviceUriConfig?: Configuration;
  status?: ConnectionStatus;
  unshieldedAddress?: string;
  shieldedCoinPublicKey?: string;
  shieldedEncryptionPublicKey?: string;
  dustBalance?: string;
  proofServerUri?: string;
};

export function listWallets(): InitialAPI[] {
  if (typeof window === "undefined" || !window.midnight) return [];
  const out: InitialAPI[] = [];
  for (const key of Object.keys(window.midnight)) {
    const w = window.midnight[key];
    if (w?.name && w?.apiVersion && typeof w.connect === "function") out.push(w);
  }
  return out;
}

function findWallet(identifier: string): InitialAPI | undefined {
  if (!window.midnight) return undefined;
  if (window.midnight[identifier]) return window.midnight[identifier];
  for (const key of Object.keys(window.midnight)) {
    const w = window.midnight[key];
    if (w?.name === identifier || (w as { rdns?: string }).rdns === identifier) return w;
  }
  return undefined;
}

export function getSavedConnection(): { rdns: string | null; networkId: string | null } {
  return {
    rdns: localStorage.getItem(LS_RDNS),
    networkId: localStorage.getItem(LS_NETWORK),
  };
}

export function clearSavedConnection(): void {
  localStorage.removeItem(LS_RDNS);
  localStorage.removeItem(LS_NETWORK);
}

export async function connectLace(networkId = "preprod", rdnsHint = "lace"): Promise<WalletSnapshot> {
  const wallets = listWallets();
  if (wallets.length === 0) {
    throw new Error("No Midnight wallet found. Install Lace (Midnight) and unlock it.");
  }

  const preferred =
    findWallet(rdnsHint) ||
    wallets.find((w) => /lace/i.test(w.name)) ||
    wallets[0];

  const { connectedAPI, initialAPI } = await firstValueFrom(
    interval(100).pipe(
      map(() => preferred),
      filter((w): w is InitialAPI => !!w),
      take(1),
      timeout({
        first: 2000,
        with: () => throwError(() => new Error("Could not find Lace wallet API")),
      }),
      concatMap(async (api) => ({
        initialAPI: api,
        connectedAPI: await api.connect(networkId),
      })),
      catchError((err) =>
        throwError(() => (err instanceof Error ? err : new Error("Wallet connection rejected"))),
      ),
    ),
  );

  const serviceUriConfig = await connectedAPI.getConfiguration();
  const status = await connectedAPI.getConnectionStatus();
  const unshielded = await connectedAPI.getUnshieldedAddress();
  const shielded = await connectedAPI.getShieldedAddresses();
  let dustBalance = "n/a";
  try {
    const dust = await connectedAPI.getDustBalance();
    dustBalance = String((dust as { balance?: unknown })?.balance ?? dust);
  } catch {
    /* optional on some connector versions */
  }

  const connectedNetwork =
    status && typeof status === "object" && "networkId" in status
      ? String((status as { networkId?: string }).networkId ?? networkId)
      : networkId;

  setNetworkId(connectedNetwork as "preprod");
  localStorage.setItem(LS_RDNS, (preferred as { rdns?: string }).rdns || preferred.name || "lace");
  localStorage.setItem(LS_NETWORK, connectedNetwork);

  return {
    initialAPI,
    connectedAPI,
    serviceUriConfig,
    status,
    unshieldedAddress: String(
      (unshielded as { unshieldedAddress?: string }).unshieldedAddress ?? unshielded,
    ),
    shieldedCoinPublicKey: String(
      (shielded as { shieldedCoinPublicKey?: string }).shieldedCoinPublicKey ?? "",
    ),
    shieldedEncryptionPublicKey: String(
      (shielded as { shieldedEncryptionPublicKey?: string }).shieldedEncryptionPublicKey ?? "",
    ),
    dustBalance,
    proofServerUri: serviceUriConfig?.proverServerUri,
  };
}

export function disconnectLace(): void {
  clearSavedConnection();
}
