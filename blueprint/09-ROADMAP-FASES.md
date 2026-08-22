# 09 — Roadmap de Fases

> Aplica-se a **todo o projecto**. Cada fase é um **entregável comercial funcional** com testes verdes. O agente não avança de fase sem o **gate de saída** e sem registar a **evidência** no `state/evidence.json`. Ciclo por fase: `docs → contratos/schema → código → testes → gates → ADR → evidência`.

---

## Ciclo de cada fase

```
1. Ler experiência da fase (03) + requisitos/RBAC (05) + docs relevantes (02/04/06/07/08)
2. Escrever/actualizar ADR e docs de design (02/08)
3. Evoluir contracts (packages/contracts) + schema (packages/db)
4. Implementar backend (apps/api), web (apps/web) e mobile (apps/mobile) com testes
5. Correr gates: lint → typecheck → build → unit → integração → E2E → coverage
6. Registar evidência (state/evidence.json) e marcar fase completa
```

---

## Milestones (MVP-first)

> **Pensar como Lego:** cada fase é um bloco; cada milestone é a figura montada. O **MVP v1** é a figura mínima que entrega valor real em produção. Nada que esteja fora do MVP v1 pode atrasá-lo; o resto é backlog com release própria.

| Milestone | Fases | Critério de saída | Público |
|-----------|-------|-------------------|---------|
| **MVP v1** | F0 → F-EX → F-DS → F1 → F2 → F3 | Comprar com FinPay mock + entrega + admin verifica, **em produção** | Consumidor B2C + Farmácia + Admin |
| v1.5 | F4 | Procurement B2B E2E verde | Fornecedor + Empresa |
| v2 | F5 + F6 | Mobile E2E verde + B2B2C E2E verde | Mobile + Network |
| v2.x | F7 iterativo | Release gate + módulos pós-MVP (Seguros, Cashback, multi-market) | Todos |

> **Post-MVP (backlog, nunca no MVP v1):** Seguros (Unisaúde), Cashback/loyalty, multi-market (MZ/KE/NG). Ver `13-ANALISE-CONCORRENCIA.md` §5.

---

## Fase 0 — Fundação `[MVP v1]`

**Objectivo:** repo scaffold, configs, docker, CI base, docs/org, pipeline `.ai/`.

| Deliverable | Detalhe |
|-------------|---------|
| Tooling | pnpm-workspace (catálogo), turbo.json, tsconfig.base.json, biome.json, components.json, .npmrc, .env.example, husky+commitlint+lint-staged |
| Docker | docker-compose.yml (Postgres 17 + Redis 8 + MinIO), docker-compose.test.yml |
| CI | ci.yml (lint, typecheck, build, unit, drift) |
| Pipeline | `.ai/` (agents, skills, protocols, pipeline, state) + `opencode.json` (policy allow/deny) |
| Docs | README, docs/architecture (C4, bounded-contexts), docs/decisions (ADR-0001..0009) |
| Packages | skeletons: contracts, db, auth, ui, i18n, markets, formatters, finpay, validation, observability, test-helpers |
| Apps | web (Next.js vazio), api (NestJS health), mobile (Expo scaffold), qa |
| Testes | smoke de infra (docker health), unit de config/env validation |
| **Gate de saída** | lint + typecheck + build + test verdes |

**Skills:** enterprise-backend, enterprise-frontend, enterprise-devops, enterprise-database, context7-mcp, mobile (expo).

---

## Fase F-EX — Experience System (Product Experience Architecture) `[MVP v1]`

**Objectivo:** documentar e contratualizar as **experiências** antes de qualquer UI: `03-EXPERIENCE-ARCHITECTURE.md` completo, Experience Modules como **Legos** (spec, RBAC, pontos de país, testes, gate). **Obrigatória antes do F-DS.**

| Deliverable | Detalhe |
|-------------|---------|
| Docs | `03-EXPERIENCE-ARCHITECTURE.md` completo (26 secções: atores, B2C/B2B/B2B2C, onboarding wizard, gestão, admin, country, governance) |
| Personas | persona sheets por ator (`docs/experience/personas/`) |
| Módulos | contratos dos Experience Modules em `@brocolis/contracts` (wizard steps, estados, RBAC, country injection) |
| RBAC | matriz "Experience Module → roles" por portal |
| Journey-patterns | specs iniciais em `docs/experience/modules/` (base do F-DS) |
| Testes | unit de wizard/estados + E2E esqueleto do Pharmacy Onboarding |
| **Gate de saída** | 03 spec-complete + RBAC mapeado + contract tests verdes |

**Jornadas:** todas (03 §1-26) são definidas aqui; o F-DS implementa-as.

---

## Fase F-DS — Design System (Global Core + Market AO) `[MVP v1]`

