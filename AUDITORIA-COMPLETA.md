# RELATÓRIO DE AUDITORIA ENTERPRISE — BRÓCOLIS

**Data:** 2026-08-24  
**Auditor:** Kilo (CLI)  
**Escopo:** Monorepo completo (frontend, backend, banco, testes, qualidade, UX/UI)  
**Status:** 🔴 NÃO ENTERPRISE-READY — múltiplos bloqueadores P0/P1

---

## SUMÁRIO EXECUTIVO

| Domínio | Score | Status |
|---------|-------|--------|
| Arquitetura & Monorepo | 4/10 | 🔴 Crítico |
| Backend (NestJS + oRPC) | 3/10 | 🔴 Crítico |
| Banco de Dados (Prisma) | 5/10 | 🔴 Crítico |
| Segurança & Auth | 2/10 | 🔴 Crítico |
| Frontend (Next.js 16) | 5/10 | 🔴 Crítico |
| UX/UI | 6/10 | 🟡 Alto |
| Testes (unit, integration, e2e) | 6/10 | 🟡 Alto |
| Qualidade & CI/CD | 3/10 | 🔴 Crítico |
| Compliance (AGT/SAF-T/LGPD) | 6/10 | 🟡 Alto |
| Design System | 7/10 | 🟡 Alto |

**Veredito:** O projeto Brócolis tem **fundação técnica promissora** (schema Prisma extenso, contracts Zod completos, estrutura de monorepo organizada), mas está **criticamente incompleto para produção enterprise**. A API é um protótipo funcional com services em memória, autenticação não funcional, zero migrations e zero CI/CD. O frontend desperdiça o potencial do Next.js 16 ao usar todas as páginas como Client Components. Os testes existem mas não cobrem banco real, segurança ou fluxos E2E reais.

**Não deve ser deployado em produção sem resolver todos os itens P0.**

---

## 1. ARQUITETURA & MONOREPO

### Problemas Críticos (P0)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 1 | **65 dependências circulares** detectadas por madge | 🔴 Alta | `packages/finpay/src/index.ts:192`, `packages/finpay/src/http-adapter.ts:1` |
| 2 | **Sem CI/CD** — Nenhum pipeline de integração contínua | 🔴 Alta | `.github/workflows/` (ausente) |
| 3 | **Husky não configurado** — Declarado mas sem `.husky/` nem `prepare` script | 🔴 Alta | `package.json:41-42` |
| 4 | **dotenvx declarado mas não implementado** — `.env` é plain text | 🔴 Alta | `package.json:37`, `.env` |

### Problemas Altos (P1)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 5 | **Serviços stateful em memória** — 7+ services usam `Map`, dados perdidos no restart | 🔴 Alta | `apps/api/src/{auth,orders,payments,cart,catalog,tenants,settlements}/` |
| 6 | **Violação regra #2** — API usa NestJS controllers tradicionais, não oRPC | 🔴 Alta | `apps/api/src/**/*.controller.ts` |

### Problemas Médios (P2)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 7 | `marketCode` com `@default("AO")` em User, Organization, Category | 🟡 Média | `packages/db/prisma/schema.prisma:73,200,342` |
| 8 | `Cart.marketCode` default é moeda (`"AOA"`) ao invés de código de mercado | 🟡 Média | `packages/db/prisma/schema.prisma:537` |
| 9 | FinPay mock como default sem forma de injetar adapter real facilmente | 🟡 Média | `packages/finpay/src/index.ts:194` |

### Pontos Positivos

- ✅ PrismaClient isolado em `packages/db/src/index.ts:35-44` (único ponto)
- ✅ shadcn centralizado em `packages/ui/src/components/`
- ✅ Nenhuma importação direta entre apps

---

## 2. BACKEND (NestJS + oRPC)

### Problemas Críticos (P0)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 1 | **Autenticação não funcional** — Sem AuthController, sem middleware, `request.user` nunca populado | 🔴 Alta | `apps/api/src/main.ts`, `apps/api/src/app.module.ts` |
| 2 | **Todas as rotas desprotegidas** — Nenhum `@UseGuards` em nenhum controller | 🔴 Alta | `apps/api/src/**/*.controller.ts` |
| 3 | **RolesGuard nunca aplicado** — Definido mas não usado | 🔴 Alta | `apps/api/src/auth/roles.guard.ts` |
| 4 | **InMemorySessionStore** — Sessões não sobrevivem a restart | 🔴 Alta | `apps/api/src/auth/auth.service.ts:46` |

