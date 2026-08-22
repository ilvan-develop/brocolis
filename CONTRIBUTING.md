# CONTRIBUTING.md — Como contribuir

## Estrutura

Monorepo pnpm + Turborepo. Cada pacote é um workspace. Uma versão por dependência
(catálogo em `pnpm-workspace.yaml`); nunca hardcode de versão fora do catálogo.

## Fluxo

1. Branch por fase/feature: `feat/*`.
2. PR por fase — nunca push direto para `main`.
3. Gates verdes obrigatórios: `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`,
   `node scripts/fitness-check.mjs`.
4. Regista evidência em `.ai/state/evidence.json` (pipeline autónomo).

## Commits

Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`,
`security`, `perf`, `build`, `ci`). Validado por commitlint no hook `commit-msg`.

## Hooks

`pre-commit` → lint-staged (Biome) + gitleaks (se instalado).
`pre-push` → lint + typecheck + test.

## Antes de entregar código novo

1. Pesquisar (context7/docs) se a stack não tiver skill instalada.
2. Escrever testes junto com o código.
3. Atualizar threat model (14) e data governance (15) se houver nova superfície.
4. Correr o quality gate completo: `pnpm quality:gate`.