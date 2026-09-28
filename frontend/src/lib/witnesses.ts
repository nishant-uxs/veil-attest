import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type { Ledger } from "../../../contracts/managed/veil-attest/contract/index.js";
import type { VeilAttestPrivateState } from "./types";

export const witnesses = {
  privateClaim(
    context: WitnessContext<Ledger, VeilAttestPrivateState>,
  ): [VeilAttestPrivateState, Uint8Array] {
    return [context.privateState, context.privateState.claim];
  },
};
