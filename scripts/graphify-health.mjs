import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const results = [];
const GRAPH = join(ROOT, "graphify-out", "graph.json");

function record(name, pass, detail, critical = true) {
  results.push({ name, status: pass ? "PASS" : "FAIL", detail, critical });
}
function warn(name, detail) {
  results.push({ name, status: "WARN", detail, critical: false });
}

function run(cmd, opts = {}) {
  try {
    const r = spawnSync(cmd, {
      shell: true,
      encoding: "utf8",
      timeout: 120000,
      ...opts,
    });
    return r.status === 0 ? r.stdout || "" : null;
  } catch {
    return null;
  }
}

// 1-2. CLI + version
const verOut = run("graphify --version");
const version = verOut ? verOut.trim().match(/[\d]+\.[\d]+\.[\d]+/)?.[0] : null;
record(
  "CLI",
  !!version,
  version ? `graphify ${version}` : "graphify --version falhou",
);
record("VERSION", !!version, version ?? "indeterminada");

// 3. OpenCode version (best-effort; Device Guard pode bloquear -> WARN)
const ocVer = run("opencode --version", { timeout: 15000 });
if (ocVer) record("OPENCODE", true, ocVer.trim().split("\n")[0], false);
else
  warn(
    "OPENCODE",
    "opencode --version indisponível nesta shell (ex.: Device Guard); agente ativo é prova funcional",
  );

// 4. AGENTS.md
const agents = existsSync(join(ROOT, "AGENTS.md"))
  ? readFileSync(join(ROOT, "AGENTS.md"), "utf8")
  : "";
record("AGENTS", /graphify/i.test(agents), "secção graphify em AGENTS.md");

// 5-6. Plugin + registo
const pluginPath = join(ROOT, ".opencode", "plugins", "graphify.js");
const hasPlugin = existsSync(pluginPath);
const jsonPath = join(ROOT, ".opencode", "opencode.json");
let registered = false;
if (existsSync(jsonPath)) {
  try {
    const cfg = JSON.parse(readFileSync(jsonPath, "utf8"));
    registered =
      Array.isArray(cfg.plugin) &&
      cfg.plugin.includes(".opencode/plugins/graphify.js");
  } catch {}
}
record("PLUGIN", hasPlugin, pluginPath);
record("REGISTRATION", registered, "opencode.json -> plugins[]");

// 7-9. graph.json + nodes + edges
let g = null;
try {
  g = JSON.parse(readFileSync(GRAPH, "utf8"));
} catch {}
record("GRAPH", !!g, `${GRAPH}`);
const nodes = g?.nodes?.length ?? 0;
const edges = g?.links?.length ?? 0;
record("NODES", nodes > 0, String(nodes));
record("EDGES", edges > 0, String(edges));

// 10-13. query / path / affected / explain / god-nodes (dinâmicos a partir do grafo)
const godOut = run("graphify god-nodes --top 3");
record("GOD-NODES", !!godOut && /edges/i.test(godOut), "god-nodes --top 3");

let hubLabel = null;
let hubId = null;
if (g) {
  const deg = new Map();
  for (const l of g.links) deg.set(l.target, (deg.get(l.target) || 0) + 1);
  let best = null,
    bestD = -1;
  for (const [id, d] of deg) {
    const n = g.nodes.find((x) => x.id === id);
    if (n?.source_file && n.label) {
      if (d > bestD) {
        bestD = d;
        best = n;
      }
    }
  }
  hubLabel = best?.label ?? null;
  hubId = best?.id ?? null;
}

const qOut = hubLabel ? run(`graphify query "${hubLabel}" --budget 200`) : null;
record("QUERY", !!qOut && qOut.includes("nodes found"), `query "${hubLabel}"`);

// Usa o id único do nó (não o label) — labels como "cn()" podem ser
// ambíguos entre vários ficheiros, e explain/affected exigem um alvo único.
const eOut = hubId
  ? run(`graphify explain "${hubId}"`, { timeout: 60000 })
  : null;
