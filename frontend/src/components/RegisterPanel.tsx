type Props = {
  claimText: string;
  claimHex: string;
  onClaimChange: (value: string) => void;
  onRegister: () => void;
  busy: boolean;
  canRegister: boolean;
  lastTx: string;
};

export function RegisterPanel({
  claimText,
  claimHex,
  onClaimChange,
  onRegister,
  busy,
  canRegister,
  lastTx,
}: Props) {
  return (
    <section className="panel" id="register">
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
        onChange={(e) => onClaimChange(e.target.value)}
        placeholder="e.g. inventory:sku-42:qty=1200"
      />
      <div className="stat">
        <em>Local 32-byte claim (hex) — private input only</em>
        <div className="mono">{claimHex || "—"}</div>
      </div>
      <div className="row stack-gap-top">
        <button
          className="btn btn-primary"
          type="button"
          onClick={onRegister}
          disabled={busy || !canRegister}
        >
          Call registerAttestation
        </button>
      </div>
      {lastTx && <div className="ok-msg mono">tx: {lastTx}</div>}
    </section>
  );
}
