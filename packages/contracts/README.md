# @brocolis/contracts

Shared kernel do Brócolis: schemas Zod + futuros contratos oRPC.

Regra de ouro: **nenhuma rota sem contrato.** Todo input/output da API é
definido aqui e é a única fonte da verdade de tipos entre web, api, mobile e qa.

Regras (02-ARQUITETURA-CONTRATOS.md):
- `organizationId` + `marketCode` obrigatórios em todo input scoped.
- Zod v4; tipos derivados via `z.infer`.
- Uma versão de oRPC em todo o monorepo (catálogo pnpm).