### Problemas Altos (P1)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 5 | **Violação regra #7** — AuditService em memória, não persiste AuditEvent no DB | 🔴 Alta | `apps/api/src/audit/audit.service.ts:9,11-17` |
| 6 | **Violação regra #7** — `emitAudit` com catch silencioso que descarta auditoria | 🔴 Alta | `apps/api/src/compliance/compliance.service.ts:394-411` |
| 7 | **CSP `unsafe-inline`** — Reduz proteção XSS | 🟡 Média | `apps/api/src/main.ts:19-20` |
| 8 | **Proxy web bypassa auth em dev** — `if (NODE_ENV !== 'production') return response` | 🔴 Alta | `apps/web/proxy.ts:46-48` |

### Problemas Médios (P2)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 9 | `database()` síncrono sem `await` em alguns services | 🟡 Média | `apps/api/src/procurement/credit.service.ts:39,48,68` |
| 10 | FinPay mock como default | 🟡 Média | `packages/finpay/src/index.ts:194` |

### Pontos Positivos

- ✅ Helmet configurado com CSP, HSTS, frameguard, noSniff
- ✅ CORS restrito a `WEB_ORIGIN`
- ✅ RBAC completo definido em `packages/auth/src/index.ts`
- ✅ Nenhuma referência a Stripe ou outra processadora

---

## 3. BANCO DE DADOS (Prisma)

### Problemas Críticos (P0)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 1 | **Sem migrations** — Schema existe mas não há histórico de migrations | 🔴 Alta | `packages/db/prisma/` (ausente `migrations/`) |
| 2 | **Nenhum teste com banco real** — Todos os testes usam mocks em memória | 🔴 Alta | `apps/api/src/test-setup.ts` |

### Problemas Altos (P1)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 3 | `User.marketCode` e `Organization.marketCode` com `@default("AO")` — não obrigatório | 🟡 Média | `packages/db/prisma/schema.prisma:73,200` |
| 4 | Seed com senha previsível (`Brocolis@123`) | 🟡 Média | `packages/db/prisma/seed.ts:38` |

### Pontos Positivos

- ✅ Schema extenso (1392 linhas) com 40+ models
- ✅ Model `AuditEvent` com índices corretos
- ✅ Seed abrangente (308 linhas) populando dados de teste
- ✅ Enums apropriados para domínios farmacêuticos
- ✅ organizationId e marketCode na maioria dos models

---

## 4. SEGURANÇA & CONFORMIDADE

### Problemas Críticos (P0)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 1 | **Auth não funcional** — Sem login, register, logout endpoints | 🔴 Alta | `apps/api/src/auth/` |
| 2 | **Rotas desprotegidas** — Qualquer pessoa acessa qualquer endpoint | 🔴 Alta | `apps/api/src/**/*.controller.ts` |
| 3 | **Proxy bypassa auth em dev** | 🔴 Alta | `apps/web/proxy.ts:46-48` |
| 4 | **Sem testes de segurança** — XSS, SQL injection, rate limiting, 2FA | 🔴 Alta | — |
| 5 | **Sem testes de conformidade** — LGPD, AGT real, SAF-T real | 🔴 Alta | — |

### Problemas Altos (P1)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 6 | **Sem consentimento LGPD** — Não há modelo de consentimento nem DSAR | 🟡 Média | `packages/db/prisma/schema.prisma` |
| 7 | **Sem política de retenção de dados** | 🟡 Média | — |
| 8 | **Token JWT sem validação de assinatura/expiração no proxy** | 🔴 Alta | `apps/web/proxy.ts:59-60` |

### Pontos Positivos

- ✅ Helmet com CSP restritiva, HSTS, frameguard
- ✅ CORS configurado
- ✅ RBAC completo definido
- ✅ Nenhuma API key hardcoded
- ✅ Modelos farmacêuticos (Medicine, EPrescription, Batch, etc.)
- ✅ SAF-T export implementado

