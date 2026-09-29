import { StrictMode, useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { WalletProvider, useWallet } from "./wallet/WalletContext";
import { WalletPicker } from "./wallet/WalletPicker";
import { ProvidersProvider, useProviders } from "./providers/ProvidersContext";
import {
  deployVeilContract,
  joinContract,
  readLedger,
  registerAttestation,
  type FoundVeilContract,
} from "./contract/api";
import {
  DEFAULT_CONTRACT_ADDRESS,
  bytesToHex,
  stringToClaim,
  truncateMiddle,
} from "./lib/types";
import { loadStoredContractAddress, saveStoredContractAddress } from "./lib/storage";
import { ContractPanel } from "./components/ContractPanel";
import { RegisterPanel } from "./components/RegisterPanel";
import { WalletLedgerGrid } from "./components/WalletLedgerGrid";
import { PrivacySplit } from "./components/PrivacySplit";

function errMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

function AppInner() {
  const {
    connecting,
    connected,
    connect,
    connectFlow,
    disconnect,
    snapshot,
    error,
    wallets,
    walletsDetected,
    pickerOpen,
    closePicker,
  } = useWallet();
  const { providers, flowMessage } = useProviders();

  const [contractAddress, setContractAddress] = useState(
    () => DEFAULT_CONTRACT_ADDRESS || loadStoredContractAddress(),
  );
  const [claimText, setClaimText] = useState("KYC:verified:acme-corp");
  const [joined, setJoined] = useState<FoundVeilContract | null>(null);
  const [count, setCount] = useState<string>("—");
  const [commitment, setCommitment] = useState<string>("—");
  const [lastTx, setLastTx] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);

  const claimBytes = useMemo(() => stringToClaim(claimText), [claimText]);
  const claimHex = useMemo(() => bytesToHex(claimBytes), [claimBytes]);
  const walletLabel = snapshot?.walletName ?? "wallet";

  const refreshLedger = useCallback(
    async (addressOverride?: string) => {
      const address = (addressOverride ?? contractAddress).trim();
      if (!providers || !address) return;
      const ledger = await readLedger(providers, address);
      if (!ledger) {
        setCount("unavailable");
        setCommitment("unavailable");
        return;
      }
      setCount(ledger.attestationCount.toString());
      setCommitment(bytesToHex(ledger.latestCommitment));
    },
    [providers, contractAddress],
  );

  useEffect(() => {
    if (connected && providers && contractAddress) {
      void refreshLedger().catch(() => undefined);
    }
  }, [connected, providers, contractAddress, refreshLedger]);

  const onConnect = async () => {
    setLocalError(null);
    try {
      await connectFlow("preprod");
      setStatus("Wallet picker ready — choose 1AM or Lace on Preprod");
    } catch (e) {
      setLocalError(errMessage(e, "Connect failed"));
    }
  };

  const onPickWallet = async (walletKey: string) => {
    setLocalError(null);
    try {
      await connect(walletKey, "preprod");
      setStatus("Connected on Preprod");
    } catch (e) {
      setLocalError(errMessage(e, "Connect failed"));
    }
  };

  useEffect(() => {
    if (connected && snapshot?.walletName) {
      setStatus(`${snapshot.walletName} connected on Preprod`);
    }
  }, [connected, snapshot?.walletName]);

  const onDeploy = async () => {
    if (!providers) {
      setLocalError("Connect a wallet first so providers can initialize");
      return;
    }
    setBusy(true);
    setLocalError(null);
    try {
      setStatus("Deploying VeilAttest to Preprod via wallet…");
      const { contract, address } = await deployVeilContract(providers, claimBytes);
      setContractAddress(address);
      setJoined(contract as unknown as FoundVeilContract);
      saveStoredContractAddress(address);
      await refreshLedger(address);
      setStatus(`Deployed on Preprod: ${truncateMiddle(address, 12, 10)}`);
    } catch (e) {
      setLocalError(errMessage(e, "Deploy failed"));
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async () => {
    if (!providers) {
      setLocalError("Connect a wallet first so providers can initialize");
      return;
    }
    if (!contractAddress.trim()) {
      setLocalError("Paste the Preprod contract address");
      return;
    }
    setBusy(true);
    setLocalError(null);
    try {
      const found = await joinContract(providers, contractAddress.trim(), claimBytes);
      setJoined(found);
      saveStoredContractAddress(contractAddress.trim());
      await refreshLedger();
      setStatus(`Joined contract ${truncateMiddle(contractAddress.trim(), 12, 10)}`);
    } catch (e) {
      setLocalError(errMessage(e, "Join failed"));
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async () => {
    if (!providers || !joined) {
      setLocalError("Join the Preprod contract before registering");
      return;
    }
    setBusy(true);
    setLocalError(null);
    setLastTx("");
    try {
      const result = await registerAttestation(providers, joined, claimBytes);
      setLastTx(result.txHash);
      setStatus("Circuit registerAttestation succeeded — claim stayed private");
      setClaimText("");
      await refreshLedger();
    } catch (e) {
      setLocalError(errMessage(e, "Circuit call failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <WalletPicker
        open={pickerOpen}
        wallets={wallets}
        connecting={connecting}
        onSelect={(key) => void onPickWallet(key)}
        onClose={closePicker}
      />

      <header className="topbar">
        <div className="brand">
          <strong>VeilAttest</strong>
          <span>Privacy-first attestation registry · Midnight Preprod</span>
        </div>
        <div className="row topbar-actions">
          <span className={`pill ${connected ? "ok" : "warn"}`}>
            {connected
              ? `${walletLabel} connected`
              : walletsDetected
                ? `${walletsDetected} wallet(s) detected`
                : "Install 1AM or Lace"}
          </span>
          {connected ? (
            <button className="btn btn-danger" onClick={disconnect} type="button">
              Disconnect
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onConnect} disabled={connecting} type="button">
              {connecting ? "Connecting…" : "Connect wallet"}
            </button>
          )}
        </div>
      </header>

      <section className="hero">
        <h1>Prove a claim. Never show it.</h1>
        <p>
          Connect <strong>1AM</strong> or <strong>Lace</strong>, call{" "}
          <code>registerAttestation</code>, and watch only the commitment + count land on Preprod.
          The plaintext never becomes public ledger state.
        </p>
      </section>

      <WalletLedgerGrid
        snapshot={snapshot}
        count={count}
        commitment={commitment}
        onRefresh={() => void refreshLedger()}
        canRefresh={Boolean(providers)}
      />

      <ContractPanel
        contractAddress={contractAddress}
        onAddressChange={setContractAddress}
        onDeploy={() => void onDeploy()}
        onJoin={() => void onJoin()}
        busy={busy}
        connected={connected}
        joined={joined}
      />

      <RegisterPanel
        claimText={claimText}
        claimHex={claimHex}
        onClaimChange={setClaimText}
        onRegister={() => void onRegister()}
        busy={busy}
        canRegister={Boolean(joined) && Boolean(claimText.trim())}
        lastTx={lastTx}
      />

      <PrivacySplit />

      <div className="status-bar" role="status" aria-live="polite">
        <div className="flow">{flowMessage || status}</div>
        {(error || localError) && <div className="error">{localError || error}</div>}
      </div>
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <StrictMode>
    <WalletProvider>
      <ProvidersProvider>
        <AppInner />
      </ProvidersProvider>
    </WalletProvider>
  </StrictMode>,
);
