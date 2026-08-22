// Fitness functions do monorepo (regra monorepo-architecture-guardian §7.3).
// Executáveis via `pnpm governance` ou no CI (scripts/fitness-check.mjs).
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

let errors = 0;
let warnings = 0;

const check = (label, fn) => {
  console.log(`[${label}]...`);
  try {
    fn();
    console.log("  OK");
  } catch (err) {
    if (err.warning) {
      console.warn(`  WARN: ${err.message}`);
      warnings += 1;
      return;
    }
    console.error(`  ERRO: ${err.message}`);
    errors += 1;
  }
};

/** Percorre packages/*\/src e apps/*\/src (ou equivalente) à procura de um padrão. */
function scanSourceFiles(pattern, { extensions = [".ts", ".tsx"] } = {}) {
  const matches = [];
  const roots = ["packages", "apps"];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const srcDir = join(root, dir.name, "src");
      if (!existsSync(srcDir)) continue;
      walk(srcDir);
    }
  }
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "generated")
          continue;
        walk(full);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        const content = readFileSync(full, "utf8");
        if (pattern.test(content)) matches.push(full);
        pattern.lastIndex = 0;
      }
    }
  }
  return matches;
}

// 1. Consistência de versões (sherif) — se instalado
check("1/6 Deriva de dependências (sherif)", () => {
  execSync("npx --no-install sherif", { stdio: "inherit" });
});

// 2. Dependências circulares (madge) — best-effort: falhas de execução do
// próprio madge (bug/incompatibilidade de versão) não são uma violação de
// governança, só um circular real detectado é. depcruise (#6) cobre o mesmo
// caso de forma mais fiável.
check("2/6 Dependências circulares (madge)", () => {
  let out;
  try {
    out = execSync(
      'npx madge --circular --ts-config ./tsconfig.base.json --extensions ts --exclude "generated/prisma" packages/ apps/',
      { encoding: "utf8", stdio: "pipe" },
    );
  } catch (err) {
    const combined = `${err.stdout ?? ""}${err.stderr ?? ""}`;
    if (/circular/i.test(combined) && !/TypeError/.test(combined)) {
      throw new Error(`madge encontrou dependências circulares:\n${combined}`);
    }
    const warnErr = new Error(
      `madge falhou a executar (não é uma violação confirmada, ver depcruise): ${err.message}`,
    );
    warnErr.warning = true;
    throw warnErr;
  }
  if (/circular/i.test(out)) {
    throw new Error(`madge encontrou dependências circulares:\n${out}`);
  }
});

// 3. Limite de pacotes (máximo 15)
check("3/6 Limite de pacotes", () => {
  const packages = readdirSync("packages", { withFileTypes: true }).filter(
    (d) => d.isDirectory() && existsSync(`packages/${d.name}/package.json`),
  );
  if (packages.length > 15) {
    throw new Error(`${packages.length} pacotes (máximo 15)`);
  }
  console.log(`  ${packages.length} pacotes`);
});

// 4. PrismaClient fora de @brocolis/db
check("4/6 PrismaClient isolado em @brocolis/db", () => {
  const hits = scanSourceFiles(/new PrismaClient/).filter(
    (f) => !f.replace(/\\/g, "/").includes("packages/db/"),
  );
  if (hits.length > 0) {
    throw new Error(`PrismaClient fora de @brocolis/db:\n${hits.join("\n")}`);
  }
});

// 5. Importações shadcn diretas fora de @brocolis/ui
check("5/6 Importações shadcn diretas", () => {
  const hits = scanSourceFiles(/from\s+["'].*@\/components\/ui/);
  if (hits.length > 0) {
    throw new Error(`Importações shadcn diretas:\n${hits.join("\n")}`);
  }
});

// 6. Fronteiras arquiteturais (dependency-cruiser): circular, apps↔apps,
// packages→apps, ui→db (AP-01/AP-03 + regra 22 do AGENTS.md).
check("6/6 Fronteiras arquiteturais (dependency-cruiser)", () => {
  execSync(
    "npx dependency-cruiser --config .dependency-cruiser.cjs --output-type err packages apps",
    { stdio: "inherit" },
  );
});

console.log("\n=========================================");
if (errors > 0) {
  console.error(
    `FALHOU — ${errors} erro(s) de governança${warnings > 0 ? ` (+${warnings} aviso(s))` : ""}`,
  );
  process.exit(1);
}
if (warnings > 0) {
  console.warn(`PASSOU com ${warnings} aviso(s) — governança do monorepo OK`);
} else {
  console.log("PASSOU — governança do monorepo OK");
}