---

## 5. FRONTEND (Next.js 16)

### Problemas Críticos (P0)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 1 | **46 páginas como Client Components** — Potencial do RSC 100% desperdiçado | 🔴 Alta | `apps/web/app/**/page.tsx` |
| 2 | **Sem `meta.ts` em 41 páginas** — Viola regra AGENTS.md | 🔴 Alta | `apps/web/app/**/page.tsx` |
| 3 | **Sem `not-found.tsx`** — Nenhum no projeto | 🔴 Alta | — |
| 4 | **Sem middleware** — Autenticação feita via proxy imperfeito | 🔴 Alta | — |
| 5 | **Dados mockados** — `prescriptions-query.ts:28` tem `setTimeout(350)` mock | 🔴 Alta | `apps/web/lib/prescriptions-query.ts:28` |

### Problemas Altos (P1)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 6 | **5 instâncias de `QueryClient`** — Estado vazado entre contextos | 🔴 Alta | `components/{providers,query-providers,storefront-providers,pharmacy-providers,portal-providers}.tsx` |
| 7 | **Formulários vanilla sem validação** — `step-client.tsx`, `step-delivery.tsx`, `step-payment.tsx` | 🟡 Média | `components/checkout/*.tsx` |
| 8 | **Textos hardcoded em 20+ páginas** — Sem `t()` | 🟡 Média | Vários |
| 9 | **Next.js Image não utilizado** — Sem otimização de imagens | 🟡 Média | — |
| 10 | **Proxy com bypass em dev** | 🔴 Alta | `apps/web/proxy.ts:46-48` |

### Problemas Médios (P2)

| # | Problema | Severidade | Arquivo(s) |
|---|----------|------------|------------|
| 11 | Sem `useMemo`/`useCallback` em páginas de dashboard | 🟡 Média | `dashboard/**/page.tsx` |
| 12 | Sem lazy loading (`React.lazy`, `next/dynamic`) | 🟡 Média | — |
| 13 | Queries duplicadas entre páginas | 🟡 Média | `business/page.tsx`, `supplier/page.tsx`, etc. |
| 14 | `staleTime` hardcoded em 60s | 🟡 Média | Vários providers |
| 15 | Meta tags apenas Next.js metadata, não os 4 pilares do AGENTS.md | 🟡 Média | `apps/web/app/**/meta.ts` |

### Pontos Positivos

- ✅ Tailwind v4 com tokens semânticos (`oklch`)
- ✅ Dark mode com `next-themes`
- ✅ React Hook Form + Zod em formulários principais
- ✅ sonner para toasts
- ✅ shadcn/ui centralizado
- ✅ TanStack Query configurado

---

## 6. UX/UI

### Problemas Críticos (P0)

| # | Problema | Severidade | Local |
|---|----------|------------|-------|
| 1 | **Acessibilidade 3/10** — Sem skip links, reduced motion, focus management | 🔴 Alta | Todos os layouts |
| 2 | **Touch targets de 36px** — Abaixo de 44px WCAG | 🔴 Alta | `packages/ui/src/components/button.tsx:25` |
| 3 | **Contraste `--destructive` < 4.5:1** | 🔴 Alta | `packages/ui/tokens.css:46` |
| 4 | **5 instâncias de `<Toaster>`** — Toasts duplicados/perdidos | 🔴 Alta | Providers |
| 5 | **Onboarding back reseta** — Quebra navegação | 🔴 Alta | `apps/web/app/onboarding/page.tsx:156` |

### Problemas Altos (P1)

| # | Problema | Severidade | Local |
|---|----------|------------|-------|
| 6 | **Sem bottom nav mobile** no storefront | 🟡 Média | `storefront/layout.tsx` |
| 7 | **Sem breadcrumbs** em páginas profundas | 🟡 Média | Dashboards |
| 8 | **Skeletons sem `aria-busy`** | 🟡 Média | Loading states |
| 9 | **Tabelas sem semântica** (`<caption>`, `scope`) | 🟡 Média | `pharmacy/overview/page.tsx:151` |
| 10 | **Emojis como flags** no `LocaleSwitcher` | 🟡 Média | `locale-switcher.tsx` |

### Problemas Médios (P2)

