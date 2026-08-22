# 00 — Visão de Produto

> Aplica-se a **todas as fases**. Define a visão do Brócolis, os modelos comerciais, os 5 produtos, a monetização, a estratégia de mercados e a conformidade.

---

## 1. A visão

O Brócolis é **o sistema operativo do comércio farmacêutico em África**, começando por Angola.

```
Healthcare × Commerce × Fintech × Logistics × Marketplace
```

Não é "uma farmácia online". É um marketplace que liga **consumidores, farmácias, clínicas, hospitais, empresas, distribuidores e fornecedores** num só ecossistema, com pagamentos processados pela **FinPay** (processadora nativa angolana) e um design system que funciona em 5 superfícies sem fragmentação.

### Posicionamento

| Alvo | Valor |
|------|-------|
| Consumidor (B2C) | Aceder a medicamentos com confiança, comparar preço, receita digital, entrega urbana |
| Farmácia (B2B/B2C) | Loja digital, gestão de stock/lotes, pedidos, vendas, settlements |
| Clínica/Hospital/Empresa (B2B) | Procurement, cotações, crédito, aprovação, faturação |
| Distribuidor/Fornecedor (B2B) | Catálogo, preços por volume, pedidos, logística |
| Plataforma (B2B2C) | Network consumer → farmácia → distribuidor, com compliance e operações |

**Moeda:** AOA (Kz), locale pt-AO, formatação única via `@brocolis/formatters`.

---

## 2. Os 3 modelos comerciais

```
                    AFRICA PHARMACY PLATFORM
                              │
                       GLOBAL CORE
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
       B2C                   B2B                  B2B2C
        │                     │                     │
  Cliente→Farmácia      Farmácia→Distribuidor   Cliente→Farmácia
                        Clínica→Distribuidor    Farmácia→Distribuidor
                        Hospital→Distribuidor
                        Empresa→Fornecedor
```

### 2.1 B2C — Cliente → Farmácia

- Catálogo com pesquisa, filtros e preço por farmácia.
- Carrinho multi-farmácia (split por farmácia no checkout).
- Upload de receita (foto/gallery), validação pelo farmacêutico.
- Pagamento via FinPay (Multicaixa, TPA, transferência, referência) ou dinheiro na entrega.
- Entrega urbana com tracking; ponto de referência no endereço.

### 2.2 B2B — Procurement profissional

- Farmácias, clínicas, hospitais e empresas compram a distribuidores/fornecedores.
- Catálogo B2B com SKU/EAN, lote, validade, stock, MOQ, lead time, preço por volume.
- RFQ → Quotation → PurchaseOrder → ApprovalFlow → Crédito → Faturação.
- Painéis por papel de organização (Buyer, Finance, Inventory, Admin).

### 2.3 B2B2C — Network

- O consumidor compra na farmácia; a farmácia compra ao distribuidor; a plataforma mostra **quem é responsável por cada etapa** do pedido.

```
              PLATFORM
                  │
     ┌────────────┼────────────┐
     │            │            │
  CLIENTE     FARMÁCIA     DISTRIBUIDOR
     │            │            │
     └────────────┼────────────┘
                  │
              PEDIDO
                  │
             ENTREGA
```

---

## 3. Os 5 produtos no mesmo Design System

```
                  DESIGN SYSTEM
                        │
        ┌───────────────┼───────────────┐
        │               │               │
       B2C             B2B            B2B2C
        │               │               │
    Consumer        Business        Marketplace
        │               │               │
        └───────────────┼───────────────┘
                        │
                 PLATFORM ADMIN
                        │
                 OPERATIONS
```

| Produto | Superfície | Conteúdo principal |
|---------|-----------|--------------------|
| **Consumer App** | Mobile (principal) + Web | Descobrir, pesquisar, comprar, receita, pagamento, entrega, pedidos |
| **Pharmacy Portal** | Web | Pedidos, stock, produtos, receitas, clientes, vendas, entregas |
| **Supplier Portal** | Web | Catálogo, stock, preços, pedidos, cotações, logística, faturação |
| **Business Portal** | Web | Procurement, cotações, pedidos, aprovação, financeiro, stock |
| **Admin / Operations** | Web | Marketplace, farmácias, fornecedores, produtos, pedidos, pagamentos, logística, compliance, fraude, suporte |

