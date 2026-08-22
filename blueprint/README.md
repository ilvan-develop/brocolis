# Bootstrap Blueprint — Brócolis v2

> **Versão:** 2.0.0
> **Estado:** Canónico — guia de recriação do Brócolis do zero
> **Autor:** Ilvan Joaquim
> **Objectivo:** Recriar o Brócolis como **marketplace farmacêutico africano** (B2C + B2B + B2B2C), **Angola-first, Africa by design**, com **pagamentos via FinPay** (nunca Stripe), em **fases**, com **testes desde o princípio**, **design system AI-ready** e **pipeline de engenharia com agentes IA** (evidence-based).

---

## O que é o Brócolis

O Brócolis é um **marketplace farmacêutico multi-tenant** que liga consumidores, farmácias, clínicas, hospitais, empresas e distribuidores num só ecossistema, **resolvendo profundamente Angola e preparado para África**.

```
GLOBAL CORE → COUNTRY PACK (AO) → MARKETS (MZ, KE, NG, …)
```

Três modelos comerciais no mesmo sistema:

* **B2C** → consumidor compra na farmácia (mobile-first, Multicaixa/TPA/transferência, entrega urbana).
* **B2B** → farmácias, clínicas, hospitais e empresas compram a fornecedores/distribuidores (procurement, cotações, crédito, preço por volume).
* **B2B2C** → plataforma liga consumidor → farmácia → distribuidor/fornecedor, com visibilidade de quem é responsável por cada etapa do pedido.

O pagamento é processado pela **FinPay** (a processadora angolana nativa): o Brócolis é um **tenant** da FinPay, cria `PaymentIntent`, acompanha a validação (evidência → OCR → compliance → fraude → trust score → decisão) e consome **webhooks HMAC** para actualizar pedidos.

---

## O princípio-mãe

> **Build Global. Configure Local.**
> O Core nunca conhece detalhes de um país. Cada mercado é um `Market` (country + region + language + currency + regulation + payments + logistics) empacotado e plugável. Zero `if (country === "AO")` espalhado no código.

Angola é o **mercado de referência** (implementado por completo no Market AO). Moçambique, Quénia, Nigéria e restantes entram como **Country Packs** seguindo o padrão documentado no blueprint.

---

## Como usar este Blueprint

Este blueprint é lido por um **novo agente de IA** (opencode, com skills enterprise-* e context7) que recria o projecto **do zero, num repo novo**, através do **pipeline autónomo** (`11-PIPELINE-AUTONOMO.md`).

### Ordem de leitura

| # | Documento | Quando ler | Para quê |
|---|-----------|------------|----------|
| 1 | `README.md` (este) | Primeiro | Contexto, mapa, ordem, regras imutáveis |
| 2 | `00-VISAO-PRODUTO.md` | Antes de qualquer fase | Visão, modelos comerciais, 5 produtos, monetização, mercados |
| 3 | `01-STACK-MONOREPO.md` | Fase 0 | Stack, catálogo, configs reais |
| 4 | `02-ARQUITETURA-CONTRATOS.md` | Fase 0-1 | C4, bounded contexts, Market, contracts-first |
| 5 | `03-EXPERIENCE-ARCHITECTURE.md` | Fase F-EX | Experience System: atores, onboarding, gestão, admin, country, governança |
| 6 | `04-DESIGN-SYSTEM.md` | Fase F-DS | Africa Pharmacy Commerce Design System, tokens, country packs |
| 7 | `05-REQUISITOS-JORNADAS.md` | Antes de cada fase | RBAC, requisitos funcionais e NFRs por domínio |
| 8 | `06-TESTES.md` | Todas as fases | Estratégia unit/integração/E2E/contrato/mobile |
| 9 | `07-FINPAY-INTEGRATION.md` | Fase 2 | Trilho de pagamento via FinPay (adapter + webhooks) |
| 10 | `08-CICD-GOVERNANCA.md` | Fase 0 | CI/CD, quality gates, ADRs |
| 11 | `09-ROADMAP-FASES.md` | Sempre | Mapa de fases, deliverables, gates |
| 12 | `10-BEST-PRACTICES.md` | Sempre | DO/DON'T, lições, anti-patterns |
| 13 | `11-PIPELINE-AUTONOMO.md` | Fase 0 | AI Software Delivery Pipeline: agentes, gates, evidências |
| 14 | `12-DOCS-ARQUITETURA.md` | Sempre | Docs humanas + AI geradas dos contratos, sem drift |
| 15 | `13-ANALISE-CONCORRENCIA.md` | Sempre | Appy Saúde: análise, estratégia de crescimento, backlog pós-MVP |
| 16 | `14-THREAT-MODEL.md` | Fase 1+ | Threat model STRIDE, attack trees, segurança formal |
| 17 | `15-DATA-GOVERNANCE.md` | Fase 1+ | Classificação de dados, retenção, LGPD/GDPR compliance |
| 18 | `16-INCIDENT-MANAGEMENT.md` | Fase 7+ | Severidade, escalação, post-mortem, runbooks |
| 19 | `17-COST-MANAGEMENT.md` | Sempre | Budget por fase, AI token tracking, optimização |
| 20 | `18-EVAL-FRAMEWORK.md` | Sempre | AI agent quality metrics, eval suite, benchmarks |
| 21 | `19-MULTI-TENANT-STRATEGY.md` | Fase 1+ | Quotas, RLS, billing metering, self-service |
| 22 | `20-DISASTER-RECOVERY.md` | Fase 7+ | RTO/RPO, backup strategy, failover, DR drills |

