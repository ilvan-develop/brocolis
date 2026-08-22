// Gate de qualidade (blueprint 08/11): lint → typecheck → build → unit → governança.
// Executável via `pnpm quality:gate` ou no CI.
import { execSync } from "node:child_process";

const steps = [
  ["lint", "pnpm lint"],
  ["typecheck", "pnpm typecheck"],
  ["build", "pnpm build"],
  ["unit", "pnpm test:unit"],
  ["governança", "node scripts/fitness-check.mjs"],
];

let failed = false;

for (const [name, cmd] of steps) {
  console.log(`\n=== [${name}] ${cmd} ===`);
  try {
    execSync(cmd, { stdio: "inherit", shell: true });
  } catch {
    failed = true;
    break;
  }
}

console.log("\n=========================================");
if (failed) {
  console.error("QUALITY GATE FALHOU");
  process.exit(1);
}
console.log("QUALITY GATE PASSOU");
