import type {
  ConnectedAPI,
  InitialAPI,
  Configuration,
  ConnectionStatus,
} from "@midnight-ntwrk/dapp-connector-api";
import { applyNetworkId } from "../providers/networkProvider";

declare global {
  interface Window {
    midnight?: { [key: string]: InitialAPI };
  }
}

const LS_KEY = "veil-attest-wallet-key";
const LS_NAME = "veil-attest-wallet-name";
const LS_NETWORK = "veil-attest-network";

/** Detected Midnight wallet entry (Lace, 1AM, …) — Stellar-style multi-wallet list. */
export type DetectedWallet = {
  /** Injection key under window.midnight (e.g. "lace", "1am", or a UUID). */
  key: string;
  name: string;
  icon?: string;
  apiVersion: string;
  rdns?: string;
  api: InitialAPI;
};

export type WalletSnapshot = {
  walletKey: string;
  walletName: string;
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

function asRecord(w: InitialAPI): InitialAPI & { rdns?: string; icon?: string } {
  return w as InitialAPI & { rdns?: string; icon?: string };
}

/** Enumerate every Midnight wallet injected on window.midnight (official DApp Connector pattern). */
export function listWallets(): DetectedWallet[] {
  if (typeof window === "undefined" || !window.midnight) return [];
  const out: DetectedWallet[] = [];
  // Never hardcode window.midnight.mnLace — keys are often UUIDs (docs.midnight.network).
  for (const key of Object.keys(window.midnight)) {
    const api = window.midnight[key];
    if (!api || typeof api.connect !== "function") continue;
    if (!api.name || !api.apiVersion) continue;
    const meta = asRecord(api);
    out.push({
      key,
      name: api.name,
      icon: sanitizeWalletIcon(meta.icon),
      apiVersion: api.apiVersion,
      rdns: meta.rdns,
      api,
    });
  }

  // Deduplicate: same wallet can inject friendly key + UUID (Lace / 1AM).
  const seen = new Set<string>();
  const unique = out.filter((w) => {
    const id = (w.rdns || w.name).toLowerCase();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const rank = (n: string) => {
    const s = n.toLowerCase();
    if (s.includes("1am") || s === "1am") return 0;
    if (s.includes("lace")) return 1;
    return 2;
  };
  return unique.sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
}

/** Only allow safe icon URLs (data: / https:) — Midnight docs warn about XSS via icon. */
function sanitizeWalletIcon(icon?: string): string | undefined {
  if (!icon || typeof icon !== "string") return undefined;
  const v = icon.trim();
  if (v.startsWith("data:image/") || v.startsWith("https://")) return v;
  return undefined;
}

export function findWallet(keyOrName: string): DetectedWallet | undefined {
  const all = listWallets();
  return (
    all.find((w) => w.key === keyOrName) ||
    all.find((w) => w.rdns === keyOrName) ||
    all.find((w) => w.name.toLowerCase() === keyOrName.toLowerCase())
  );
}

export function getSavedWalletKey(): string | null {
  return localStorage.getItem(LS_KEY);
}

export function clearSavedConnection(): void {
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(LS_NAME);
  localStorage.removeItem(LS_NETWORK);
}

/**
 * Connect a specific Midnight wallet (Lace, 1AM, …) on the given network.
 * Pass the injection key from listWallets().
 */
export async function connectMidnightWallet(
  walletKey: string,
  networkId = "preprod",
): Promise<WalletSnapshot> {
  const detected = findWallet(walletKey);
  if (!detected) {
    throw new Error(
      `Wallet "${walletKey}" not found. Install/unlock 1AM or Lace (Midnight) and refresh.`,
    );
  }

  const connectedAPI = await detected.api.connect(networkId);
  const serviceUriConfig = await connectedAPI.getConfiguration();
  const status = await connectedAPI.getConnectionStatus();
  const unshielded = await connectedAPI.getUnshieldedAddress();
  const shielded = await connectedAPI.getShieldedAddresses();

  let dustBalance = "n/a";
  try {
    const dust = await connectedAPI.getDustBalance();
    dustBalance = String((dust as { balance?: unknown })?.balance ?? dust);
  } catch {
    /* optional */
  }

  const connectedNetwork =
    status && typeof status === "object" && "networkId" in status
      ? String((status as { networkId?: string }).networkId ?? networkId)
      : networkId;

  applyNetworkId(connectedNetwork);
  localStorage.setItem(LS_KEY, detected.key);
  localStorage.setItem(LS_NAME, detected.name);
  localStorage.setItem(LS_NETWORK, connectedNetwork);

  return {
    walletKey: detected.key,
    walletName: detected.name,
    initialAPI: detected.api,
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

export function disconnectMidnightWallet(): void {
  clearSavedConnection();
}

/** @deprecated use connectMidnightWallet */
export const connectLace = (networkId = "preprod", rdnsHint = "lace") =>
  connectMidnightWallet(rdnsHint, networkId);

/** @deprecated use disconnectMidnightWallet */
export const disconnectLace = disconnectMidnightWallet;
