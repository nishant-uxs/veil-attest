export function PrivacySplit() {
  return (
    <section className="panel" id="privacy">
      <h2>Privacy model (observable)</h2>
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
  );
}
