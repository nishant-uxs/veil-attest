import { useEffect } from "react";
import type { DetectedWallet } from "./midnightWallets";

type Props = {
  open: boolean;
  wallets: DetectedWallet[];
  connecting: boolean;
  onSelect: (walletKey: string) => void;
  onClose: () => void;
};

function WalletIcon({ wallet }: { wallet: DetectedWallet }) {
  if (wallet.icon) {
    return <img className="wallet-icon" src={wallet.icon} alt="" width={36} height={36} />;
  }
  const label = /1am/i.test(wallet.name)
    ? "1AM"
    : /lace/i.test(wallet.name)
      ? "Lace"
      : wallet.name.slice(0, 2).toUpperCase();
  return (
    <div className="wallet-icon fallback" aria-hidden>
      {label}
    </div>
  );
}

/** Stellar-style multi-wallet picker for Midnight (1AM, Lace, …). */
export function WalletPicker({ open, wallets, connecting, onSelect, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="wallet-picker-title">Connect wallet</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="lead">
          Choose a Midnight wallet (same pattern as Freighter / xBull on Stellar). 1AM and Lace both
          work on Preprod.
        </p>

        {wallets.length === 0 ? (
          <div className="wallet-empty">
            <p>No wallet detected in this browser.</p>
            <ul>
              <li>
                Install{" "}
                <a href="https://1am.xyz" target="_blank" rel="noreferrer">
                  1AM
                </a>
              </li>
              <li>
                Or{" "}
                <a href="https://www.lace.io/" target="_blank" rel="noreferrer">
                  Lace (Midnight)
                </a>
              </li>
            </ul>
            <p className="muted">Unlock the extension, then refresh this page.</p>
          </div>
        ) : (
          <ul className="wallet-list">
            {wallets.map((w) => (
              <li key={w.key}>
                <button
                  type="button"
                  className="wallet-row"
                  disabled={connecting}
                  onClick={() => onSelect(w.key)}
                >
                  <WalletIcon wallet={w} />
                  <span className="wallet-meta">
                    <strong>{w.name}</strong>
                    <em>
                      API {w.apiVersion}
                      {w.rdns ? ` · ${w.rdns}` : ""}
                    </em>
                  </span>
                  <span className="wallet-cta">{connecting ? "…" : "Connect"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