> Todos os 5 produtos consomem **as mesmas experiências** (`03-EXPERIENCE-ARCHITECTURE.md`) e **os mesmos tokens e componentes** (`04-DESIGN-SYSTEM.md`). O que muda é a densidade de informação, o RBAC e os journey-patterns, nunca a linguagem visual.

---

## 4. Monetização

| Fonte | Modelo | Detalhe |
|-------|--------|---------|
| Comissão de vendas | B2C/B2B2C | 5% por transação processada |
| Taxa de entrega | B2C | Fee por zona de entrega |
| Subscrição | Pharmacy/Supplier | Planos Free/Starter/Business/Enterprise por portal |
| Listagens patrocinadas | B2C | Destaque de produtos/farmácias |
| Analytics premium | B2B | Relatórios de vendas, stock, procura |
| Crédito B2B | B2B | Juros/agio sobre crédito a compradores |
| Cashback / lealdade | B2C | **v2.x**: earn em compras, resgate em compras futuras (backlog pós-MVP) |
| Seguros | B2C/B2B | **v2.x**: copay via FinPay e reembolso com seguradoras credenciadas (backlog pós-MVP) |

Settlements: semanais, com reserva de 7 dias e dedução de comissão. Ver `07-FINPAY-INTEGRATION.md`.

---

## 5. Estratégia de mercados (Africa-first)

### 5.1 Angola como mercado de referência

O Market **AO** é implementado por completo no blueprint: moeda AOA, pagamentos (Multicaixa, TPA, referência, transferência, carteira, dinheiro na entrega), endereço angolano (província/município/distrito/bairro + ponto de referência), telefone +244, WhatsApp como canal operacional, delivery urbano, geografia das 18 províncias.

### 5.2 Países africanos como primeira classe

A plataforma representa qualquer mercado; cada um é um **Country Pack** (`@brocolis/markets`). Angola é apenas a primeira implementação.

```
África Austral    AO, ZA, MZ, NA, BW, ZM, ZW, MW, LS, SZ
África Oriental   KE, TZ, UG, RW, BI, ET
África Ocidental  NG, GH, CI, SN, CM, SL, LR, GM
África Central    CD, CG, GA, CF, TD, GQ
Norte de África   EG, MA, DZ, TN, LY
```

### 5.3 Abstracção `Market`

Um mercado é: `Country + Region + Language + Currency + Regulation + Payments + Logistics`. O Core global nunca conhece detalhes de um país; a camada `Market` fornece a configuração.

```
type Market = {
  countryCode: string   // AO
  region: string        // Southern Africa
  locale: string        // pt-AO
  currency: string      // AOA
  payments: PaymentConfig
  taxation: TaxConfig
  address: AddressConfig
  phone: PhoneConfig
  pharmacy: PharmacyConfig
  prescription: PrescriptionConfig
  logistics: LogisticsConfig
}
```

### 5.4 Roadmap de expansão

| Fase | Mercado | Moeda | Pagamentos | Locale |
|------|---------|-------|------------|--------|
| Fase 1 | 🇦🇴 Angola | AOA / Kz | Multicaixa, TPA, transferência, referência | pt-AO |
| Fase 2 | 🇲🇿 Moçambique | MZN / MT | M-Pesa, e-Mola | pt-MZ |
| Fase 3 | 🇰🇪 Quénia | KES | M-Pesa, cards, bank | en-KE / sw-KE |
| Fase 4 | 🇳🇬 Nigéria | NGN | Bank transfer, USSD, cards, wallets | en-NG |
| Fase 5 | 🇬🇭 / 🇿🇦 / 🇷🇼 / 🇸🇳 … | por mercado | por mercado | en/fr/sw |

> Cada expansão é um **novo Country Pack**, nunca uma reescrita do Core. Os detalhes do padrão de pack estão em `02-ARQUITETURA-CONTRATOS.md` e `04-DESIGN-SYSTEM.md`.

---

## 6. Conformidade e regulatório

