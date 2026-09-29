type WalletSnapshotView = {
  walletName?: string;
  unshieldedAddress?: string;
  dustBalance?: string;
  proofServerUri?: string;
};

type Props = {
  snapshot?: WalletSnapshotView | null;
  count: string;
  commitment: string;
  onRefresh: () => void;
  canRefresh: boolean;
};

export function WalletLedgerGrid({
  snapshot,
  count,
  commitment,
  onRefresh,
  canRefresh,
}: Props) {
  return (
    <div className="grid-2">
      <section className="panel" id="wallet">
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

      <section className="panel" id="ledger">
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
        <button className="btn btn-ghost" type="button" onClick={onRefresh} disabled={!canRefresh}>
          Refresh ledger
        </button>
      </section>
    </div>
  );
}
