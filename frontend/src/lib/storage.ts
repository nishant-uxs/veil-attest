/** Persist / restore the Preprod contract address chosen in the UI. */
const STORAGE_KEY = "veil-attest-preprod-contract";

export function loadStoredContractAddress(): string {
  if (typeof localStorage === "undefined") return "";
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function saveStoredContractAddress(address: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, address);
  } catch {
    /* private mode / quota — ignore */
  }
}
