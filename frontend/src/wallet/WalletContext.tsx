import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  connectMidnightWallet,
  disconnectMidnightWallet,
  listWallets,
  type DetectedWallet,
  type WalletSnapshot,
} from "./midnightWallets";

type WalletContextValue = {
  connecting: boolean;
  connected: boolean;
  error: string | null;
  snapshot: WalletSnapshot | null;
  wallets: DetectedWallet[];
  walletsDetected: number;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  /** Connect a specific wallet by injection key (from listWallets). */
  connect: (walletKey: string, networkId?: string) => Promise<void>;
  /** Open picker if multiple wallets; auto-connect if exactly one. */
  connectFlow: (networkId?: string) => Promise<void>;
  disconnect: () => void;
  refreshWallets: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<WalletSnapshot | null>(null);
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const refreshWallets = useCallback(() => {
    setWallets(listWallets());
  }, []);

  useEffect(() => {
    refreshWallets();
    const t = window.setInterval(refreshWallets, 1500);
    const onFocus = () => refreshWallets();
    // Forward-looking: CAIP-282 / EIP-6963 announce (when wallets support it)
    const onAnnounce = () => refreshWallets();
    window.addEventListener("focus", onFocus);
    window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    window.addEventListener("wallet:announceProvider", onAnnounce as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    window.dispatchEvent(new Event("wallet:requestProvider"));
    return () => {
      window.clearInterval(t);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
      window.removeEventListener("wallet:announceProvider", onAnnounce as EventListener);
    };
  }, [refreshWallets]);

  const connect = useCallback(async (walletKey: string, networkId = "preprod") => {
    setConnecting(true);
    setError(null);
    try {
      const next = await connectMidnightWallet(walletKey, networkId);
      setSnapshot(next);
      setPickerOpen(false);
    } catch (e) {
      setSnapshot(null);
      setError(e instanceof Error ? e.message : "Connect failed");
      throw e;
    } finally {
      setConnecting(false);
    }
  }, []);

  const connectFlow = useCallback(
    async (_networkId = "preprod") => {
      const found = listWallets();
      setWallets(found);
      if (found.length === 0) {
        setError("No Midnight wallet found. Install 1AM or Lace and unlock it.");
        // Still open picker so install links are visible.
        setPickerOpen(true);
        return;
      }
      // Official DApp Connector guidance: let the user choose when wallets are present
      // (even a single wallet — clearer multi-wallet UX for Lace + 1AM).
      setError(null);
      setPickerOpen(true);
    },
    [],
  );

  const disconnect = useCallback(() => {
    disconnectMidnightWallet();
    setSnapshot(null);
    setError(null);
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      connecting,
      connected: !!snapshot?.connectedAPI,
      error,
      snapshot,
      wallets,
      walletsDetected: wallets.length,
      pickerOpen,
      openPicker: () => {
        refreshWallets();
        setPickerOpen(true);
      },
      closePicker: () => setPickerOpen(false),
      connect,
      connectFlow,
      disconnect,
      refreshWallets,
    }),
    [
      connecting,
      snapshot,
      error,
      wallets,
      pickerOpen,
      connect,
      connectFlow,
      disconnect,
      refreshWallets,
    ],
  );

  return createElement(WalletContext.Provider, { value }, children);
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