| # | Problema | Severidade | Local |
|---|----------|------------|-------|
| 11 | Estados vazios apenas com "0" sem CTA | 🟡 Média | `business/page.tsx`, `supplier/page.tsx` |
| 12 | Botão submit com "..." como loading | 🟡 Média | `sign-in-form.tsx`, `register-form.tsx` |
| 13 | Checkbox sem `id`/`htmlFor` | 🟡 Média | `step-payment.tsx:59-66` |
| 14 | CLS potencial por falta de `aspect-ratio` em cards | 🟡 Média | `catalog-card.tsx` |
| 15 | Falta de `active:` states em botões toggle | 🟡 Média | CategoryChips |

### Pontos Positivos

- ✅ Design tokens em `oklch` com dark mode
- ✅ Validação Zod com `aria-invalid` e `aria-describedby`
- ✅ Estados de loading/erro/vazio em vários pontos
- ✅ Progressão de checkout bem arquitetada
- ✅ Internacionalização consistente

---

## 7. TESTES

### Problemas Críticos (P0)

| # | Problema | Severidade | Local |
|---|----------|------------|-------|
| 1 | **Nenhum teste com banco de dados real** | 🔴 Alta | — |
| 2 | **Nenhuma migration testada** | 🔴 Alta | `packages/db/prisma/migrations/` (ausente) |
| 3 | **Zero testes E2E de fluxos reais** — Pagamento, prescrição, compliance | 🔴 Alta | `apps/qa/e2e/` |
| 4 | **Zero testes de segurança** — XSS, SQL injection, rate limiting E2E | 🔴 Alta | — |
| 5 | **Zero testes de conformidade** — LGPD, AGT real, SAF-T real | 🔴 Alta | — |

### Problemas Altos (P1)

| # | Problema | Severidade | Local |
|---|----------|------------|-------|
| 6 | **Módulos críticos sem testes** — pharmacy, tenants, rate-limit | 🔴 Alta | `apps/api/src/` |
| 7 | **MSW não configurado** — Mocks manuais frágeis | 🟡 Média | — |
| 8 | **Threshold de cobertura não enforced localmente** | 🟡 Média | `vitest.config.ts` |
| 9 | **Zero testes de componentes frontend** | 🟡 Média | `apps/web/app/`, `components/` |
| 10 | **E2E burla autenticação** — Usa `localStorage` fake | 🔴 Alta | `apps/qa/e2e/helpers.ts` |

### Problemas Médios (P2)

| # | Problema | Severidade | Local |
|---|----------|------------|-------|
| 11 | Mocks globais compartilhados — Flaky tests | 🟡 Média | `apps/api/src/test-setup.ts` |
| 12 | Inconsistência de frameworks (Vitest vs Jest) | 🟡 Média | `apps/mobile/` |
| 13 | Testes sem edge cases — Apenas happy path | 🟡 Média | Vários |
| 14 | `test-helpers` mínimo — Apenas gera IDs | 🟡 Média | `packages/test-helpers/src/` |

### Pontos Positivos

- ✅ 79 arquivos de teste unitário (333 na API, 238 no web)
- ✅ Cobertura acima de 80% (API: 92.63%, Web: 87.87%)
- ✅ Fitness check configurado
- ✅ Contratos Zod com testes
- ✅ Serviços de compliance e farmacêuticos testados

---

## 8. QUALIDADE & CI/CD

### Problemas Críticos (P0)

| # | Problema | Severidade | Local |
|---|----------|------------|-------|
| 1 | **Sem CI/CD** — Nenhum workflow | 🔴 Alta | `.github/workflows/` (ausente) |
| 2 | **Husky não configurado** | 🔴 Alta | `package.json:41-42` |
| 3 | **dotenvx não implementado** | 🔴 Alta | `package.json:37` |

### Problemas Altos (P1)

| # | Problema | Severidade | Local |
|---|----------|------------|-------|
| 4 | **Threshold de cobertura não enforced localmente** | 🟡 Média | `vitest.config.ts` |
| 5 | **E2E não roda no CI** | 🟡 Média | — |
| 6 | **Fitness check não valida testes** | 🟡 Média | `scripts/fitness-check.mjs` |

### Pontos Positivos

