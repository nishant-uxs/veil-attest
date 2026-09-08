import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger } from "../contracts/managed/veil-attest/contract/index.js";

/** Private DApp state carrying the raw claim bytes. */
export type VeilAttestPrivateState = {
  claim: Uint8Array;
};

export const createPrivateState = (claim: Uint8Array): VeilAttestPrivateState => ({
  claim: claim.slice(0, 32),
});

export const witnesses = {
  privateClaim(
    context: WitnessContext<Ledger, VeilAttestPrivateState>,
  ): [VeilAttestPrivateState, Uint8Array] {
    return [context.privateState, context.privateState.claim];
  },
};
