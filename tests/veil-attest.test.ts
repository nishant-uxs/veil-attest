import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as RT from "@midnight-ntwrk/compact-runtime";
import { Contract, ledger } from "../contracts/managed/veil-attest/contract/index.js";
import { createPrivateState, witnesses } from "../src/witnesses.js";

const MANAGED = join(process.cwd(), "contracts", "managed", "veil-attest");
const COIN = "0".repeat(64);

function claimBytes(n: number): Uint8Array {
  const a = new Uint8Array(32);
  a[31] = n;
  return a;
}

async function setup(n = 7) {
  const contract = new Contract(witnesses);
  const privateState = createPrivateState(claimBytes(n));
  const ctor = await contract.initialState(RT.createConstructorContext(privateState, COIN));
  const addr = RT.sampleContractAddress();
  // compact-runtime 0.16: (address, coinKey|zswap, contractState, privateState)
  const ctx = RT.createCircuitContext(
    addr,
    ctor.currentZswapLocalState,
    ctor.currentContractState,
    ctor.currentPrivateState,
  );
  return { contract, ctx, addr };
}

describe("VeilAttest managed artifacts", () => {
  it("has compiler, contract, keys, and zkir directories", () => {
    for (const dir of ["compiler", "contract", "keys", "zkir"]) {
      expect(existsSync(join(MANAGED, dir)), dir).toBe(true);
    }
  });

  it("lists three circuits in contract-info.json", () => {
    const info = JSON.parse(
      readFileSync(join(MANAGED, "compiler", "contract-info.json"), "utf8"),
    );
    const names = info.circuits.map((c: { name: string }) => c.name).sort();
    expect(names).toEqual([
      "getAttestationCount",
      "getLatestCommitment",
      "registerAttestation",
    ]);
    expect(info.witnesses.map((w: { name: string }) => w.name)).toEqual(["privateClaim"]);
    expect(info["runtime-version"]).toBe("0.16.0");
  });

  it("generated prover/verifier keys for each circuit", () => {
    const keys = readdirSync(join(MANAGED, "keys"));
    expect(keys).toContain("registerAttestation.prover");
    expect(keys).toContain("registerAttestation.verifier");
    expect(keys).toContain("getAttestationCount.prover");
    expect(keys).toContain("getLatestCommitment.verifier");
  });
});

describe("VeilAttest contract runtime", () => {
  it("starts with zero count and empty commitment", async () => {
    const { ctx } = await setup();
    const board = ledger(ctx.currentQueryContext.state);
    expect(board.attestationCount).toBe(0n);
    expect(board.latestCommitment.every((b: number) => b === 0)).toBe(true);
  });

  it("registerAttestation discloses a commitment and increments count", async () => {
    const { contract, ctx } = await setup(42);
    const result = await contract.impureCircuits.registerAttestation(ctx);
    const board = ledger(result.context.currentQueryContext.state);
    expect(board.attestationCount).toBe(1n);
    expect(board.latestCommitment.some((b: number) => b !== 0)).toBe(true);
  });

  it("keeps incrementing on subsequent registrations", async () => {
    const { contract, ctx } = await setup(1);
    const first = await contract.impureCircuits.registerAttestation(ctx);
    const second = await contract.impureCircuits.registerAttestation(first.context);
    const board = ledger(second.context.currentQueryContext.state);
    expect(board.attestationCount).toBe(2n);
  });
});
