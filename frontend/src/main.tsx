import { StrictMode, useEffect, useMemo, useState } from "react";
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
    () =>
      DEFAULT_CONTRACT_ADDRESS ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("veil-attest-preprod-contract") || ""
        : ""),
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

  const refreshLedger = async (addressOverride?: string) => {
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
  };

  useEffect(() => {
    if (connected && providers && contractAddress) {
      void refreshLedger().catch(() => undefined);
    }
  }, [connected, providers, contractAddress]);

  const onConnect = async () => {
    setLocalError(null);
    try {
      await connectFlow("preprod");
      setStatus("Wallet picker ready — choose 1AM or Lace on Preprod");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Connect failed");
    }
  };

  const onPickWallet = async (walletKey: string) => {
    setLocalError(null);
    try {
      await connect(walletKey, "preprod");
      setStatus(`Connected on Preprod`);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Connect failed");
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
      try {
        localStorage.setItem("veil-attest-preprod-contract", address);
      } catch {
        /* ignore */
      }
      await refreshLedger(address);
      setStatus(`Deployed on Preprod: ${truncateMiddle(address, 12, 10)}`);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Deploy failed");
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
      await refreshLedger();
      setStatus(`Joined contract ${truncateMiddle(contractAddress.trim(), 12, 10)}`);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Join failed");
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
      setLocalError(e instanceof Error ? e.message : "Circuit call failed");
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
        <div className="row">
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

      <div className="grid-2">
        <section className="panel">
          <h2>1. Wallet</h2>
          <p className="lead">
            Multi-wallet connect (Stellar-style): pick 1AM or Lace on Preprod. Service URIs come from
            the connected wallet.
          </p>
          {snapshot?.walletName && (
            <div className="stat">
              <em>Connected wallet</em>
              <div className="mono">{snapshot.walletName}</div>
            </div>
          )}
          {snapshot?.unshieldedAddress && (
            <div className="stat">
              <em>Unshielded address</em>
              <div className="mono">{snapshot.unshieldedAddress}</div>
            </div>
          )}
          {snapshot?.dustBalance && (
            <div className="stat">
              <em>Dust balance (wallet report)</em>
              <div className="mono">{snapshot.dustBalance}</div>
            </div>
          )}
          {snapshot?.proofServerUri && (
            <div className="stat">
              <em>Proof server</em>
              <div className="mono">{snapshot.proofServerUri}</div>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Public ledger</h2>
          <p className="lead">Observable on-chain state after a successful circuit call.</p>
          <div className="stat">
            <em>attestationCount</em>
            <div className="mono">{count}</div>
          </div>
          <div className="stat">
            <em>latestCommitment</em>
            <div className="mono">{commitment}</div>
          </div>
          <button className="btn btn-ghost" type="button" onClick={() => void refreshLedger()} disabled={!providers}>
            Refresh ledger
          </button>
        </section>
      </div>

      <section className="panel">
        <h2>2. Deploy or join Preprod contract</h2>
        <p className="lead">
          Deploy a fresh VeilAttest instance with your connected wallet (pays fees in tDUST), or paste
          an existing Preprod address and join.
        </p>
        <div className="row" style={{ marginBottom: 12 }}>
          <button
            className="btn btn-primary"
            type="button"
            onClick={onDeploy}
            disabled={busy || !connected}
          >
            {busy ? "Working…" : "Deploy new contract"}
          </button>
        </div>
        <label htmlFor="addr">Contract address</label>
        <input
          id="addr"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="Preprod contract address"
        />
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-ghost" type="button" onClick={onJoin} disabled={busy || !connected}>
            {busy ? "Working…" : "Join contract"}
          </button>
          {joined && <span className="pill ok">Ready</span>}
        </div>
      </section>

      <section className="panel">
        <h2>3. Register private attestation</h2>
        <p className="lead">
          The claim is a private witness. After submit we clear the form so you can verify the UI no
          longer holds the plaintext — only the public commitment remains.
        </p>
        <label htmlFor="claim">Private claim (never disclosed on-chain)</label>
        <textarea
          id="claim"
          rows={3}
          value={claimText}
          onChange={(e) => setClaimText(e.target.value)}
          placeholder="e.g. inventory:sku-42:qty=1200"
        />
        <div className="stat">
          <em>Local 32-byte claim (hex) — private input only</em>
          <div className="mono">{claimHex || "—"}</div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary"
            type="button"
            onClick={onRegister}
            disabled={busy || !joined || !claimText.trim()}
          >
            Call registerAttestation
          </button>
        </div>
        {lastTx && <div className="ok-msg mono">tx: {lastTx}</div>}
      </section>

      <section className="panel">
        <h2>Privacy claim (observable)</h2>
        <div className="privacy-split">
          <div className="privacy-box private">
            <h3>Private (witness)</h3>
            <p>
              Raw claim bytes stay in DApp private state and enter the circuit via{" "}
              <code>privateClaim()</code>. They are never written to the public ledger in cleartext.
            </p>
          </div>
          <div className="privacy-box public">
            <h3>Public (ledger)</h3>
            <p>
              Only <code>persistentHash(claim)</code> after <code>disclose()</code> and{" "}
              <code>attestationCount</code> become visible on Preprod.
            </p>
          </div>
        </div>
      </section>

      <div className="flow">{flowMessage || status}</div>
      {(error || localError) && <div className="error">{localError || error}</div>}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider>
      <ProvidersProvider>
        <AppInner />
      </ProvidersProvider>
    </WalletProvider>
  </StrictMode>,
);
