import type { SigningKey } from "@midnight-ntwrk/compact-runtime";
import type { ContractAddress } from "@midnight-ntwrk/ledger-v8";
import { types } from "@midnight-ntwrk/midnight-js";

/**
 * In-memory PrivateStateProvider for browser demos (Edda-style).
 */
export const inMemoryPrivateStateProvider = <
  PSI extends types.PrivateStateId,
  PS,
>(): types.PrivateStateProvider<PSI, PS> => {
  const record = new Map<PSI, PS>();
  const signingKeys = {} as Record<ContractAddress, SigningKey>;

  return {
    setContractAddress(_contractAddress: ContractAddress): void {},
    set(key: PSI, state: PS): Promise<void> {
      record.set(key, state);
      return Promise.resolve();
    },
    get(key: PSI): Promise<PS | null> {
      return Promise.resolve(record.get(key) ?? null);
    },
    remove(key: PSI): Promise<void> {
      record.delete(key);
      return Promise.resolve();
    },
    clear(): Promise<void> {
      record.clear();
      return Promise.resolve();
    },
    setSigningKey(contractAddress: ContractAddress, signingKey: SigningKey): Promise<void> {
      signingKeys[contractAddress] = signingKey;
      return Promise.resolve();
    },
    getSigningKey(contractAddress: ContractAddress): Promise<SigningKey | null> {
      return Promise.resolve(signingKeys[contractAddress] ?? null);
    },
    removeSigningKey(contractAddress: ContractAddress): Promise<void> {
      delete signingKeys[contractAddress];
      return Promise.resolve();
    },
    clearSigningKeys(): Promise<void> {
      for (const key of Object.keys(signingKeys)) delete signingKeys[key as ContractAddress];
      return Promise.resolve();
    },
    exportPrivateStates(): Promise<types.PrivateStateExport> {
      return Promise.reject(new Error("exportPrivateStates is not supported by the in-memory provider"));
    },
    importPrivateStates(): Promise<types.ImportPrivateStatesResult> {
      return Promise.reject(new Error("importPrivateStates is not supported by the in-memory provider"));
    },
    exportSigningKeys(): Promise<types.SigningKeyExport> {
      return Promise.reject(new Error("exportSigningKeys is not supported by the in-memory provider"));
    },
    importSigningKeys(): Promise<types.ImportSigningKeysResult> {
      return Promise.reject(new Error("importSigningKeys is not supported by the in-memory provider"));
    },
  };
};
