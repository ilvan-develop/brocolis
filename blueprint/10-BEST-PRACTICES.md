# 10 — Best Practices (DO / DON'T) e Lições Aplicadas

> Aplica-se a **todas as fases**. Consolida as lições aprendidas no FinPay v1, no projecto Brócolis anterior (gap analysis) e as melhores práticas 2026. Tudo aqui é **evidência do histórico real** — o v2 começa já sem estas dívidas.

---

## 1. Lições do FinPay v1 + Brócolis anterior (evidência → regra v2)

| # | Problema (evidência) | Regra v2 |
|---|--------------------------|----------|
| 1 | `@tanstack/react-query` em devDependencies | query no catálogo, `dependencies` |
| 2 | Rotas oRPC sem guards de auth | Middleware auth + RBAC por defeito |
| 3 | `listX` retornava todos os orgs (IDOR) | `organizationId` obrigatório no contrato e service |
| 4 | Checkout/cart com `customerId` da URL (IDOR) | Identidade de `@CurrentUser()`, nunca de parâmetros |
| 5 | Sem `$transaction` em checkout/pagamentos/cupões | Toda mutação multi-escrita em `$transaction` |
| 6 | `bcryptjs` morto no package.json | dependency hygiene |
| 7 | `navItems` duplicado | config-driven `src/lib/navigation.ts` com `roles` |
| 8 | Invalidation key errada | query keys tipadas e centralizadas |
| 9 | `loading.tsx` com "use client" desnecessário | Server Components first |
| 10 | Env vars ausentes no schema | `packages/validation` com todas as env |
| 11 | Sheet sem focus trap | Focus trap + body scroll lock |
| 12 | Rate limiting adiado | Throttler + Redis desde a F7 |
| 13 | Audit sem restrição de role | `@Roles(...)` em operações de auditoria |
| 14 | Sem CSRF / SameSite | cookies SameSite=Strict + headers |
| 15 | Scrypt abaixo OWASP | N=32768, maxmem 128MB |
| 16 | `service_role` usado directo | signed URLs; nunca service_role no cliente |
| 17 | OTP armazenado plaintext | Hash; nunca plaintext |
| 18 | `NEXT_PUBLIC_APP_URL` como baseURL | baseURL server-side |
| 19 | Org em localStorage (XSS → cross-org) | cookie SameSite=Strict |
| 20 | Sem limite de upload | 10MB + MIME whitelist |
| 21 | Health endpoint com vazamento | health sanitizado |
| 22 | Sem redirect HTTP→HTTPS / HSTS | redirect + HSTS |
| 23 | Polling agressivo | 60s pedidos, 30s status, 60s reviews |
| 24 | Better Auth versão divergente entre packages | pinning via catálogo (^1.6.26) |
| 25 | Seed criava próprio PrismaClient | proxy `@brocolis/db` |
| 26 | Dois logger | `@brocolis/observability` única fonte |
| 27 | Schemas de domínio em falta | contracts-first: todo tipo de domínio tem Zod |
| 28 | Procedimentos oRPC sem contrato | nenhuma procedure sem contrato |
| 29 | API client sem retry/timeout/abort | AbortController 15s + 2 retries |
| 30 | Placeholder de secret aceite | `.refine()` rejeita placeholders |
| 31 | `z.any()` x74 em contratos | tipos derivados de Zod, sem `any` |
| 32 | `if (country === ...)` espalhado | `@brocolis/markets` (Build Global. Configure Local.) |
| 33 | Moeda/endereço/telefone hardcoded | `@brocolis/formatters` + Market config |
| 34 | `MulticaixaButton`/componente de país | `PaymentMethod` + provider adapter |
| 35 | Texto dentro de componente | `t()` via `@brocolis/i18n` |
| 36 | Paleta mobile paralela ao web | NativeWind gerado do `design.json` |
| 37 | Stripe/outro gateway | `@brocolis/finpay` (FinPay é a processadora) |
| 38 | Webhook FinPay sem verificação HMAC | sempre verificar + idempotência por event.id |

---

## 2. Lições da Appy Saúde (concorrente) aplicadas ao MVP v1

> Análise completa em `13-ANALISE-CONCORRENCIA.md`. As fraquezas mais reclamadas da Appy (3,8★, 401 avaliações) viram **requisitos técnicos do MVP v1** — é a nossa vantagem de entrada.

| # | Fraqueza da Appy | Regra v2 (MVP v1) |
|---|------------------|-------------------|
| 1 | Login "bad request" | Auth **contract-first** + E2E de sign-in/OTP na F1 (06-TESTES) |
| 2 | OTP que não chega | OTP com **redundância de canal**: email + WhatsApp (RF-01/03, 03 §22) |
| 3 | Mapa em webview | **Mapas nativos** (expo-maps/Leaflet) com fallback offline (03 §15) |
| 4 | Zona de entrega só descoberta após checkout | Zona de serviço **antes do checkout** (RF-24 filtro + RF-33, 03 §15) |
| 5 | App lenta ("muitos loadings") | NFR: P95 < 300ms, Lighthouse ≥ 90, offline-first (00 §7, 03 §24) |
| 6 | Experiência de "site convertido em apk" | Design System único + tokens (04), NativeWind gerado |