### Regras imutáveis (aplicam-se a todas as fases)

1. **Testes desde o princípio** — nenhum código merge sem testes unit, integração e/ou E2E.
2. **Contracts-first** — nenhuma rota sem contrato oRPC + Zod em `@brocolis/contracts`.
3. **Tenant + Market isolation** — `organizationId` e `marketCode` obrigatórios em toda query e contrato.
4. **Build Global. Configure Local.** — nenhum detalhe de país hardcoded no Core; tudo via `@brocolis/markets`.
5. **Design tokens** — nunca hex cru; sempre tokens semânticos do `design.json` partilhado web/mobile.
6. **Quality gates** — lint, typecheck, build e cobertura ≥80% verdes antes de cada commit.
7. **Audit trail** — toda mutação crítica regista `AuditEvent` na mesma `$transaction`.
8. **FinPay é a processadora** — pagamentos e money movement via FinPay; **sem Stripe**.
9. **Conformidade** — AGT/SAF-T, LGPD e regras farmacêuticas locais desde o schema inicial.
10. **Evidence-based pipeline** — nenhum artefacto sem evidência; nenhuma transição de fase sem gate verde.
11. **Pesquisar antes de implementar** — qualquer stack sem skill instalada é pesquisada (context7/docs oficiais) antes de escrever código.
12. **Execução rápida por defeito** — `opencode serve` + `--attach`, `--continue`, compaction, cache turbo, pnpm 11.
13. **Experiência antes de UI** — nenhum ecrã sem Experience Module em `03-EXPERIENCE-ARCHITECTURE.md`; F-EX antes do F-DS.
14. **Threat model formal** — STRIDE por bounded context antes da F1; actualizado em cada superfície nova (`14-THREAT-MODEL.md`).
15. **Data governance** — classificação de dados, retenção por tier, LGPD compliance desde a F1 (`15-DATA-GOVERNANCE.md`).
16. **Supply chain security** — SBOM, container scanning, dependency review no CI (`01-STACK-MONOREPO.md §7`).
17. **Eval framework** — métricas de qualidade do output AI; gates de score ≥85/100 (`18-EVAL-FRAMEWORK.md`).
18. **Disaster recovery** — RTO/RPO definidos; backup restore testado mensalmente (`20-DISASTER-RECOVERY.md`).

---

## Mapa de fases do MVP

