import { describe, expect, it } from "vitest";
import {
  bytesToHex,
  createPrivateState,
  emptyClaim,
  stringToClaim,
  truncateMiddle,
} from "../frontend/src/lib/types";

describe("claim helpers (application)", () => {
  it("pads UTF-8 claims to exactly 32 bytes", () => {
    const claim = stringToClaim("KYC:verified:acme-corp");
    expect(claim).toHaveLength(32);
    expect(bytesToHex(claim).startsWith("4b59433a")).toBe(true);
    expect(claim[31]).toBe(0);
  });

  it("truncates long claims without throwing", () => {
    const long = "x".repeat(80);
    const claim = stringToClaim(long);
    expect(claim).toHaveLength(32);
    expect(claim.every((b) => b === "x".charCodeAt(0))).toBe(true);
  });

  it("emptyClaim is all zeroes and createPrivateState copies", () => {
    const empty = emptyClaim();
    expect(empty.every((b) => b === 0)).toBe(true);
    const src = stringToClaim("secret");
    const state = createPrivateState(src);
    src[0] = 0xff;
    expect(state.claim[0]).not.toBe(0xff);
  });

  it("truncateMiddle keeps head and tail", () => {
    const v = "0123456789abcdef0123456789abcdef";
    expect(truncateMiddle(v, 4, 4)).toBe("0123…cdef");
  });
});
