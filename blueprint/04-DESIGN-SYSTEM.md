# 04 — Africa Pharmacy Commerce Design System

> Aplica-se à **Fase F-DS (obrigatória antes de qualquer UI de produto)**. Define o design system do Brócolis como **infraestrutura de produto** — um único sistema visual para Web, Mobile, Admin, Pharmacy Portal, Supplier Portal e Business Portal, suportando **B2C + B2B + B2B2C** simultaneamente, **Angola-first e Africa by design**. **Implementa as experiências definidas em `03-EXPERIENCE-ARCHITECTURE.md`**: os journey-patterns aqui são as telas oficiais dos Experience Modules, nunca inventados.

---

## 1. Princípio-mãe

> **Build Global. Configure Local.**

O Core nunca sabe detalhes de um país. A realidade angolana (AOA, Multicaixa, ponto de referência, +244, WhatsApp, conectividade variável) entra como **Market AO** — a primeira implementação —, nunca como `if (country === "AO")` no código.

Isto significa:

| ❌ Não | ✅ Sim |
|--------|--------|
| `KzPrice` | `Money` + formatter (AOA/MZN/BRL) |
| `AngolaAddress` | `Address` + `CountryAddressAdapter` |
| `MulticaixaButton` | `PaymentMethod` + provider adapter |
| `angola-green` token | `color.brand.primary` com overrides por tenant |

## 2. Princípios de design (10)

1. **Angola First** — tudo funciona naturalmente em Angola (moeda, pagamentos, endereço, telefone, WhatsApp).
2. **Mobile First** — o mobile é o canal B2C principal; web/desktop para operações.
3. **Low Bandwidth** — funciona razoavelmente em redes lentas: imagens optimizadas, animações mínimas, requests enxutos.
4. **Trust First** — farmácia verificada, produto disponível, receita validada, pagamento confirmado, entrega rastreável — sempre visível.
5. **Human Assisted** — o utilizador pode sempre falar com suporte via WhatsApp/telefone/chat.
6. **Information Density** — B2B exige mais informação que B2C; a densidade varia por modelo, nunca a linguagem visual.
7. **Progressive Disclosure** — consumidor vê o essencial; farmácia vê o operacional; fornecedor vê o comercial/logístico; admin vê tudo.
8. **Connectivity-aware** — loading, skeleton, retry, offline, cached, syncing em todos os fluxos.
9. **Low-end device awareness** — funciona em Android low-end, 3G/4G, ecrãs pequenos, memória limitada.
10. **Healthcare × Fintech × Marketplace × African Digital Product** — clean, trustworthy, modern, human, profissional. Nunca "hospitalar" nem SaaS genérico.

## 3. Estrutura (26 secções → 6 domínios)

```
AFRICA PHARMACY COMMERCE DESIGN SYSTEM
│
├── CORE
│   ├── Principles · Brand · Tokens · Foundations
│   ├── Accessibility · Content (pt-AO first) · Motion
│
├── UI
│   ├── Primitives · Commerce · Healthcare · Pharmacy
│   ├── Prescription · Inventory · Procurement · Payments · Logistics · Orders · Administration
│
├── EXPERIENCE
│   ├── B2C Patterns · B2B Patterns · B2B2C Patterns
│   ├── Mobile · Web · Operations
│
├── AFRICA PACKS
│   ├── Country Packs · Payment Packs · Regulatory Packs
│   ├── Localization Packs · Logistics Packs
│
├── MARKETS
│   ├── Angola (referência) · Moçambique · Nigéria · Quénia · Gana · África do Sul · …
│
└── GOVERNANCE
    ├── Contribution · Versioning · Accessibility · Compliance · Quality
```

## 4. Estrutura de `packages/ui` (2026 AI-ready)

```
packages/ui/
├── design.json              # Tokens W3C DTCG (o agente lê primeiro)
├── tokens.css               # CSS variables runtime (Tailwind v4 @theme inline)
├── tokens.json              # Export W3C DTCG
├── DESIGN.md                # Spec de design
├── copywriting.md           # Regras de voz e tom pt-AO
├── specs/
│   ├── foundations/  tokens/  atoms/  molecules/  organisms/
│   └── markets/ao/  markets/mz/  markets/ke/
├── components/
│   ├── ui/                  # Raw shadcn
│   ├── primitives/          # Modificados / product-aware
│   ├── blocks/              # Composições de produto
│   └── <dominio>/           # commerce, pharmacy, prescription, inventory, procurement, payment, logistics, orders
│       ├── <componente>.tsx
│       ├── <componente>.meta.ts   # 4 pilares (obrigatório)
│       ├── <componente>.stories.tsx
│       └── <componente>.test.tsx
├── journey-patterns/        # Application Shells por portal
│   ├── consumer-storefront/ pharmacy-portal/ supplier-portal/
│   ├── business-portal/ admin-console/ checkout/
│   ├── prescription-flow/ procurement/ delivery-tracking/
├── lib/utils.ts             # cn() (clsx + tailwind-merge)
├── nativewind/              # tokens → config Tailwind para RN
└── index.ts
```