record("EXPLAIN", !!eOut && eOut.trim().length > 0, `explain "${hubId}"`);

const aOut = hubId ? run(`graphify affected "${hubId}" --depth 1`) : null;
record(
  "AFFECTED",
  !!aOut && /affected/i.test(aOut),
  `affected "${hubId}" --depth 1`,
);

// path entre dois nós reais distintos
{
  let pDone = false;
  if (g && hubLabel) {
    const codeNodes = [
      ...new Map(
        g.nodes
          .filter((n) => n.source_file && n.label)
          .map((n) => [n.label, n]),
      ).values(),
    ];
    const a = codeNodes.find((n) => n.label === hubLabel);
    const b = codeNodes.find(
      (n) => n.label !== hubLabel && n.source_file !== a?.source_file,
    );
    if (a && b) {
      const pOut = run(`graphify path "${a.label}" "${b.label}"`, {
        timeout: 60000,
      });
      pDone = true;
      if (pOut === null) record("PATH", false, "comando falhou");
      else if (/No directed path/i.test(pOut))
        record(
          "PATH",
          true,
          `PATH_NOT_FOUND entre "${a.label}" e "${b.label}" (resultado vazio válido)`,
          false,
        );
      else record("PATH", true, `"${a.label}" -> "${b.label}"`);
    }
  }
  if (!pDone) record("PATH", false, "nós insuficientes para testar");
}

// 14-15. freshness + rebuild infra
function newestMtime(dir, acc = { t: 0 }) {
  const SKIP = new Set([
    "node_modules",
    ".git",
    "dist",
    ".next",
    "graphify-out",
    ".turbo",
    "coverage",
  ]);
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) newestMtime(p, acc);
    else if (/\.(ts|tsx|js|mjs|prisma|md)$/.test(e.name)) {
      const t = statSync(p).mtimeMs;
      if (t > acc.t) acc.t = t;
    }
  }
  return acc;
}
if (existsSync(GRAPH)) {
  const graphT = statSync(GRAPH).mtimeMs;
  const srcT = newestMtime(ROOT).t;
  record(
    "FRESHNESS",
    srcT <= graphT,
    srcT <= graphT
      ? "nenhum ficheiro fonte mais recente que graph.json"
      : "GRAPH_STALE — correr graphify update .",
  );
}
const manifestOk = existsSync(join(ROOT, "graphify-out", "manifest.json"));
record(
  "REBUILD",
  manifestOk,
  "graphify-out/manifest.json presente (update incremental operável)",
);

// 16. Git hooks
const hookStatus = run("graphify hook status");
const hooksInstalled =
  !!hookStatus &&
  /installed/i.test(hookStatus) &&
  !/not installed/i.test(hookStatus);
record(
  "GIT HOOKS",
  hooksInstalled,
  hooksInstalled
    ? "post-commit + post-checkout + merge driver"
    : "hooks ausentes",
);

// 17. Agent integration (estrutural): plugin injeta reminder quando grafo existe
let agentStructural = false;
if (hasPlugin) {
  const src = readFileSync(pluginPath, "utf8");
  agentStructural =
    src.includes("tool.execute.before") &&
    src.includes("graph.json") &&
    src.includes("bash");
}
record(
  "AGENT INTEGRATION",
  agentStructural,
  "plugin injeta lembrete graphify em chamadas bash (estrutural)",
);

// Relatório fail-closed
const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
console.log(`\nGRAPHIFY HEALTH\n${"=".repeat(48)}`);
for (const r of results)
  console.log(`${pad(r.name, 20)} ${pad(r.status, 6)} ${r.detail}`);
console.log("=".repeat(48));
const critFail = results.some((r) => r.critical && r.status === "FAIL");
console.log(`STATUS: ${critFail ? "UNHEALTHY (fail-closed)" : "HEALTHY"}\n`);
process.exit(critFail ? 1 : 0);
