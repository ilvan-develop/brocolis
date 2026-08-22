# Design System — Brócolis

> Versão canónica: `blueprint/04-DESIGN-SYSTEM.md`. Este ficheiro é o resumo operacional do `packages/ui`.

## Princípio-mãe

**Build Global. Configure Local.** — o Core nunca sabe detalhes de país. A realidade angolana entra como Market AO, nunca como `if (country === "AO")` no código.

## Princípios de design (10)

1. **Angola First** — moeda, pagamentos, endereço, telefone e WhatsApp funcionam naturalmente.
2. **Mobile First** — mobile é o canal B2C principal.
3. **Low Bandwidth** — animações mínimas, requests enxutos, imagens optimizadas.
4. **Trust First** — farmácia verificada, stock disponível, pagamento confirmado, entrega rastreável.
5. **Human Assisted** — suporte humano via WhatsApp/telefone/chat sempre acessível.
6. **Information Density** — B2B exige mais informação que B2C; a densidade varia por modelo.
7. **Progressive Disclosure** — consumidor vê o essencial; farmácia o operacional; fornecedor o comercial.
8. **Connectivity-aware** — loading, skeleton, retry, offline, cached, syncing em todos os fluxos.
9. **Low-end device awareness** — funciona em Android low-end e redes 3G/4G.
10. **Healthcare × Fintech × Marketplace × African Digital Product** — clean, trustworthy, humano. Nunca "hospitalar" nem SaaS genérico.

## Camadas de token (W3C DTCG — `design.json`)

| Camada | Propósito | Exemplo |
|--------|-----------|---------|
| Raw | Valores neutros | `color.brand.500`, `space.4`, `radius.md` |
| Semantic | Significado de produto | `color.action.primary.bg`, `color.status.success` |
| Component | Mapeamento específico | `components.button.primary.bg`, `components.card.bg` |
| State | Estados de interacção | `components.input.focus.border` |

### Domínios

```
color (brand · neutral · action · status · surface · text · border · chart)
space · radius · shadow · motion · breakpoint · font · components
```

### `tokens.css`

`/design.json → CSS variables` via `@theme inline` + vars semânticos no `:root`/`.dark`.
Importar depois de `globals.css`:

```css
@import "@brocolis/ui/globals.css";
@import "@brocolis/ui/tokens.css";
```

## Taxonomia de componentes

| Camada | Descrição | Exemplos |
|--------|-----------|----------|
| `ui/` | Raw shadcn, sem modificação | button, card, dialog, tabs |
| `primitives/` | Modificados com regras de produto | AppButton, AppInput |
| `blocks/` | Composições de página | product-card, pharmacy-card, cart-summary |
| `journey-patterns/` | Application Shells | consumer-storefront, pharmacy-portal, checkout |

## Regras de uso (AGENTS.md)

- Nunca hex cru; tokens do `design.json`.
- Texto via `t()` (`@brocolis/i18n`), nunca hardcoded no componente.
- Moeda/número/percentagem via `@brocolis/formatters`.
- Componente novo: `meta.ts` (4 pilares + `models`) + story + test.
- Mobile consome o mesmo `design.json` (NativeWind gerado).
- Core global sem país; detalhes de país só em `markets/`.