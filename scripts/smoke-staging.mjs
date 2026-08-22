// Smoke tests de staging (F7 — blueprint 09 §Fase 7: deploy + smoke + readiness).
// Sem dependências: apenas fetch nativo (Node >= 18).
// Exit codes: 0 = passou; 1 = falhou; 2 = configuração inválida.
const API_URL = process.env.SMOKE_API_URL ?? "https://staging-api.brocolis.ao";
const WEB_URL = process.env.SMOKE_WEB_URL ?? "https://staging.brocolis.ao";
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 10_000);
const RETRIES = Number(process.env.SMOKE_RETRIES ?? 3);

if (!/^https?:\/\//.test(API_URL) || !/^https?:\/\//.test(WEB_URL)) {
  console.error(
    "CONFIG INVÁLIDA: SMOKE_API_URL e SMOKE_WEB_URL têm de ser URLs http(s).",
  );
  process.exit(2);
}

async function fetchWithRetry(url, { retries = RETRIES } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "user-agent": "brocolis-smoke/1.0" },
      });
      clearTimeout(timer);
      return { res, attempt };
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }
  throw lastError;
}

let failures = 0;

async function check(label, url, validate) {
  const started = Date.now();
  try {
    const { res, attempt } = await fetchWithRetry(url);
    const ms = Date.now() - started;
    const body = await res.text();
    const problem = validate(res, body);
    if (problem) {
      console.error(
        `[FALHOU] ${label} → HTTP ${res.status} (${ms}ms): ${problem}`,
      );
      failures += 1;
    } else {
      console.log(
        `[OK] ${label} → HTTP ${res.status} (${ms}ms, tentativa ${attempt})`,
      );
    }
  } catch (err) {
    console.error(
      `[FALHOU] ${label} → ${url}: ${err.cause?.code ?? err.message}`,
    );
    failures += 1;
  }
}

console.log(`Smoke staging → api=${API_URL} web=${WEB_URL}\n`);

await check("API /health", `${API_URL}/health`, (res, body) => {
  if (res.status !== 200) return `esperado 200`;
  try {
    const json = JSON.parse(body);
    if (json.status !== "ok") return `status="${json.status}", esperado "ok"`;
    if (json.service !== "brocolis-api")
      return `service="${json.service}", esperado "brocolis-api"`;
  } catch {
    return "corpo não é JSON válido";
  }
  return null;
});

await check("Web /", `${WEB_URL}/`, (res, body) => {
  if (res.status !== 200) return `esperado 200`;
  if (!body.includes("<html")) return "resposta não parece HTML";
  return null;
});

console.log("\n=========================================");
if (failures > 0) {
  console.error(
    `SMOKE FALHOU — ${failures} endpoint(s) indisponível(is). NÃO promover para produção.`,
  );
  process.exit(1);
}
console.log("SMOKE PASSOU — staging pronto");
