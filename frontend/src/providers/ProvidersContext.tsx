import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as ledger from "@midnight-ntwrk/ledger-v8";
import { types } from "@midnight-ntwrk/midnight-js";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { fromHex, toHex } from "@midnight-ntwrk/compact-runtime";
import { useWallet } from "../wallet/WalletContext";
import { inMemoryPrivateStateProvider } from "./inMemoryPrivateStateProvider";
import { noopProofClient, proofClient } from "./proofClient";
import type { VeilAttestCircuits, VeilAttestPrivateState } from "../lib/types";
import { PRIVATE_STATE_ID } from "../lib/types";

export type VeilProviders = types.MidnightProviders<
  VeilAttestCircuits,
  typeof PRIVATE_STATE_ID,
  VeilAttestPrivateState
>;

type ProvidersState = {
  providers?: VeilProviders;
  flowMessage?: string;
};

const ProvidersContext = createContext<ProvidersState | null>(null);

export function ProvidersProvider({ children }: { children: ReactNode }) {
  const { snapshot } = useWallet();
  const [flowMessage, setFlowMessage] = useState<string | undefined>();

  const setFlow = useCallback((msg?: string) => setFlowMessage(msg), []);

  const privateStateProvider = useMemo(
    () => inMemoryPrivateStateProvider<typeof PRIVATE_STATE_ID, VeilAttestPrivateState>(),
    [snapshot?.connectedAPI],
  );

  const zkConfigProvider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return new FetchZkConfigProvider<VeilAttestCircuits>(
      `${window.location.origin}/midnight/veil-attest`,
      fetch.bind(window),
    );
  }, [snapshot?.connectedAPI]);

  const publicDataProvider = useMemo(() => {
    const cfg = snapshot?.serviceUriConfig;
    if (!cfg?.indexerUri || !cfg?.indexerWsUri) return undefined;
    return indexerPublicDataProvider(cfg.indexerUri, cfg.indexerWsUri);
  }, [snapshot?.serviceUriConfig]);

  const proofProvider = useMemo(() => {
    const uri = snapshot?.serviceUriConfig?.proverServerUri;
    if (uri && zkConfigProvider) {
      return proofClient(uri, zkConfigProvider, (s) => {
        setFlow(s === "proveTxStarted" ? "Generating ZK proof…" : undefined);
      });
    }
    return noopProofClient();
  }, [snapshot?.serviceUriConfig, zkConfigProvider, setFlow]);

  const walletProvider: types.WalletProvider = useMemo(() => {
    const api = snapshot?.connectedAPI;
    if (!api) {
      return {
        getCoinPublicKey: () => "" as ledger.CoinPublicKey,
        getEncryptionPublicKey: () => "" as ledger.EncPublicKey,
        balanceTx: () => Promise.reject(new Error("Wallet not connected")),
      };
    }
    return {
      getCoinPublicKey(): ledger.CoinPublicKey {
        return snapshot?.shieldedCoinPublicKey as ledger.CoinPublicKey;
      },
      getEncryptionPublicKey(): ledger.EncPublicKey {
        return snapshot?.shieldedEncryptionPublicKey as ledger.EncPublicKey;
      },
      async balanceTx(
        tx: ledger.Transaction<ledger.SignatureEnabled, ledger.Proof, ledger.PreBinding>,
        _ttl?: Date,
      ): Promise<ledger.FinalizedTransaction> {
        setFlow("Signing with wallet…");
        try {
          const serializedTx = toHex(tx.serialize());
          // Lace expects options as 2nd arg so extension messaging lands correctly.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const received = await (api as any).balanceUnsealedTransaction(serializedTx, {});
          return ledger.Transaction.deserialize(
            "signature",
            "proof",
            "binding",
            fromHex(received.tx),
          );
        } finally {
          setFlow(undefined);
        }
      },
    };
  }, [snapshot, setFlow]);

  const midnightProvider: types.MidnightProvider = useMemo(() => {
    const api = snapshot?.connectedAPI;
    if (!api) {
      return {
        submitTx: () => Promise.reject(new Error("Wallet not connected")),
      };
    }
    return {
      async submitTx(tx: ledger.FinalizedTransaction): Promise<ledger.TransactionId> {
        setFlow("Submitting transaction…");
        try {
          await api.submitTransaction(toHex(tx.serialize()));
          const ids = tx.identifiers();
          return ids[0];
        } finally {
          setFlow(undefined);
        }
      },
    };
  }, [snapshot?.connectedAPI, setFlow]);

  const providers = useMemo(() => {
    if (!publicDataProvider || !zkConfigProvider) return undefined;
    return {
      privateStateProvider,
      publicDataProvider,
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    } as VeilProviders;
  }, [
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  ]);

  const value = useMemo(
    () => ({ providers, flowMessage }),
    [providers, flowMessage],
  );

  return createElement(ProvidersContext.Provider, { value }, children);
}

export function useProviders(): ProvidersState {
  const ctx = useContext(ProvidersContext);
  if (!ctx) throw new Error("useProviders must be used within ProvidersProvider");
  return ctx;
}