> **Mobile (NativeWind) consome o mesmo `design.json`.** Um script gera `tailwind.config` a partir dos tokens. Nunca paleta paralela no app mobile.

### Taxonomia de componentes

| Camada | Descrição | Exemplos |
|--------|-----------|----------|
| **ui/** | Raw shadcn, sem modificação | button, dialog, table, dropdown-menu |
| **primitives/** | Modificados com regras de produto | `AppButton`, `AppInput` |
| **blocks/** | Composições de página | product-card, pharmacy-card, order-table, cart-summary |
| **journey-patterns/** | Application Shells de produto | consumer-storefront, pharmacy-portal, checkout |

> Regra: nunca importar `Button`/`Dialog` directo espalhado pela app. Importar do `@brocolis/ui`. Reutilizar blocks e journey-patterns; nunca desenhar ecrãs improvisados.

---

## 5. Design tokens (4 camadas, W3C DTCG)

| Camada | Propósito | Exemplo |
|--------|-----------|---------|
| **Raw** | Valores neutros | `color.blue.500`, `space.4`, `radius.md` |
| **Semantic** | Significado de produto | `color.action.primary.bg`, `spacing.body.lg` |
| **Component** | Mapeamento específico | `button.primary.bg`, `card.border` |
| **State** | Estados de interacção | `button.primary.hover.bg`, `input.focus.border` |

### Domínios de token

```
tokens/
├── global/      spacing, radius, shadows, motion, breakpoints
├── semantic/    action, status, surface, text, border
├── brand/       color.brand.primary (overrides por tenant)
├── commerce/    price, discount, stock, promo
├── healthcare/  prescription, medicine, warning, controlled
├── pharmacy/    verification, opening-hours, distance
├── logistics/   delivery, zone, eta, tracking
└── financial/   currency, locale, country, phone, measurement
```

### Tokens de domínio Angola (Market AO)

```json
{
  "financial": {
    "currency": { "$value": "AOA", "$type": "string", "description": "Moeda do mercado" },
    "locale": { "$value": "pt-AO", "$type": "string" },
    "country": { "$value": "AO", "$type": "string" }
  },
  "phone": {
    "countryCode": { "$value": "+244", "$type": "string" }
  },
  "address": {
    "country": { "$value": "AO", "$type": "string" },
    "referencePoint": { "$value": "required", "$type": "string" }
  },
  "delivery": {
    "defaultUnit": { "$value": "km", "$type": "string" },
    "zones": { "$value": ["urban", "suburban"], "$type": "string[]" }
  },
  "measurement": {
    "locale": { "$value": "pt-AO", "$type": "string" }
  }
}
```

### `design.json` (exemplo)

```json
{
  "color": {
    "action": {
      "primary": {
        "bg": { "$value": "{color.brand.600}", "$type": "color", "description": "Fundo de CTAs primários", "allowedComponents": ["button.primary", "link.primary"], "contrastPair": "{color.text.on-primary}" }
      }
    }
  },
  "space": {
    "body": { "lg": { "$value": "1rem", "$type": "dimension" } }
  }
}
```

### `tokens.css` (Tailwind v4 `@theme inline`)

```css
@theme inline {
  --color-background: var(--background);
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --radius-lg: var(--radius);
}

:root {
  --background: 0 0% 100%;
  --primary: 152 85% 32%;        /* verde Brócolis, brand color, não dominante */
  --radius: 0.625rem;
}
```

---

## 6. Moeda e formatação

**Nunca** permitir que cada componente formate dinheiro à sua maneira. Um único formatter global em `@brocolis/formatters`.

```ts
formatCurrency(amount, { currency: "AOA", locale: "pt-AO" }); // 12 500 Kz
formatCurrency(12500, { currency: "MZN", locale: "pt-MZ" });  // 12 500 MT
formatCurrency(12500, { currency: "BRL", locale: "pt-BR" });  // R$ 12.500,00
```

Componentes de formatação global: `Money`, `Date`, `Time`, `Number`, `Percentage`, `PhoneNumber`, `Address`, `Measurement`.

```tsx
<Money amount={12500} currency="AOA" />   {/* 12 500 Kz */}
<PhoneNumber value="923000000" countryCode="+244" />  {/* +244 923 000 000 */}
```

---

## 7. Preços por modelo

```
B2C        12 500 Kz
B2B        Preço unitário 12 500 Kz · 50 un 11 800 Kz · 100 un 10 900 Kz
B2B2C      Preço público 12 500 Kz · Preço parceiro 11 500 Kz · Margem estimada 8,7%
```

Um único componente com `model`:

```tsx
<ProductCard model="b2b" />        {/* revela SKU, EAN, lote, MOQ, lead time */}
<ProductCard model="b2c" />        {/* revela preço, stock, entrega */}
<ProductCard model="wholesale" />  {/* revela tabela de volume */}
```

---

## 8. Pagamentos Angola (família)

`PaymentMethod` + adapters por mercado. Nunca `MulticaixaButton`.

```
PaymentMethod | PaymentSelector | PaymentProvider | PaymentStatus | PaymentInstructions
providers/angola/ → multicaixa · tpa · bank-transfer · reference · wallet · cod
```

Estados de pagamento (não apenas `paid/unpaid`):

```
PENDING            pagamento pendente
PROCESSING         em processamento
CONFIRMED          confirmado
EXPIRED            expirado
DECLINED           recusado
REFUNDED           reembolsado
```

---

## 9. Endereço angolano

`Address` global + `CountryAddressAdapter`. Angola usa:

```
Province → Municipality → District/Commune → Neighborhood → Street → House Number
Ponto de referência (obrigatório) · Latitude · Longitude · Contact Name · Contact Phone
```

> "Depois do mercado, ao lado da escola..." — o ponto de referência é operacionalmente mais útil que um endereço formal.

## 10. Delivery Design System

```
DeliveryAddress · DeliveryZone · DeliveryFee · DeliveryEstimate · DeliveryMethod
DeliveryStatus · DriverTracking · DeliveryProof
```

Estados: `AVAILABLE → PREPARING → READY_FOR_PICKUP → PICKED_UP → IN_TRANSIT → ARRIVING → DELIVERED · FAILED · CANCELLED`

## 11. Telefone

Angola por defeito, E.164 internamente:

```ts
normalizePhone("923 000 000", "AO") // "+244923000000"
```

UI com prefixo: `+244 [ 923 000 000 ]` e validação específica do mercado.

## 12. WhatsApp como canal de produto

Não é um link, é um canal operacional:

```
Pedido #ANG-10293
[ Ver pedido ] [ Falar com a farmácia ] [ Falar com suporte via WhatsApp ]
```

Componentes: `WhatsAppOrderSupport`, `WhatsAppDeliverySupport`, `WhatsAppPrescriptionSupport`.

## 13. Verificação de farmácia

Confiança explícita e visual:

```
✓ Farmácia verificada
Níveis: VERIFIED · PREMIUM_VERIFIED · PENDING_VERIFICATION · SUSPENDED
```

Perfil:

```
Farmácia Central  ✓ Farmácia verificada
Luanda · Aberta agora · ★ 4.8 · 2.4k produtos
```

## 14. Produto farmacêutico

```
Nome · Princípio ativo · Dosagem · Forma farmacêutica · Apresentação
Fabricante · Origem · Preço · Stock · Farmácia · Necessita receita?
```

```
┌────────────────────────────┐
│       PRODUCT IMAGE        │
├────────────────────────────┤
│ Paracetamol 500 mg         │
│ 20 comprimidos             │
│ 2 500 Kz                   │
│ ✓ Em stock                 │
│ Farmácia X ✓               │
│ [ Adicionar ]              │
└────────────────────────────┘
```

## 15. Receita médica

```
Prescription: Upload · Camera · Gallery · Validation · Pharmacist Review · Approval · Rejection
```

Mobile: `[ 📷 Fotografar receita ]` ou `[ 📁 Enviar documento ]`.

Status: `🟡 Em análise · 🟢 Receita aprovada · 🔴 Receita rejeitada · ⚪ Receita expirada`

## 16. B2B angolano (procurement profissional)

O B2B parece um sistema de procurement, não uma loja B2C gigante:

```
Catálogo · Fornecedores · Preços · Cotações · Pedidos · Stock · Faturas · Pagamentos · Crédito · Procurement
```

Compra por volume:

```
Paracetamol 500mg
1–49      2 500 Kz
50–99     2 250 Kz
100–499   2 050 Kz
500+      1 850 Kz
MOQ · Lead Time · Stock · Validade · Lote · Fornecedor
```

Fluxo de procurement:

```
RFQ → Quotation → SupplierOffer → QuoteComparison → PurchaseOrder → ApprovalFlow
```

## 17. Multi-tenant por papel

A UI adapta-se ao papel da organização:

```
Owner → tudo
Admin → utilizadores/permissões
Buyer → criar pedidos
Pharmacist → receitas/dispensa
Finance → pagamentos/faturas
Inventory → stock
Viewer → leitura
```

## 18. B2B2C marketplace

O sistema mostra **quem é responsável por cada etapa**:

```
Pedido #ANG-23921
Cliente: João · Farmácia: ✓ Farmácia Central · Fornecedor: Distribuidor X
Entrega: Motoboy Y · Status: Preparando pedido
```

## 19. Geografia de Angola

Componentes preparados para `Province → Municipality → District → Neighborhood → Delivery Zone`. As **18 províncias** no Market AO:

```
Luanda · Benguela · Huíla · Huambo · Cabinda · Namibe · Kwanza Sul · Kwanza Norte
Malanje · Uíge · Zaire · Bengo · Bié · Cuando Cubango · Cunene · Lunda Norte · Lunda Sul · Moxico
```

## 20. Conectividade (offline / pobre)

Estados obrigatórios: `loading · skeleton · retry · offline · cached · syncing · partial-data · connection-error`.

```
⚠️ Sem conexão
Algumas informações podem estar desatualizadas.
[ Tentar novamente ]

