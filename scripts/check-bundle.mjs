// Bundle budgets (F7 — blueprint 09 §Fase 7 / 18-EVAL).
// Lê scripts/budgets.json, mede tamanhos GZIP do output de build (web .next,
// mobile dist/ se existir) e falha (exit 1) se algum budget for excedido.
// Sem dependências externas: apenas node:fs/node:path/node:zlib.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const budgetsPath =
  process.env.BUDGETS_FILE ?? join(root, "scripts", "budgets.json");

const gzipSize = (buf) => gzipSync(buf).length;
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

function collectFiles(dir, exts, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // caches de build não são bundle servido ao cliente
      if (entry.name === "cache" || entry.name === "server") continue;
      collectFiles(full, exts, files);
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      files.push(full);
    }
  }
  return files;
}

function measure(target) {
  const abs = join(root, target.buildDir);
  if (!existsSync(abs)) return null;
  const js = collectFiles(abs, [".js", ".mjs"]);
  const css = collectFiles(abs, [".css"]);
  const sum = (paths) =>
    paths.reduce((acc, p) => acc + gzipSize(readFileSync(p)), 0);
  const chunks = js.map((p) => ({
    file: p.slice(root.length + 1),
    gzip: gzipSize(readFileSync(p)),
  }));
  const biggest = chunks.reduce((m, c) => (c.gzip > m.gzip ? c : m), {
    file: "-",
    gzip: 0,
  });
  return {
    present: true,
    totalJsGzip: sum(js),
    totalCssGzip: css.length ? sum(css) : 0,
    biggestChunk: biggest,
    files: js.length + css.length,
    hash: createHash("sha256")
      .update(String(sum(js)))
      .digest("hex")
      .slice(0, 12),
  };
}

let failures = 0;

for (const [name, target] of Object.entries(
  JSON.parse(readFileSync(budgetsPath, "utf8")),
)) {
  if (target.$comment || !target.buildDir) continue;
  console.log(`\n=== [${name}] ${target.buildDir} ===`);
  const m = measure(target);
  if (!m) {
    console.log(
      `  SKIP — output não encontrado (${target.buildDir}). Corre primeiro o build.`,
    );
    continue;
  }
  console.log(
    `  JS total: ${kb(m.totalJsGzip)} gzip (${m.files} ficheiros, hash ${m.hash})`,
  );
  console.log(`  CSS total: ${kb(m.totalCssGzip)} gzip`);
  console.log(
    `  Maior chunk: ${m.biggestChunk.file} → ${kb(m.biggestChunk.gzip)} gzip`,
  );

  const check = (label, actual, limit) => {
    if (limit == null) return;
    if (actual > limit) {
      console.error(`  EXCEDIDO: ${label} ${kb(actual)} > budget ${kb(limit)}`);
      failures += 1;
    } else {
      console.log(`  OK: ${label} dentro do budget (${kb(limit)})`);
    }
  };

  check("JS total", m.totalJsGzip, target.maxTotalJsGzipBytes);
  check("CSS total", m.totalCssGzip, target.maxTotalCssGzipBytes);
  check("Maior chunk", m.biggestChunk.gzip, target.maxSingleChunkGzipBytes);
}

console.log("\n=========================================");
if (failures > 0) {
  console.error(`BUNDLE BUDGETS FALHOU — ${failures} excedência(s)`);
  process.exit(1);
}
console.log("BUNDLE BUDGETS PASSOU");
