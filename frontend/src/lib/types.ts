export type VeilAttestPrivateState = {
  claim: Uint8Array;
};

export const PRIVATE_STATE_ID = "veil-attest-private-state" as const;

export type VeilAttestCircuits =
  | "registerAttestation"
  | "getAttestationCount"
  | "getLatestCommitment";

export const createPrivateState = (claim: Uint8Array): VeilAttestPrivateState => ({
  claim: claim.slice(0, 32),
});

export const emptyClaim = (): Uint8Array => new Uint8Array(32);

/** Encode a UTF-8 string into a fixed 32-byte claim (zero-padded). */
export function stringToClaim(input: string): Uint8Array {
  const bytes = new TextEncoder().encode(input);
  const out = new Uint8Array(32);
  out.set(bytes.slice(0, 32));
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function truncateMiddle(value: string, left = 10, right = 8): string {
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}…${value.slice(-right)}`;
}

/** Preprod contract address — set via VITE_CONTRACT_ADDRESS after deploy. */
export const DEFAULT_CONTRACT_ADDRESS =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined)?.trim() ||
  "";