Pedido guardado localmente
🟡 A sincronizar...
```

## 21. Content Design System (pt-AO)

Evitar anglicismos; Português de Angola primeiro.

| ❌ | ✅ |
|----|----|
| Checkout | Finalizar pedido |
| Shipping | Entrega |
| Order | Pedido |
| Cart | Carrinho |

`copywriting.md` fixa a voz; texto nunca dentro de componentes (sempre via `t()`).

## 22. Internacionalização global

```
GLOBAL → COUNTRY → REGION → LOCALE → TENANT
```

- `i18n/` com `pt-AO`, `pt-MZ`, `en-NG`, `en-GH`, `en-KE`, `en-ZA`, `sw-KE`, `sw-TZ`, `fr-SN`, `fr-CI`, `ar-EG`, `ar-MA`.
- **LTR e RTL** suportados (Norte de África).
- Componentes: `<Button>{t("commerce.cart.add")}</Button>` — nunca texto hardcoded.

## 23. Brand vs Country vs Tenant

```
PLATFORM (Global Brand) → COUNTRY (AO) → TENANT (Farmácia A/B)
```

Tenant pode personalizar Logo, Primary Color, Store Identity sem quebrar o DS.

---

## 24. Meta-dados por componente (`meta.ts` — 4 pilares)

Todo componente novo shipa `meta.ts` (obrigatório por AGENTS.md):

```ts
export const meta = {
  category: "block" as const,          // atom | molecule | organism | block | data_display | financial_operation | journeyPattern
  models: ["b2c", "b2b", "b2b2c"] as const,   // em que modelos o componente é válido
  purpose: "Mostra um produto com preço, stock e farmácia. Variante b2b revela dados de procurement.",
  variants: ["b2c", "b2b", "wholesale"],
  props: { model: "b2c | b2b | wholesale", currency: "AOA | MZN | ..." },
  relationships: ["cart", "product-detail", "pharmacy-card"],
  tokens: { background: "color.action.primary.bg", text: "color.text.on-primary" },
  antiPatterns: [
    "formatar moeda dentro do componente",
    "hardcode de cor",
    "texto de país hardcoded (usar markets/i18n)",
  ],
  accessibility: { keyboard: "Enter/Space", focus: "focus ring visível" },
} as const;
```

---

## 25. Acessibilidade (WCAG 2.2 AA)

| Requisito | Implementação |
|-----------|---------------|
| Contraste | Contrast pairs verificados em CI (tokens) |
| Keyboard | Radix gerido; focus-visible nunca removido |
| Screen readers | `aria-label` obrigatório em ícones só |
| Touch targets | ≥44×44px (48dp em healthcare) |
| Form errors | `aria-invalid`, `aria-describedby` |
| Focus trap | Dialogs/sheets com focus trap + body scroll lock |
| Ferramentas | `@axe-core/react` (dev) + Playwright a11y (CI) |

## 26. Validação do design system em CI

- Schema de tokens vs DTCG
- Resolução semantic→raw
- Contrast pairs WCAG 2.2 AA
- Snapshot CSS
- `meta.ts` obrigatório em componente novo
- Anti-pattern lint (hex, hardcode de moeda/pais)
- **Core nunca importa `markets`**: auditoria que falha se um bloco do Core referencia país.

---

## 27. Regras que entram no `AGENTS.md`

- Nunca hex cru; tokens do `design.json`.
- `Money`/`PhoneNumber`/`Address`/`Percentage` sempre via `@brocolis/formatters`.
- Texto via `t()` (`@brocolis/i18n`), nunca hardcoded.
- Componente novo: `meta.ts` + story + test; indicar `models`.
- Mobile consome os mesmos tokens (NativeWind gerado).
- Core global sem país; detalhes de país só em `markets/`.
- Journey-patterns oficiais: consumer-storefront, pharmacy-portal, supplier-portal, business-portal, admin-console, checkout, prescription-flow, procurement, delivery-tracking. Nunca improvisar.

---

## 28. Anti-patterns de design system (proibidos)

| Anti-pattern | Correto |
|--------------|---------|
| `KzPrice` / moeda hardcoded | `Money` + formatter |
| `AngolaAddress` | `Address` + adapter |
| `MulticaixaButton` | `PaymentMethod` + provider |
| `if (country === "AO")` no Core | Country Pack em `markets/` |
| Temas separados por portal | Um token set, variantes por modelo |
| Texto em componente | `t()` via i18n |
| Paleta mobile paralela | NativeWind gerado do `design.json` |
| 12 variantes de botão | 4 variantes semânticas |
| Hex hard-coded | Token semântico |
| Admin/Portal improvisado | journey-patterns oficiais |
| Componente duplicado por portal | Reutilizar blocks com `model` |

---

## 29. Design System Tooling Enterprise

### 29.1 Figma como Source of Truth

| Regra | Implementação |
|-------|---------------|
| Design tokens do Figma sincronizam para `design.json` | Script de sync automático |
| Componentes criados primeiro no Figma | Figma → code, nunca code → Figma |
| Variants no Figma mapeiam para `meta.ts` | Naming convention partilhada |
| Review de design antes de implementar | Figma comment → approval → code |

```bash
# Sync de tokens Figma → design.json
pnpm figma-tokens-sync --config figma-sync.config.json
```

### 29.2 Visual Regression Testing

| Ferramenta | Uso | Gate |
|------------|-----|------|
| Chromatic | Visual diffs de stories | Warn se diff > 1% |
| Percy | Screenshots cross-browser | Warn se diff > 1% |
| Storybook test-runner | Snapshot automático | Block se regressão visual |

```yaml
# .github/workflows/visual-regression.yml
- name: Run Chromatic
  uses: chromaui/action@v1
  with:
    projectToken: ${{ secrets.CHROMATIC_TOKEN }}
    exitOnceUploaded: true
    onlyChanged: true
