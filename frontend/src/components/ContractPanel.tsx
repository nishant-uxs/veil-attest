import type { FoundVeilContract } from "../contract/api";
import { truncateMiddle } from "../lib/types";

type Props = {
  contractAddress: string;
  onAddressChange: (value: string) => void;
  onDeploy: () => void;
  onJoin: () => void;
  busy: boolean;
  connected: boolean;
  joined: FoundVeilContract | null;
};

export function ContractPanel({
  contractAddress,
  onAddressChange,
  onDeploy,
  onJoin,
  busy,
  connected,
  joined,
}: Props) {
  return (
    <section className="panel" id="contract">
      <h2>2. Deploy or join Preprod contract</h2>
      <p className="lead">
        Deploy a fresh VeilAttest instance with your connected wallet (pays fees in tDUST), or paste
        an existing Preprod address and join.
      </p>
      <div className="row stack-gap">
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
        onChange={(e) => onAddressChange(e.target.value)}
        placeholder="Preprod contract address"
        autoComplete="off"
        spellCheck={false}
      />
      {contractAddress.trim().length > 20 && (
        <p className="hint mono">{truncateMiddle(contractAddress.trim(), 14, 12)}</p>
      )}
      <div className="row stack-gap-top">
        <button className="btn btn-ghost" type="button" onClick={onJoin} disabled={busy || !connected}>
          {busy ? "Working…" : "Join contract"}
        </button>
        {joined && <span className="pill ok">Ready</span>}
      </div>
    </section>
  );
}
