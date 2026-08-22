# ADR-0002: Layout shadcn/ui em monorepo (components.json por workspace)

- **Estado:** Aceite
- **Data:** 2026-08-20

## Contexto

O blueprint 01 fixa um `components.json` na raiz. A doc oficial do shadcn exige um
`components.json` **por workspace** (`apps/web` e `packages/ui`) para o CLI rotear
ficheiros e imports corretamente.

## Decisão

- `packages/ui` = autoritativo (`style: new-york`, Tailwind v4 com `tailwind.config: ""`).
- `apps/web/components.json` liga o css a `../../packages/ui/src/styles/globals.css`.
- Eliminar o `components.json` da raiz (evita ambiguidade do CLI). Components adicionados
  com `cd apps/web && pnpm dlx shadcn@latest add …`.

## Consequências

- UI vive em `@brocolis/ui` (regra AP-02), apps só consomem via imports `@brocolis/ui/*`.
- Exports do package expõem `components/*`, `hooks/*`, `lib/*` e `globals.css`.
- Divergência do blueprint documentada — atualizar `01` na revisão seguinte.