```

### 29.3 Component Performance Budgets

| Componente | Render Time | Bundle Size | Target |
|------------|-------------|-------------|--------|
| Button | < 5ms | < 2KB | Block |
| ProductCard | < 15ms | < 8KB | Block |
| OrderTable | < 30ms | < 15KB | Warn |
| Checkout | < 50ms | < 25KB | Warn |
| Dashboard | < 100ms | < 40KB | Warn |

```ts
// Component performance budget
export const COMPONENT_BUDGETS = {
  button: { renderTimeMs: 5, bundleSizeKB: 2 },
  productCard: { renderTimeMs: 15, bundleSizeKB: 8 },
  orderTable: { renderTimeMs: 30, bundleSizeKB: 15 },
  checkout: { renderTimeMs: 50, bundleSizeKB: 25 },
} as const;
```

### 29.4 A/B Testing Infrastructure

```ts
// Feature flags para design experiments
export interface DesignExperiment {
  id: string;
  name: string;
  variants: string[];
  traffic: number; // 0-100%
  metrics: string[];
}

export const EXPERIMENTS: DesignExperiment[] = [
  {
    id: 'checkout-layout',
    name: 'Checkout Layout',
    variants: ['single-page', 'multi-step'],
    traffic: 50,
    metrics: ['completionRate', 'timeToComplete'],
  },
  {
    id: 'product-card-density',
    name: 'Product Card Density',
    variants: ['compact', 'comfortable'],
    traffic: 30,
    metrics: ['clickThroughRate', 'addToCartRate'],
  },
];
```

### 29.5 Design System Metrics

| Métrica | Target | Medição |
|---------|--------|---------|
| Component adoption rate | > 80% | Componentes usados / total |
| Token utilization | > 90% | Tokens usados / disponíveis |
| Custom overrides | < 5% | Overrides / total de styles |
| Visual regressions | 0 por release | Chromatic diffs |
| Accessibility score | 100% AA | axe-core scan |