---

## 3. DO / DON'T (checklist por área)

### Arquitectura

- **DO**: bounded contexts, aggregate roots, tenant+market isolation no contrato.
- **DON'T**: módulo gigante, queries cross-tenant, `if (country === ...)` no Core.
- **DO**: ADR antes de decisão arquitectural.

### Contratos

- **DO**: oRPC + Zod em `@brocolis/contracts`; tipos com `z.infer`.
- **DON'T**: tipos manuais duplicados; rotas sem contrato; duas versões de oRPC.
- **DO**: `organizationId` + `marketCode` em todo input scoped; mutations idempotentes.

### Banco (Prisma)

- **DO**: Decimal para montante; índices `(organizationId, marketCode, status, createdAt)`.
- **DON'T**: float para dinheiro; migrations sem review; UPDATE/DELETE em AuditEvent.
- **DO**: driver adapter `PrismaPg`; proxy `@brocolis/db`; seed idempotente.

### Design system

- **DO**: tokens semânticos (4 camadas), `design.json`, `meta.ts`, blocks, `models`.
- **DON'T**: hex cru; moeda/pais hardcoded; tema por produto; `"use client"` no topo.
- **DO**: `Money`/`Address`/`PaymentMethod`/`PhoneNumber` globais; mobile = mesmos tokens.

### Pagamentos (FinPay)

- **DO**: adapter único `@brocolis/finpay`; mock em dev/test; webhook HMAC + retry.
- **DON'T**: Stripe; `fetch` directo à FinPay; montante float; sem idempotência.
- **DO**: `PaymentStatusHistory` append-only; settlements com reserva e comissão.

### Segurança

- **DO**: signed URLs, scrypt OWASP, MFA, RBAC, helmet+throttler, dotenvx.
- **DON'T**: service_role no cliente, secrets em git, URLs públicas de documentos.
- **DO**: health sanitizado; redacção de PII nos logs.

### Testes

- **DO**: unit + integração + E2E por fase; cobertura ≥80%; contrato/drift.
- **DON'T**: `sleep()`, flaky, mocks que mentem, testes sem caminho de erro.
- **DO**: `FinPayMockProvider` em dev/test; formatters testados com matriz de moedas.

### Mobile

- **DO**: Expo SDK 57, Expo Router, TanStack Query (server state), Zustand (UI state), SecureStore para sessão.
- **DON'T**: token em AsyncStorage; Redux/Zustand como cache de API; `fetch` manual; `Platform.OS` espalhado.
- **DO**: offline-first (cache catálogo, pedido local, syncing); low-bandwidth.

### Monorepo

- **DO**: catálogo único, overrides pinned, allowBuilds explícito.
- **DON'T**: dependências divergentes, logging duplicado, `@types/node` fora do runtime.
- **DO**: engines node 24/pnpm 11; turbo com `cache: false` em migrações/testes que mutam estado.

---

## 4. Checklist de qualidade antes de cada commit

```
[ ] pnpm lint               (biome, 0 erros)
[ ] pnpm typecheck          (0 erros)
[ ] pnpm build              (0 erros)
[ ] pnpm test:unit          (100% pass)
[ ] pnpm test:integration   (100% pass, se aplicável)
[ ] pnpm test:e2e           (jornadas da fase verdes)
[ ] Cobertura ≥80%
[ ] Contracts: organizationId+marketCode+idempotência ok
[ ] meta.ts presente em componente novo
[ ] Nenhum hex cru / moeda / país hardcoded
[ ] Nenhuma PII em logs / URLs públicas
[ ] ADR criado se decisão arquitectural
[ ] Docs actualizados (sem drift)
```

---

## 5. Anti-patterns de processo (evitar desde o dia 1)

| Anti-pattern | Correto |
|--------------|---------|
| Testes depois da feature | Testes na mesma PR |
| Docs desactualizados | Drift de docs = falha de CI |
| Design system depois da UI | F-DS antes de qualquer UI de produto |
| Stripe como processadora | FinPay é a processadora |
| País hardcoded no Core | Country Pack em `@brocolis/markets` |
| Dependência sem justificação | Audit + catálogo + ADR |
| Refactor sem testes | Primeiro testes verdes, depois refactor |
| Migração sem staging | `db:migrate:deploy` em staging primeiro |
| Monitorizar depois do launch | Observabilidade em cada fase |
| Fase sem evidência | Registar `state/evidence.json` antes de avançar |
| Escopo fora do MVP | Milestone MVP v1 é só F0→F-EX→F-DS→F1→F2→F3; resto é backlog (09 §Milestones) |

---

## 6. Nota final

O Brócolis v2 não recomeça do zero: recomeça **melhor**, porque carrega as lições do FinPay v1 e do Brócolis anterior como regras, um design system Africa-first arquitectado para 2026, contratos-first, mercado plugável e testes desde o primeiro commit. Cada fase entrega valor comercial funcional e fecha com gates verdes + evidência.