- ✅ Biome configurado
- ✅ Scripts de lint, typecheck, test existem
- ✅ Gitignore correto

---

## 9. COMPLIANCE

### Problemas Altos (P1)

| # | Problema | Severidade | Local |
|---|----------|------------|-------|
| 1 | **Sem modelo de consentimento LGPD** | 🟡 Média | Schema |
| 2 | **Sem endpoint de exportação de dados pessoais (DSAR)** | 🟡 Média | API |
| 3 | **Sem política de retenção de dados** | 🟡 Média | — |
| 4 | **Testes de SAF-T apenas unitários** — Sem validação de arquivo real | 🟡 Média | `apps/api/src/compliance/` |

### Pontos Positivos

- ✅ SAF-T export implementado
- ✅ Regras farmacêuticas no schema (Medicine, EPrescription, Batch)
- ✅ RegulatoryPolicy model com `saftEnabled`, `agtEndpoint`

---

## 10. PLANO DE AÇÃO

### Fase 1 — BLOQUEADORES (P0) — Semana 1-2

**Objetivo:** Tornar o sistema minimamente funcional e seguro.

| # | Tarefa | Responsável | Estimativa |
|---|--------|-------------|------------|
| 1 | Implementar autenticação completa (AuthController, middleware, Guards) | Backend | 3 dias |
| 2 | Aplicar RolesGuard em todas as rotas | Backend | 1 dia |
| 3 | Criar migrations iniciais (`prisma migrate dev --name init`) | Backend | 1 dia |
| 4 | Migrar services de Map para Prisma (auth, orders, payments, cart, catalog, tenants, settlements) | Backend | 5 dias |
| 5 | Persistir AuditEvent no banco (remover catch silencioso) | Backend | 1 dia |
| 6 | Configurar CI/CD (`.github/workflows/ci.yml`) | DevOps | 1 dia |
| 7 | Configurar Husky + lint-staged | DevOps | 0.5 dia |
| 8 | Implementar dotenvx com validação | DevOps | 0.5 dia |
| 9 | Corrigir dependência circular em finpay | Backend | 0.5 dia |
| 10 | Adicionar `meta.ts` em todas as 41 páginas restantes | Frontend | 1 dia |
| 11 | Adicionar `not-found.tsx` em todos os route groups | Frontend | 0.5 dia |
| 12 | Corrigir bypass de auth no proxy dev | Frontend | 0.5 dia |

### Fase 2 — ALTO IMPACTO (P1) — Semana 3-4

**Objetivo:** Estabilidade, performance e testabilidade.

| # | Tarefa | Responsável | Estimativa |
|---|--------|-------------|------------|
| 13 | Adotar oRPC ou remover regra #2 do AGENTS.md | Arquitetura | 2 dias |
| 14 | Converter páginas para Server Components onde possível | Frontend | 3 dias |
| 15 | Centralizar QueryClient (remover 4 instâncias duplicadas) | Frontend | 1 dia |
| 16 | Implementar Server Actions para mutações | Frontend | 2 dias |
| 17 | Substituir `<table>` nativas por componente shadcn Table | Frontend | 1 dia |
| 18 | Substituir `<select>` inline por componente shadcn Select | Frontend | 0.5 dia |
| 19 | Adicionar breadcrumbs nos layouts de dashboard | Frontend | 1 dia |
| 20 | Implementar bottom nav mobile no storefront | Frontend | 1 dia |
| 21 | Melhorar feedback de loading (spinner ao invés de "...") | Frontend | 0.5 dia |
| 22 | Corrigir contraste de cores (--destructive, --primary-foreground dark) | Frontend | 0.5 dia |
| 23 | Aumentar touch targets para 44px | Frontend | 0.5 dia |
| 24 | Adicionar skip links em todos os layouts | Frontend | 0.5 dia |
| 25 | Implementar `prefers-reduced-motion` | Frontend | 0.5 dia |
| 26 | Corrigir navegação de onboarding back | Frontend | 0.5 dia |
| 27 | Centralizar `<Toaster>` (remover duplicatas) | Frontend | 0.5 dia |
| 28 | Corrigir token JWT no proxy (validar assinatura/expiração) | Frontend | 1 dia |