| Fase | Entrega | Gate de saída |
|------|---------|---------------|
| **F0 Fundação** | Repo scaffold, configs, docker, CI base, docs/org, pipeline `.ai/` | lint + typecheck + build + test verdes |
| **F-EX Experience System** | `03-EXPERIENCE-ARCHITECTURE.md` + Experience Modules (Legos), personas, RBAC por experiência | 03 spec-complete + contract tests verdes |
| **F-DS Design System** | Global Core + Market AO: `packages/ui` (tokens, blocks, meta.ts) + `packages/i18n` + `packages/formatters` | DS tests + Lighthouse base |
| **F1 IAM + Tenants** | Better Auth, RBAC 5 portais, org-switcher, onboarding | Auth E2E verde |
| **F2 B2C Commerce** | Catálogo, carrinho, checkout, pedidos, pagamento FinPay, entrega, storefront web | Checkout E2E verde |
| **F3 Pharmacy Portal** | Inventário, lotes/validade, gestão de pedidos, settlements | Pharmacy E2E verde |
| **F4 Procurement B2B** | Supplier Portal, RFQ, cotações, PurchaseOrder, crédito, faturação | Procurement E2E verde |
| **F5 Mobile** | App Expo SDK 57 (B2C offline-first) | Mobile E2E verde |
| **F6 B2B2C + Receitas** | Network, e-prescription, prescrição digital | B2B2C E2E verde |
| **F7 Endurecimento + Launch** | Rate limit, Sentry, staging, load, release | Release gate |

## MVP v1 vs visão completa (MVP-first)

> **Pensar como Lego:** o MVP v1 é a figura mínima que entrega valor real em produção. Só se constrói o resto depois, como Legos que encaixam no Core.

| | MVP v1 (F0→F3) | Pós-MVP |
|---|---|---|
| **Produtos** | Consumer web + PWA, Pharmacy Portal, Admin | Supplier, Business (v1.5), Mobile (v2) |
| **Comércio** | B2C com FinPay mock + entrega por farmácia | B2B procurement (v1.5), B2B2C + e-prescription (v2) |
| **Módulos adiados** | — | Seguros, Cashback/loyalty, multi-market (v2.x) |

O **critério de saída do MVP v1** é: "comprar com FinPay mock → entrega → admin verifica" verde em produção. Detalhes em `09-ROADMAP-FASES.md` §Milestones e estratégia de concorrência em `13-ANALISE-CONCORRENCIA.md`.

---

## Stack resumida

| Camada | Tecnologia |
|--------|------------|
| Web | Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui (new-york) |
| Mobile | Expo SDK 57 + React Native + React 19 + Expo Router + NativeWind |
| Backend | NestJS 11 + oRPC + Prisma 7 + Postgres 17 |
| Auth | Better Auth 1.6 (multi-tenant, RBAC) |
| Pagamentos | **FinPay** (tenant) — adapter + webhooks HMAC |
| Fila | BullMQ + Redis 8 |
| Server state | TanStack Query (web + mobile) |
| i18n / Formatters | `@brocolis/i18n` (pt-AO primeiro), `@brocolis/formatters` (Money/Date/Phone/Address) |
| Testes | Vitest 4 + Playwright (web) + Jest/Testing Library/Maestro (mobile) |
| Monorepo | pnpm 11 + Turborepo |
| CI/CD | GitHub Actions + EAS (mobile) |
| Observabilidade | prom-client + nestjs-pino + Sentry + OpenTelemetry |
| Segurança | CodeQL + Trivy + Gitleaks + OWASP ZAP |
| Feature Flags | LaunchDarkly / Unleash |
| IaC | Terraform / Pulumi |
| DR | WAL archiving + cross-region backup |

Detalhes e catálogo fixado: `01-STACK-MONOREPO.md`.

---

## Workflow recomendado para o agente

```
1. Ler README + 00 + 01 + 02 + 05 + 08 + 09 + 11   (contexto completo)
2. Ler 14 + 15 + 18 (segurança, governance, evals)  (enterprise baseline)
3. Iniciar Fase 0: criar scaffold + docs/org + ADR-0001 + pipeline .ai/
4. Para cada fase do ROADMAP:
   a. Ler 03 (experiência da fase) e 05 (requisitos/RBAC)
   b. Ler 04 (se envolver UI) e 07 (se envolver pagamentos FinPay)
   c. Ler 14 (threat model da fase) e 15 (data governance se applicável)
   d. Executar deliverables + testes da fase
   e. Correr gates: lint → typecheck → build → test → coverage → e2e → evals
   f. Registar evidência no state/evidence.json + costs.json
   g. Marcar fase completa no ROADMAP
5. Não avançar de fase sem gate verde + eval score ≥85
6. Actualizar 14-THREAT-MODEL.md se nova superfície de ataque
```

---

*Este documento é canónico para a recriação do Brócolis. Nenhuma divergência entre o blueprint e a implementação deve persistir: ou se corrige o blueprint, ou se corrige a implementação.*
