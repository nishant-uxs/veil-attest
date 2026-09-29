import { contracts } from "@midnight-ntwrk/midnight-js";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import * as VeilAttest from "../../../contracts/managed/veil-attest/contract/index.js";
import { witnesses } from "../lib/witnesses";
import {
  PRIVATE_STATE_ID,
  createPrivateState,
  emptyClaim,
  type VeilAttestPrivateState,
} from "../lib/types";
import type { VeilProviders } from "../providers/ProvidersContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const compiledContract: any = (CompiledContract.make("veil-attest", VeilAttest.Contract as any) as any).pipe(
  (CompiledContract as any).withWitnesses(witnesses),
  (CompiledContract as any).withCompiledFileAssets(
    typeof window !== "undefined"
      ? `${window.location.origin}/midnight/veil-attest`
      : "/midnight/veil-attest",
  ),
);

export type FoundVeilContract = Awaited<ReturnType<typeof contracts.findDeployedContract>>;
export type DeployedVeilContract = Awaited<ReturnType<typeof contracts.deployContract>>;

export async function deployVeilContract(
  providers: VeilProviders,
  initialClaim: Uint8Array = emptyClaim(),
): Promise<{ contract: DeployedVeilContract; address: string }> {
  const initialPrivateState = createPrivateState(initialClaim);
  await providers.privateStateProvider.set(PRIVATE_STATE_ID, initialPrivateState);

  const contract = await contracts.deployContract(providers, {
    compiledContract,
    args: [],
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState,
  });

  const address = String(contract.deployTxData.public.contractAddress);
  return { contract, address };
}

export async function joinContract(
  providers: VeilProviders,
  contractAddress: string,
  initialClaim: Uint8Array = emptyClaim(),
): Promise<FoundVeilContract> {
  const existing = await providers.privateStateProvider.get(PRIVATE_STATE_ID);
  const initialPrivateState: VeilAttestPrivateState =
    existing ?? createPrivateState(initialClaim);

  if (!existing) {
    await providers.privateStateProvider.set(PRIVATE_STATE_ID, initialPrivateState);
  }

  return contracts.findDeployedContract(providers, {
    contractAddress,
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState,
  });
}

export async function registerAttestation(
  providers: VeilProviders,
  deployed: FoundVeilContract,
  claim: Uint8Array,
): Promise<{ txHash: string; blockHeight?: number }> {
  await providers.privateStateProvider.set(PRIVATE_STATE_ID, createPrivateState(claim));
  const txData = await deployed.callTx.registerAttestation();
  return {
    txHash: String(txData.public.txHash ?? ""),
    blockHeight: txData.public.blockHeight as number | undefined,
  };
}

export async function readLedger(
  providers: VeilProviders,
  contractAddress: string,
): Promise<{ attestationCount: bigint; latestCommitment: Uint8Array } | null> {
  const state = await providers.publicDataProvider.queryContractState(contractAddress);
  if (!state) return null;
  return VeilAttest.ledger(state.data);
}