**Objectivo:** `packages/ui` + `packages/i18n` + `packages/formatters` + `packages/markets` (AO completo), arquitectados segundo o `04-DESIGN-SYSTEM.md` e implementando as experiências do `03-EXPERIENCE-ARCHITECTURE.md`. **Obrigatória antes de qualquer UI de produto.**

| Deliverable | Detalhe |
|-------------|---------|
| Fundação | design.json (W3C DTCG), tokens.css (`@theme inline`), DESIGN.md, copywriting.md pt-AO |
| Specs | specs/{foundations,tokens,atoms,molecules,organisms} + specs/markets/ao |
| shadcn | `npx shadcn@latest init -d` + add sidebar-07, table, form, dialog, sheet, dropdown-menu… |
| Domínio | blocks: ProductCard (b2c/b2b/wholesale), PharmacyCard, PrescriptionUpload, InventoryTable, VolumePricing, OrderTimeline, PaymentMethod, DeliveryTracking |
| meta.ts | todo componente novo com 4 pilares + `models` |
| Formatters | `Money`, `PhoneNumber`, `Address`, `Percentage`, `Date` (pt-AO first) |
| Markets | `aoMarket` completo (currency, payments, address, phone, taxation, pharmacy, prescription, logistics) |
| i18n | `pt-AO` completo; estrutura para pt-MZ/en-KE/fr-SN/ar-EG (RTL) |
| Mobile | tokens → NativeWind gerado; primeiros primitives RN |
| Validação CI | token schema, semantic→raw, contrast pairs, CSS snapshot, meta.ts |
| **Gate de saída** | DS tests + Storybook + Lighthouse base |

**Skills:** enterprise-frontend, ui-ux-pro-max, frontend-design, design-token-audit, wcag-contrast-check, shadcn CLI, context7-mcp.

---

## Fase 1 — IAM + Tenants `[MVP v1]`

**Objectivo:** autenticação multi-tenant, RBAC por portal, org-switcher, onboarding.

| Deliverable | Detalhe |
|-------------|---------|
| Schema | User, Session, Account, Verification, TwoFactor, Role, Permission, RolePermission, Organization, OrgSetting, OrgFeatureFlag, Member, Invitation, WhiteLabelConfig |
| Auth | Better Auth server+client, scrypt OWASP, MFA TOTP, invitations |
| Contracts | tenantContract, apiKeyContract, sessions, profile |
| RBAC | permissões por portal (Consumer/Pharmacy/Supplier/Business/Platform), RolesGuard, OrpcMiddleware (routeRoles) |
| Web | sign-in, register, verify-email, onboarding, org-switcher, members UI |
| Testes | unit (RBAC matrix), integração (Prisma+Redis), E2E (registo→org, org-switcher, RBAC) |
| **Gate de saída** | Auth E2E verde |

**Jornadas:** consumer, pharmacy_owner, supplier_admin, business_admin, platform_admin, onboarding (03 §1-2, §6, §8).

---

## Fase 2 — B2C Commerce (Core + Pagamentos FinPay) `[MVP v1]`

**Objectivo:** catálogo, carrinho multi-farmácia, checkout, pedidos, pagamento via FinPay (mock), entrega, storefront web.

| Deliverable | Detalhe |
|-------------|---------|
| Schema | GlobalProduct, CountryProduct, MarketOffer, Category, Brand, Medicine, Pharmacy, PharmacyStaff, PharmacyHour, PharmacyServiceArea, Cart, CartItem, CheckoutSession, Order, OrderItem, OrderStatusHistory, OrderSplit, Payment, PaymentProof, PaymentStatusHistory, FinpayWebhookLog |
| Catalog | pesquisa, filtros, avisos de interacção |
| Checkout | passos cliente→entrega→farmácia→receita→pagamento→review→confirmação; idempotência |
| Pagamentos | `@brocolis/finpay` (mock): createIntent → webhook CONFIRMED → pedido avança |
| Prescription | upload (foto/gallery) + estados |
| Delivery | zonas AO, taxas, estados, driver |
| Web | storefront B2C (Consumer) |
| Testes | unit (pricing, cart, finpay mock), integração (checkout→pagamento→entrega), E2E (B2C completo) |
| **Gate de saída** | Checkout E2E verde (pagamento mock FinPay) |

**Jornadas:** consumidor B2C (03 §3, §10).

---

## Fase 3 — Pharmacy Portal + Inventory `[MVP v1]`

**Objectivo:** operação da farmácia: stock/lotes, pedidos, receitas, settlements.

