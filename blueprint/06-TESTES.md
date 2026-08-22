# 06 — Estratégia de Testes

> Aplica-se a **todas as fases, desde a Fase 0**. Nenhum código merge sem testes. Tríade: **unit** (Vitest), **integração** (Postgres 17 + Redis 8 reais em docker), **E2E** (Playwright web + Maestro mobile) e **contrato** (oRPC ↔ implementação). Cobre ainda **formatters, i18n, market packs, offline** e **pagamentos FinPay**.

---

## 1. Princípios

1. **Testes desde o princípio.** Cobertura ≥80% gate desde a F0.
2. **Pirâmide invertida**: muitas unit, médias integração, poucas E2E (jornadas críticas).
3. **Unit não toca infra.** Services e lógica pura com mocks.
4. **Integração usa infra real** (Postgres + Redis + FinPay mock em docker), nunca mocks que mentem.
5. **E2E testa jornadas de negócio** com selectors resilientes (`data-testid`).
6. **Contrato testa drift** entre contracts oRPC (Zod) e implementação backend.
7. **Mobile**: Jest + Testing Library (unit), Maestro (E2E em device/EAS).
8. **Anti-patterns**: proibido `sleep()`, ordem-dependentes, mocks mal construídos, snapshot frágil.

---

## 2. A tríade (mapa)

| Nível | Ferramenta | Infra | O que testa | Onde |
|-------|-----------|-------|-------------|------|
| **Unit** | Vitest 4 | nenhuma (mocks) | services, pricing, procurement rules, RBAC, Zod schemas, formatters, i18n, markets | `*.test.ts` junto do código |
| **Unit mobile** | Jest + Testing Library RN | nenhuma | componentes RN, hooks, stores | `apps/mobile/src/**/*.test.tsx` |
| **Integração** | Vitest 4 | Postgres 17 + Redis 8 + FinPay mock (docker-compose.test.yml) | pipeline checkout→pagamento, stores Prisma, webhook FinPay, settlement | `apps/api/src/**/__integration__/*.test.ts` |
| **E2E web** | Playwright 1.61 | stack completa + seed | jornadas: auth, B2C, pharmacy, procurement, admin | `apps/qa/e2e/**` |
| **E2E mobile** | Maestro | Expo dev + mock API | jornadas B2C, offline, push | `apps/qa/maestro/**` |
| **Contrato** | Vitest + biome | none | contracts ↔ controllers, oRPC ↔ mobile client | `packages/contracts/__tests__`, `check:drift` |

### Tabela de comandos

```bash
pnpm test:unit           # turbo run test:unit
pnpm test:integration    # turbo run test:integration (exige docker)
pnpm test:e2e            # turbo run test:e2e
pnpm e2e:setup           # docker up + migrate + seed
pnpm check:drift         # contrato: contracts ↔ implementação
pnpm test -- --coverage  # cobertura (gate ≥80%)
```

---

## 3. Testes unit (Vitest + Jest)

### Regras

- Ficheiro `*.test.ts` junto do código-fonte.
- Nada de infra real; time fake para expiração; crypto real.
- Lógica pura testada à parte: pricing, volume tiers, validação de endereço, regras de mercado.

### Cobertura unit mínima por módulo

| Módulo | Casos obrigatórios |
|--------|--------------------|
| Formatters | `Money` (AOA/MZN/BRL), `PhoneNumber` (+244), `Address` (ponto de referência), `Percentage` |
| Markets | `getMarket("AO")` resolve; campos ausentes falham; pack MZ/KE presentes no contrato |
| i18n | `t("commerce.cart.add")` pt-AO; locale inexistente cai para fallback |
| Pricing | volume tiers exactos, preço parceiro, margem estimada |
| Procurement | RFQ→quotation, approval por valor, limite de crédito |
| Prescriptions | estados, validação de controlados, expiração |
| RBAC | matriz role×permissão por portal (403 quando sem permissão) |
| Zod contracts | inputs válidos/inválidos, `organizationId`+`marketCode` obrigatórios |
| FinPay adapter (mock) | createIntent/getIntent/refund, assinatura HMAC, retry |

