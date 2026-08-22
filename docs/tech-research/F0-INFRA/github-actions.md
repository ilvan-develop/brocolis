# FACTOS — GitHub Actions (Node 24 + pnpm 11)

> Fase F0. Fontes: actions/setup-node@v4 (advanced-usage.md), setup-node v6 guide (2026),
> llmbestpractices cache guide, techearl.com.

## Stack CI determinística (padrão 2026)

```yaml
- uses: actions/checkout@v4
- uses: pnpm/action-setup@v4
- uses: actions/setup-node@v4
  with:
    node-version: "24"
    cache: pnpm
- run: pnpm install --frozen-lockfile
```

Factos:
- `cache: pnpm` (no setup-node) cacheia a **pnpm store** keyed no `pnpm-lock.yaml`. O install
  continua a correr — cache acelera, não substitui.
- Ordem importa: `pnpm/action-setup` ANTES de `setup-node` para que pnpm exista quando o
  setup-node configura o cache pnpm.
- `pnpm install --frozen-lockfile` = `npm ci`: falha em drift do lockfile (determinismo).
- Implementação do root usada: `pnpm/action-setup@v4`. Em 2026 surgiu `actions/setup-node@v6`
  com auto-deteção de package manager; v4 continua suportada e estável.
- Pin de Node: sempre explícito (ex. `"24"`) — runner default muda silenciosamente.
- Em monorepo com lockfile na raiz (nosso caso), `cache-dependency-path` desnecessário.

## Versões das actions atuais (a pinar)

| Action | Versão atual | Uso no repo |
|--------|--------------|-------------|
| `actions/checkout` | `@v4` | ci.yml ✅, supply-chain.yaml ✅ |
| `pnpm/action-setup` | `@v4` | ci.yml ✅ |
| `actions/setup-node` | `@v4` (v6 disponível 2026) | ci.yml ✅ |
| `github/codeql-action` | `@v3` (init + analyze) | supply-chain.yaml ✅ |
| `gitleaks/gitleaks-action` | `@v2` | **falta** — adicionar step no CI |
| `QuiiBz/sherif` | `@v1` | **falta** — ci.yml usa `npx sherif` sem pin |

## Concorrência / cancelamento

`concurrency: group + cancel-in-progress` já presente em ci.yml — correto.

## Recomendações

1. Pinar sherif (script root `"sherif": "sherif"` + `npx sherif@2.x` no CI) para prevenir
   regressões por versão que flutua.
2. Adicionar job `security` com `gitleaks/gitleaks-action@v2` + `fetch-depth: 0`.
3. Manter CodeQL `@v3`; atualizar quando `@v4` for estável.