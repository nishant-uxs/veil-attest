/**
 * Network layer for Midnight.js 4.1.x
 *
 * Older Midnight checklists mention `midnight-js-network-provider`. That package
 * is not published for the 4.x toolchain. Network selection is now:
 *   1. `@midnight-ntwrk/midnight-js-network-id` → `setNetworkId` / `getNetworkId`
 *   2. Wallet DApp connector `getConfiguration()` → indexer / proof / node URIs
 *   3. Explicit Preprod fallbacks below when the wallet omits a URI
 *
 * This module is the project’s “network provider” surface for Preprod.
 */
import { getNetworkId, setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import type { Configuration } from "@midnight-ntwrk/dapp-connector-api";

export type VeilNetworkId = "preprod" | "preview" | "undeployed";

export type NetworkEndpoints = {
  networkId: VeilNetworkId;
  indexerHttp: string;
  indexerWs: string;
  nodeRpc: string;
  proofServer: string;
};

/** Canonical Preprod endpoints (Midnight public infra). */
export const PREPROD_NETWORK: NetworkEndpoints = {
  networkId: "preprod",
  indexerHttp: "https://indexer.preprod.midnight.network/api/v4/graphql",
  indexerWs: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
  nodeRpc: "https://rpc.preprod.midnight.network",
  proofServer: "https://proof.preprod.midnight.network",
};

export function applyNetworkId(id: VeilNetworkId | string = "preprod"): void {
  const normalized = String(id).toLowerCase() || "preprod";
  setNetworkId(normalized);
}

export function currentNetworkId(): string {
  try {
    return getNetworkId();
  } catch {
    return "preprod";
  }
}

/**
 * Merge wallet-reported service URIs with Preprod defaults so providers always
 * have a complete network configuration (indexer + proof server).
 */
export function resolveServiceConfig(
  walletConfig?: Configuration | null,
  preferred: VeilNetworkId = "preprod",
): NetworkEndpoints & { fromWallet: boolean; walletConfig?: Configuration } {
  const base = PREPROD_NETWORK;
  if (!walletConfig) {
    return { ...base, networkId: preferred, fromWallet: false };
  }

  const indexerHttp = walletConfig.indexerUri?.trim() || base.indexerHttp;
  const indexerWs = walletConfig.indexerWsUri?.trim() || base.indexerWs;
  const proofServer = walletConfig.proverServerUri?.trim() || base.proofServer;
  const nodeRpc = walletConfig.substrateNodeUri?.trim() || base.nodeRpc;

  return {
    networkId: preferred,
    indexerHttp,
    indexerWs,
    nodeRpc,
    proofServer,
    fromWallet: true,
    walletConfig,
  };
}

/** Build a Configuration object suitable for indexer / proof providers. */
export function toConnectorConfiguration(
  endpoints: NetworkEndpoints,
): Configuration {
  return {
    indexerUri: endpoints.indexerHttp,
    indexerWsUri: endpoints.indexerWs,
    substrateNodeUri: endpoints.nodeRpc,
    proverServerUri: endpoints.proofServer,
    networkId: endpoints.networkId,
  };
}