---

## 4. Testes de integração (Vitest + docker)

### Setup `docker-compose.test.yml`

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: brocolis_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["${BROCOLIS_TEST_POSTGRES_PORT:-25432}:5432"]
  redis:
    image: redis:8-alpine
    ports: ["${BROCOLIS_TEST_REDIS_PORT:-26379}:6379"]
```

> A FinPay real não existe em dev: o `FinPayMockProvider` (`FINPAY_MODE=mock`) roda dentro do processo de teste. Ver `07-FINPAY-INTEGRATION.md`.

### Regras

- Banco limpo por suite (truncate); nunca cache de turbo.
- Checkout B2C completo: carrinho → receita → PaymentIntent (mock) → webhook CONFIRMED → pedido → entrega → AuditEvent.
- Procurement: RFQ → cotação → PO → approval → stock alimentado (B2B2C).
- Settlement: pedidos pagos → settlement semanal com reserva e comissão.
- Webhook FinPay: entrega com HMAC, retry, dead-letter.

---

## 5. Testes E2E (Playwright web + Maestro mobile)

### Config `playwright.config.ts` (em `apps/qa`, fonte única de E2E web)

```ts
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [{ command: "pnpm --filter @brocolis/web dev", url: "http://localhost:3000" }],
});
```

### Jornadas E2E web obrigatórias

| Jornada | Fase | Assert crítico |
|---------|------|----------------|
| Registo → verificação → organização | F1 | Utilizador entra no portal |
| Org-switcher + RBAC | F1 | Admin vê tudo; viewer não vê acções |
| B2C: pesquisa → carrinho → receita → pagamento | F2 | Pedido → PaymentIntent (mock) → CONFIRMED |
| Pharmacy: receita → dispensa → entrega | F3 | Status progride até ENTREGUE |
| Procurement: RFQ → PO → approval | F4 | PO aprovada alimenta stock |
| Admin: verificação de farmácia | F3 | VERIFIED/SUSPENDED |
| B2B2C: cliente → farmácia → fornecedor → entrega | F6 | Timeline completa visível |
| Compliance: audit explorer + export SAF-T | F7 | Eventos filtrados; export válido |

### E2E mobile (Maestro)

| Jornada | Assert crítico |
|---------|----------------|
| Catálogo offline → online sync | Pedido guardado localmente; estado syncing |
| Upload de receita (camera/gallery) | Receita PENDING |
| Pagamento FinPay (mock) | PaymentStatus CONFIRMED |
| Push notification de status | Notificação recebida |
| Baixa conectividade | Skeleton + retry visíveis |

### Selectors resilientes

- `data-testid` (ex: `[data-testid="product-card"]`).
- Nunca depender de texto que muda (i18n).
- Esperar por estado (`toBeVisible`, `toBeEnabled`), nunca `sleep`.

---

## 6. Testes de contrato e drift

### Objectivo

Detectar drift entre `packages/contracts` (Zod + oRPC) e a implementação backend e o client mobile.

### Ferramentas

- `api-contract-drift` skill (Zod schemas ↔ controllers).
- Task turbo `check:drift` por package.
- O `@orpc/client` no mobile partilha os mesmos contratos: mudança quebra CI em web e mobile.

### Regras

- Toda procedure oRPC tem contrato; todo contrato tem procedure.
- Mudança de contrato quebra CI (não só warning).
- Testes de contrato nos `__tests__` de `packages/contracts`.

---

## 7. Cobertura e gates

| Gate | Threshold | Acção |
|------|-----------|-------|
| Lint (biome) | 0 erros | Block |
| Typecheck | 0 erros | Block |
| Build | 0 erros | Block |
| Unit + integração | todos pass | Block |
| Cobertura | ≥80% | Warn→Block em release |
| E2E web + mobile | jornadas verdes | Block em PR de feature |
| Contrato | 0 drift | Block |

---

## 8. Anti-patterns de testes (resumo)

| Anti-pattern | Correto |
|--------------|---------|
| `sleep()`/timeout para esperar UI | `expect(...).toBeVisible()` + `waitFor` |
| Mock de store que nunca falha | Variar: sucesso, vazio, erro, concorrência |
| Teste dependente de ordem | Isolado, `beforeEach` a resetar |
| Assertion de texto frágil | `data-testid` + estado acessível |
| E2E com dados de produção | Seed determinístico por suite |
| Snapshot gigante de componente | Asserts de acessibilidade + tokens |
| `any`/casts em testes | Tipos derivados de Zod |
| Testar a FinPay real | Sempre `FinPayMockProvider` em dev/test |
| Formatter testado com moeda única | Matriz AOA/MZN/BRL |
| Ignorar caminhos de erro | Erros como cidadãos de 1ª classe |

---

## 9. Testes Enterprise (adicionais)

### 9.1 Chaos Engineering

| Ferramenta | Uso | Frequência |
|------------|-----|------------|
| Litmus Chaos | Failure injection em Kubernetes | Mensal |
| Chaos Monkey | Random instance termination | Contínuo (staging) |
| Toxiproxy | Network fault injection | Sem testes de integração |

**Cenários de chaos:**
```yaml
# chaos-experiments.yaml
experiments:
  - name: database-latency
    description: Simular latência alta no PostgreSQL
    action: inject-latency --target postgres --duration 5m --latency 500ms
    expected: API degrada graceful; retries funcionam
    
  - name: redis-down
    description: Simular queda do Redis
    action: kill-service --target redis --duration 2m
    expected: Rate limit bypass; cache miss; degrade graceful
    
  - name: finpay-timeout
    description: Simular timeout da FinPay
    action: inject-timeout --target finpay --duration 3m
    expected: Circuit breaker abre; pedidos ficam PENDING; retry funciona
