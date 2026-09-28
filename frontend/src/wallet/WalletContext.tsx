import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  connectLace,
  disconnectLace,
  listWallets,
  type WalletSnapshot,
} from "./lace";

type WalletContextValue = {
  connecting: boolean;
  connected: boolean;
  error: string | null;
  snapshot: WalletSnapshot | null;
  walletsDetected: number;
  connect: (networkId?: string) => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<WalletSnapshot | null>(null);

  const connect = useCallback(async (networkId = "preprod") => {
    setConnecting(true);
    setError(null);
    try {
      const next = await connectLace(networkId);
      setSnapshot(next);
    } catch (e) {
      setSnapshot(null);
      setError(e instanceof Error ? e.message : "Connect failed");
      throw e;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectLace();
    setSnapshot(null);
    setError(null);
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      connecting,
      connected: !!snapshot?.connectedAPI,
      error,
      snapshot,
      walletsDetected: listWallets().length,
      connect,
      disconnect,
    }),
    [connecting, snapshot, error, connect, disconnect],
  );

  return createElement(WalletContext.Provider, { value }, children);
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
