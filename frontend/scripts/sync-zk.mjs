import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const managed = join(root, "contracts", "managed", "veil-attest");
const dest = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "midnight", "veil-attest");

for (const part of ["keys", "zkir"]) {
  const from = join(managed, part);
  const to = join(dest, part);
  if (!existsSync(from)) {
    console.error(`Missing ZK artifacts at ${from}. Run npm run compile first.`);
    process.exit(1);
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`synced ${part} -> ${to}`);
}