### Fase 3 — TESTES (P1-P2) — Semana 5-8

**Objetivo:** Cobertura real e fluxos E2E funcionais.

| # | Tarefa | Responsável | Estimativa |
|---|--------|-------------|------------|
| 29 | Criar testes para `pharmacy.service.ts` | QA | 2 dias |
| 30 | Criar testes para `tenants.service.ts` | QA | 2 dias |
| 31 | Criar testes para `rate-limit/throttler-storage.service.ts` | QA | 1 dia |
| 32 | Configurar MSW para substituir mocks manuais | QA | 2 dias |
| 33 | Criar testes de integração com banco real (Docker) | QA | 3 dias |
| 34 | Expandir E2E Playwright para fluxos reais (login, pedido, pagamento, prescrição) | QA | 5 dias |
| 35 | Adicionar testes de segurança (XSS, SQL injection, rate limiting E2E) | QA | 3 dias |
| 36 | Adicionar testes de conformidade (LGPD, SAF-T real) | QA | 3 dias |
| 37 | Testar componentes React (Testing Library) | QA | 3 dias |
| 38 | Criar factories em `@brocolis/test-helpers` | QA | 2 dias |
| 39 | Adicionar `coverage.thresholds` no `vitest.config.ts` | QA | 0.5 dia |
| 40 | Configurar E2E no CI | DevOps | 1 dia |

### Fase 4 — POLIMENTO (P2-P3) — Semana 9-12

**Objetivo:** Enterprise polish.

| # | Tarefa | Responsável | Estimativa |
|---|--------|-------------|------------|
| 41 | Substituir emoji flags por texto/ícones no LocaleSwitcher | Frontend | 0.5 dia |
| 42 | Adicionar variant `hoverable` nos Cards | Frontend | 0.5 dia |
| 43 | Melhorar empty states em dashboards | Frontend | 1 dia |
| 44 | Adicionar validação inline nos steps do checkout | Frontend | 1 dia |
| 45 | Adicionar `aspect-ratio` nos CatalogCards | Frontend | 0.5 dia |
| 46 | Adicionar `id`/`htmlFor` no checkbox de pagamento | Frontend | 0.5 dia |
| 47 | Documentar design system (`MASTER.md`) | Frontend | 1 dia |
| 48 | Adicionar componentes faltantes (Breadcrumb, BottomNav, Spinner, EmptyState) | Frontend | 2 dias |
| 49 | Migrar mobile de Jest para Vitest | QA | 1 dia |
| 50 | Adicionar page objects no E2E | QA | 1 dia |

---

## 11. CHECKLIST DE GATES (AGENTS.md)

Antes de qualquer commit, o projeto deve passar por:

```bash
pnpm lint && pnpm typecheck && pnpm test:unit && node scripts/fitness-check.mjs
```

Após Fase 3, adicionar:

```bash
pnpm test:e2e
```

---

## 12. EVIDÊNCIAS NECESSÁRIAS

Conforme regra #10 do AGENTS.md, todo trabalho deve ter evidência em `.ai/state/evidence.json`. Criar para cada fase:

- `.ai/state/evidence.json` com decisões arquiteturais
- `.ai/state/evidence/auth-implementation.json`
- `.ai/state/evidence/migrations.json`
- `.ai/state/evidence/test-coverage.json`
- `.ai/state/evidence/e2e-flows.json`

---

## 13. CONCLUSÃO

O projeto Brócolis está em **fase de protótipo funcional**, não em produção enterprise. A fundação técnica existe (schema robusto, contracts Zod, estrutura de monorepo), mas faltam:

1. **Autenticação e segurança** (P0)
2. **Persistência real** (P0 — migrations + services em DB)
3. **CI/CD e qualidade** (P0)
4. **Testes reais** (P1 — banco real, E2E, segurança)
5. **UX/UI enterprise** (P1 — acessibilidade, performance, navegação)

**Recomendação:** Executar Fase 1 (bloqueadores) imediatamente, seguida de Fase 2 (estabilidade), antes de qualquer release. Fases 3 e 4 podem ser executadas em paralelo após Fase 2.

**Estimativa total:** 12 semanas (3 meses) com equipe de 3-4 desenvolvedores.