| Deliverable | Detalhe |
|-------------|---------|
| Schema | InventoryItem, Batch, StockMovement, InventoryAlert, PharmacyVerification, PharmacySettlement, Refund, CommissionRate |
| Inventory | FIFO por validade, alertas LOW/CRITICAL/EXPIRING/EXPIRED, bloqueio de expirados |
| Prescription | validação pelo farmacêutico (RF-90..93) |
| Settlements | semanais via FinPay: reserva 7d + comissão |
| Pharmacy Portal | dashboard, pedidos, stock, receitas, entregas, clientes |
| Testes | unit (FIFO, alertas), integração (settlement), E2E (receita→dispensa→entrega) |
| **Gate de saída** | Pharmacy E2E verde |

**Jornadas:** farmacêutico, admin/operations (03 §7, §12, §16).

---

## Fase 4 — Procurement B2B (Supplier + Business Portals) `[v1.5]`

**Objectivo:** catálogo B2B, RFQ, cotações, PurchaseOrder, aprovação, crédito, faturação.

| Deliverable | Detalhe |
|-------------|---------|
| Schema | Rfq, Quotation, PurchaseOrder, PurchaseOrderItem, ApprovalWorkflow, CreditAccount, Supplier, PriceTier, VolumePrice |
| Procurement | RFQ→Quotation→SupplierOffer→QuoteComparison→PO→ApprovalFlow |
| Crédito | limite por organização, utilização, estado |
| Faturação | invoices B2B + export AGT/SAF-T |
| Portals | Supplier Portal (catálogo/preços/pedidos/logística) + Business Portal (procurement/financeiro) |
| Testes | unit (pricing volume, approval, crédito), integração (PO→stock), E2E (RFQ→PO→approval→fatura) |
| **Gate de saída** | Procurement E2E verde |

**Jornadas:** comprador B2B, fornecedor (03 §4, §9).

---

## Fase 5 — Mobile (Expo SDK 57) `[v2]`

**Objectivo:** Consumer App B2C offline-first, reutilizando os mesmos tokens e contratos.

| Deliverable | Detalhe |
|-------------|---------|
| App | Expo SDK 57 + Expo Router + NativeWind + TanStack Query + Better Auth (expo) |
| Offline | cache de catálogo (persist query), pedido local, syncing, retry |
| Features | Home, Search, ProductCard, Cart, Checkout, PrescriptionUpload, PaymentStatus, OrderTracking, Profile |
| Native | expo-secure-store, expo-notifications, expo-camera, expo-image, local-authentication |
| Testes | unit (Jest + Testing Library RN), E2E (Maestro: offline, receita, pagamento mock, push) |
| **Gate de saída** | Mobile E2E verde |

---

## Fase 6 — B2B2C + Receitas digitais `[v2]`

**Objectivo:** network completo, e-prescription, compliance.

| Deliverable | Detalhe |
|-------------|---------|
| B2B2C | pedido consumidor→farmácia→fornecedor com responsabilidade visível por etapa |
| Prescrição digital | HealthcareProfessional, e-prescription, validação |
| Compliance | RegulatoryPolicy por mercado, decisões, exports |
| Audit | AuditEvent em todas as mutações críticas; explorer |
| Testes | unit (regulatory), integração (PO→stock→entrega B2B2C), E2E (network timeline) |
| **Gate de saída** | B2B2C E2E verde |

---

## Fase 7 — Endurecimento + Launch `[v2.x]`

**Objectivo:** release candidate comercial.

| Deliverable | Detalhe |
|-------------|---------|
| Segurança | rate limiting (Redis), signed URLs, Sentry, headers, secrets scan |
| Performance | Lighthouse CI, bundle budgets (web+mobile), polling sane |
| Staging | deploy + smoke + readiness + load test |
| Mobile | EAS Submit + Update canais |
| Release | changesets, changelog, runbooks, rollback |
| **Gate de saída** | Release gate completo (todos os NFR) |

---

## Mapa fase → ficheiros

| Fase | Release | Docs | Contracts | Schema | Apps |
|------|---------|------|-----------|--------|------|
| F0 | MVP v1 | README, ADR-0001..09 | skeletons | init | web, api, mobile, qa, .ai |
| F-EX | MVP v1 | 03 | experience modules, personas | — | — |
| F-DS | MVP v1 | 04 | — | — | packages/ui, i18n, formatters, markets |
| F1 | MVP v1 | ADR auth | tenant, api-key, sessions, profile | IAM+Tenants | web auth |
| F2 | MVP v1 | 02, 03, 07 | catalog, cart, orders, payments | B2C core | web storefront |
| F3 | MVP v1 | ADR inventory | inventory, prescription, settlement | Inventory+Pharmacy | pharmacy portal |
| F4 | v1.5 | ADR procurement | procurement, pricing | Procurement | supplier+business portals |
| F5 | v2 | ADR mobile | (reuso) | — | apps/mobile |
| F6 | v2 | ADR b2b2c | prescription-digital, compliance | B2B2C | network |
| F7 | v2.x | runbooks | — | — | hardening |
