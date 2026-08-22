# DESIGN.md — Resumo do design system

Versão detalhada: `blueprint/04-DESIGN-SYSTEM.md`.

## Princípio-mãe

**Build Global. Configure Local.** O Core não conhece países; o Market AO entra
como Country Pack (AOA, Multicaixa, +244, ponto de referência, WhatsApp).

## Tokens

4 camadas W3C DTCG (raw → semantic → component → state) em `packages/ui/design.json`.
Web e Mobile (NativeWind) consomem o **mesmo** design.json — nunca paleta paralela.

## Taxonomia de componentes

| Camada | Descrição |
|--------|-----------|
| `ui/` | Raw shadcn (new-york), sem modificação |
| `primitives/` | Modificados com regras de produto |
| `blocks/` | Composições de página (ProductCard, PharmacyCard…) |
| `journey-patterns/` | Application Shells por portal |

Regra: importar sempre de `@brocolis/ui`. `meta.ts` + story + test por componente novo.

## Regras duras

- Nunca hex cru; mangas via `@brocolis/formatters`; texto via `t()`.
- `KzPrice` → `Money`; `MulticaixaButton` → `PaymentMethod`; `AngolaAddress` → `Address` + adapter.
- Acessibilidade WCAG 2.2 AA; contraste verificado em CI; touch targets ≥44px.