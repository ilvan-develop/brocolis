# FACTOS — F0 Infra (Docker / GitHub Actions / Supply-chain)

> Pesquisa oficial — discovery gate (regra 11 do blueprint). Aplicável a
> `docker-compose*.yml`, `.github/workflows/*`, `.husky/pre-commit`.
> Data: 2026-08-20.

## Sumário / verdict por tecnologia

| Tech | Doc oficial consultado | Verdict nos ficheiros atuais |
|------|------------------------|------------------------------|
| Docker Compose `depends_on` + healthcheck | docs.docker.com/compose/how-tos/startup-order | ⚠️ `deploy/docker-compose.test.yml` e root usam short form `depends_on` (start only). Converter p/ `condition: service_healthy` + `start_period` |
| Postgres volume mount | stackharbor + toolsops guides | ⚠️ root `docker-compose.yml` monta `/var/lib/postgresql` (funciona, mas frágil). Recomendado `/var/lib/postgresql/data` |
| `pnpm sbom` | pnpm.io/cli/sbom | ✅ Melhor que `cyclonedx-npm`: `pnpm sbom --sbom-format cyclonedx --out sbom.cdx.json` (nativo desde v11.0.0, `--out` desde v11.8.0) |
| `trivy sbom` | trivy.dev/docs/latest/target/sbom + CLI ref | ⚠️ Comando atual em `supply-chain.yaml` tem fallback duplicado; simplificar para um único scan com `--severity CRITICAL,HIGH --exit-code 1`. NÃO usa `--scanners` |
| Gitleaks | github.com/gitleaks/gitleaks (README, pre-commit-hooks) | ⚠️ blueprint §7.5 manda `pnpm gitleaks detect --staged` — comando incorreto (é binário Go, não pnpm) e o blueprint pedia `detect`; hook correto = `gitleaks git --pre-commit --redact --staged --verbose` (ou `protect --staged`) |
| Sherif | npmjs.com/package/sherif | ⚠️ `npx sherif` sem versão pinada em CI; recomendar script root + ação `QuiiBz/sherif@v1` ou versão explícita |
| GitHub Actions Node/pnpm | setup-node v4 docs + 2026 guides | ✅ ci.yml já usa `pnpm/action-setup@v4` + `actions/setup-node@v4` + `cache: pnpm` — padrão recomendado (v6 de setup-node existe em 2026; v4 continua válido) |

## Correções concretas para uma wave de implementação

1. `docker-compose.yml` (root): mudar `volumes: [brocolis-postgres17-data:/var/lib/postgresql]` → `[...:/var/lib/postgresql/data]`.
2. `deploy/docker-compose.test.yml` + demais: quando um serviço precisa de depender do Postgres/Redis, usar long form:
   ```yaml
   depends_on:
     postgres:
       condition: service_healthy
       restart: true
   ```
   e garantir `healthcheck` com `start_period` (Postgres cold boot excede janela curta → fica `unhealthy`).
3. `supply-chain.yaml`: substituir gerador por
   ```bash
   pnpm sbom --sbom-format cyclonedx --out sbom.cdx.json
   ```
   e scan único (sem fallback `||`):
   ```bash
   trivy sbom sbom.cdx.json --severity CRITICAL,HIGH --exit-code 1 --no-progress --scanners vuln
   ```
   (o fallback atual `|| trivy ... --severity CRITICAL` é código morto: `trivy sbom` com `--exit-code 1` já falha em findings acima do filtro.)
4. `.husky/pre-commit`: adicionar Gitleaks **antes** do lint-staged:
   ```bash
   gitleaks git --pre-commit --redact --staged --verbose
   ```
   (binário Go pinado, ex: `v8.24.2`; alternativa Docker `ghcr.io/gitleaks/gitleaks:8` com `--network=none` e mount read-only).
5. CI: adicionar job/step Gitleaks via `gitleaks/gitleaks-action@v2` com `fetch-depth: 0` (backstop para `--no-verify` local).
6. Sherif: no root `package.json`, script `"sherif": "sherif"` e no CI usar `npx sherif@<versão-pinada>` ou `QuiiBz/sherif@v1`.