| Área | Regra |
|------|-------|
| Fiscal | AGT/SAF-T: faturação e ledger exportáveis; cada decisão de pagamento auditable |
| Dados pessoais | LGPD; consentimento explícito; retenção por tier; redacção de PII |
| Farmácia | Registo de farmácias e profissionais; verificação documental; estados VERIFIED/PENDING/SUSPENDED |
| Receitas | Validação de prescrição; tipos de receita por mercado; validade; restrições de quantidade |
| Medicamentos | Controlados vs OTC; avisos de interacção; restrições de venda por mercado (`RegulatoryPolicy`) |
| Pagamentos | PCI-DSS delegado à FinPay; nunca dados de cartão no Brócolis |
| Acessibilidade | WCAG 2.2 AA |

---

## 7. Princípios de produto (não-funcionais)

| Princípio | Regra |
|-----------|-------|
| **Mobile First** | Mobile é o canal B2C principal a longo prazo; **MVP v1 é Web + PWA** (lançamento rápido), Mobile nativo na v2 (`09-ROADMAP-FASES.md`) |
| **Low Bandwidth** | O sistema funciona razoavelmente em redes lentas: imagens optimizadas, animações mínimas, requests enxutos |
| **Trust First** | Farmácia verificada, produto disponível, receita validada, pagamento confirmado, entrega rastreável — tudo visível na UI |
| **Human Assisted** | Cliente pode sempre falar com suporte via WhatsApp/telefone/chat quando algo corre mal |
| **Connectivity-aware** | Loading, skeleton, retry, offline, cached, syncing em todos os fluxos |
| **Low-end devices** | Funciona em Android low-end, 3G/4G, ecrãs pequenos |
| **Angola First** | Digitalizar a realidade angolana, não obrigar a realidade a adaptar-se ao software |

---

## 8. Design Language

A estética fica entre **Healthcare + Fintech + Marketplace + African Digital Product**:

```
Clean · Trustworthy · Modern · Human · Professional · Accessible
```

Evitar: excesso de verde, aparência hospitalar, UI genérica de SaaS, dashboards cheios de gráficos inúteis.

---

## 9. O que o Brócolis NÃO é

- Não é um gateway de pagamento (isso é a FinPay).
- Não é uma cópia de marketplace americano/europeu (é Angola-first).
- Não é um sistema de gestão de farmácia isolado (é um marketplace com portal de farmácia).
- Não é um produto com temas separados por portal (é um design system único).

---

## 10. Estratégia vs Appy Saúde

> Análise completa em `13-ANALISE-CONCORRENCIA.md`. Resumo executivo de **como crescer e concorrer** sem fugir do MVP.

**Contexto:** a Appy Saúde é o principal concorrente em Angola (100k+ downloads, 3,8★, 18k+ produtos, 1.800+ estabelecimentos, desde 2017). É forte em marca, B2C e vertical de pagamento (AppyPay), mas fraca em auth, performance, mapas e no posicionamento da zona de entrega.

### Como concorrer no MVP v1 (F0→F3)

1. **Qualidade técnica como diferencial:** auth sólida (Better Auth + E2E), performance (P95 < 300ms, offline-first), zona de entrega **antes do checkout** (RF-24/RF-33). São as fraquezas mais reclamadas pela base da Appy.
2. **Onboarding self-service:** farmácia a vender em 1-3 dias, vs 10 dias assistidos na Appy.
3. **Logística descentralizada:** cada farmácia entrega a sua zona; mais leve e escalável que o modelo centralizado da Appy.
4. **FinPay em vez de AppyPay:** processadora nativa com contrato/adapter, sem lock-in de gateway.

### Onde abrir vantagem (pós-MVP)

| Alavanca | Release |
|----------|---------|
| Procurement B2B (a Appy é só B2C) | v1.5 (F4) |
| Mobile nativo + e-prescription | v2 (F5/F6) |
| B2B2C network | v2 (F6) |
| Seguros, cashback, multi-market (MZ/KE/NG) | v2.x (backlog) |

### Regra de crescimento

**Nenhum item desta estratégia pode atrasar o MVP v1.** O MVP v1 é F0→F-EX→F-DS→F1→F2→F3; o resto é Lego que encaixa depois (ver `09-ROADMAP-FASES.md` §Milestones).