```

### 9.2 Contract Testing (Pact)

Além do drift check, usar Pact para contract testing entre consumidores e providers:

```ts
// packages/contracts/__tests__/pact/catalog.pact.test.ts
describe('Catalog Contract', () => {
  it('should return market offers for valid query', async () => {
    await provider.addInteraction({
      state: 'market offers exist',
      uponReceiving: 'request for market offers',
      withRequest: {
        method: 'GET',
        path: '/catalog/offers',
        query: { marketCode: 'AO', limit: '20' },
      },
      willRespondWith: {
        status: 200,
        body: { offers: Matchers.arrayLike(catalogOfferFixture) },
      },
    });
  });
});
```

### 9.3 Performance Testing (k6)

```javascript
// apps/qa/performance/checkout.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 },   // ramp up
    { duration: '5m', target: 50 },   // load normal
    { duration: '2m', target: 100 },  // spike
    { duration: '5m', target: 50 },   // recovery
    { duration: '2m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // P95 < 300ms
    http_req_failed: ['rate<0.01'],   // < 1% errors
  },
};

export default function () {
  const res = http.get('http://api.brocolis.ao/catalog/offers?marketCode=AO');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 300ms': (r) => r.timings.duration < 300,
  });
  sleep(1);
}
```

### 9.4 Security Testing (OWASP ZAP)

```yaml
# .github/workflows/security-scan.yml
- name: Run OWASP ZAP
  use: zaproxy/action-full-scan@v0.10.0
  with:
    target: http://localhost:3000
    rules_file: '.zap/rules.tsv'
    cmd_options: '-a'
    
- name: Run Snyk Security
  uses: snyk/actions/node@master
  with:
    command: test
    args: --severity-threshold=high
```

### 9.5 Mutation Testing (Stryker)

```ts
// stryker.config.ts
export default {
  mutator: 'typescript',
  packageManager: 'pnpm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },
};
```

### 9.6 Testes de Contract Drift Detalhados

```bash
# Check completo de drift
pnpm check:drift

# O que verifica:
# 1. Contratos oRPC ↔ controllers NestJS
# 2. Zod schemas ↔ Prisma models
# 3. oRPC client mobile ↔ contratos
# 4. Storybook stories ↔ componentes reais
```
