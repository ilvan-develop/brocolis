# 19 — Multi-Tenant Strategy (Quotas, RLS, Billing)

> Aplica-se a **Fase 1 em diante**. Define a estratégia de multi-tenancy completa: isolamento de dados, quotas por tenant, billing metering, e self-service onboarding. O Brócolis é multi-tenant desde o schema; este documento profundiza a operação.

---

## 1. Princípios

| Princípio | Regra |
|-----------|-------|
| Tenant isolation | `organizationId` em toda query; zero cross-tenant leaks |
| Fair usage | Quotas previnem abuso; billing por utilização |
| Self-service | Tenant provisiona sem intervenção manual |
| Scalability | Shared database com Row-Level Security (RLS) |
| Billing metering | Usage tracking para billing preciso |

---

## 2. Tenant Isolation Levels

### 2.1 Isolation Strategy

| Nível | Implementação | Uso |
|-------|---------------|-----|
| **Database** | PostgreSQL Row-Level Security (RLS) | Isolamento de dados por tenant |
| **Application** | `organizationId` em todo contrato + middleware | Validação em cada request |
| **Cache** | Key prefix `org:{id}:` | Cache isolado por tenant |
| **Storage** | Path prefix `org/{id}/` | Documentos isolados |
| **Queue** | Job metadata `organizationId` | Jobs isolados |

### 2.2 Row-Level Security (RLS)

```sql
-- Habilitar RLS em tabelas críticas
ALTER TABLE market_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Policy: tenant só vê os seus dados
CREATE POLICY tenant_isolation_market_offers ON market_offers
  USING (organization_id = current_setting('app.current_organization_id')::text);

CREATE POLICY tenant_isolation_orders ON orders
  USING (organization_id = current_setting('app.current_organization_id')::text);

CREATE POLICY tenant_isolation_purchase_orders ON purchase_orders
  USING (organization_id = current_setting('app.current_organization_id')::text);

-- Admin bypass (platform_admin ignora RLS)
CREATE POLICY admin_bypass ON market_offers
  TO platform_admin_role
  USING (true);
```

### 2.3 Middleware de Isolamento

```ts
// Tenant middleware — toda rota
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const organizationId = req.headers['x-organization-id'];
    const user = req.user;
    
    if (!organizationId) {
      throw new ForbiddenException('organizationId required');
    }
    
    // Verificar membership
    const isMember = user.memberships.some(m => m.organizationId === organizationId);
    if (!isMember) {
      throw new ForbiddenException('Not a member of this organization');
    }
    
    // Set RLS context no Prisma
    this.prisma.$executeRawUnsafe(
      `SET app.current_organization_id = '${organizationId}'`
    );
    
    req.organizationId = organizationId;
    next();
  }
}
```

---

## 3. Tenant Resource Quotas

### 3.1 Quotas por plano

| Recurso | Free | Starter | Business | Enterprise |
|---------|------|---------|----------|------------|
| Utilizadores | 3 | 10 | 50 | Ilimitado |
| Produtos no catálogo | 100 | 1,000 | 10,000 | Ilimitado |
| Pedidos/mês | 50 | 500 | 5,000 | Ilimitado |
| Armazenamento | 500MB | 5GB | 50GB | Ilimitado |
| API requests/min | 30 | 100 | 500 | 1,000 |
| Webhooks | 3 | 10 | 50 | Ilimitado |
| Relatórios | Básico | Standard | Avançado | Custom |
| Suporte | Email | Email + Chat | Prioritário | Dedicado |

### 3.2 Quota Enforcement

```ts
// Quota middleware
@Injectable()
export class QuotaMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const org = await this.getOrganization(req.organizationId);
    const quota = this.getQuota(org.plan);
    
    // Verificar rate limit
    const currentUsage = await this.redis.get(`quota:${org.id}:requests`);
    if (currentUsage && parseInt(currentUsage) > quota.requestsPerMin) {
      throw new TooManyRequestsException('Quota exceeded');
    }
    
    // Verificar storage
    if (req.headers['content-length']) {
      const currentStorage = await this.getStorageUsage(org.id);
      if (currentStorage + parseInt(req.headers['content-length']) > quota.storageBytes) {
        throw new QuotaExceededException('Storage quota exceeded');
      }
    }
    
    // Incrementar counter
    await this.redis.incr(`quota:${org.id}:requests`);
    await this.redis.expire(`quota:${org.id}:requests`, 60);
    
    // Adicionar headers de quota
    res.set('X-Quota-Limit', quota.requestsPerMin.toString());
    res.set('X-Quota-Remaining', (quota.requestsPerMin - (parseInt(currentUsage || '0') + 1)).toString());
    
    next();
  }
}
```

---

## 4. Billing Metering

### 4.1 Events de billing

| Evento | Dados | Uso |
|--------|-------|-----|
| `order.created` | orgId, amount, items | Comissão 5% |
| `order.completed` | orgId, amount | Settlement |
| `user.created` | orgId | Utilizadores activos |
| `storage.used` | orgId, bytes | Armazenamento |
| `api.request` | orgId, endpoint | Requests API |
| `feature.used` | orgId, feature | Features premium |

### 4.2 Billing Event Schema

```ts
// packages/contracts/src/billing.ts
export const billingEventSchema = z.object({
  id: z.string().cuid(),
  organizationId: organizationIdSchema,
  event: z.enum([
    'order.created',
    'order.completed',
    'user.created',
    'storage.used',
    'api.request',
    'feature.used',
  ]),
  quantity: z.number().int().min(1),
  amount: z.number(), // em centavos
  currency: z.string().default('AOA'),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.date(),
});
```

### 4.3 Metering Implementation

```ts
// Billing service
@Injectable()
export class BillingService {
  async trackEvent(event: BillingEvent): Promise<void> {
    // 1. Registar evento
    await this.prisma.billingEvent.create({ data: event });
    
    // 2. Actualizar usage counters
    await this.redis.hincrby(
      `billing:${event.organizationId}:usage`,
      event.event,
      event.quantity
    );
    
    // 3. Verificar limites do plano
    const org = await this.getOrganization(event.organizationId);
    const plan = this.getPlan(org.plan);
    const usage = await this.getUsage(event.organizationId);
    
    // 4. Alertar se > 80% do limite
    for (const [metric, limit] of Object.entries(plan.limits)) {
      if (usage[metric] > limit * 0.8) {
        await this.notifyQuotaWarning(org, metric, usage[metric], limit);
      }
    }
    
    // 5. Block se > 100% (excepto orders —never block sales)
    if (metric !== 'orders' && usage[metric] > limit) {
      await this.notifyQuotaExceeded(org, metric);
    }
  }
}
```

---

## 5. Self-Service Onboarding

### 5.1 Fluxo automatizado

```
Tenant regista-se (F1 auth)
    │
    ▼
Seleciona plano (Free/Starter/Business/Enterprise)
    │
    ▼
Stripe/FinPay subscription (ou trial 14d)
    │
    ▼
Auto-provisioning:
    ├── Criar organization
    ├── Configurar plan features
    ├── Criar default roles
    ├── Enviar convites
    └── Activar portal
    │
    ▼
Onboarding wizard (03-EXPERIENCE-ARCHITECTURE.md)
    │
    ▼
Primeiro pedido → billing metering activo
```

### 5.2 Plan provisioning

```ts
async function provisionTenant(input: ProvisionInput): Promise<Tenant> {
  return this.prisma.$transaction(async (tx) => {
    // 1. Criar organização
    const org = await tx.organization.create({
      data: {
        name: input.name,
        type: input.type,
        plan: input.plan,
        marketCode: input.marketCode,
        status: 'ACTIVE',
      },
    });
    
    // 2. Configurar features do plano
    const planFeatures = this.getPlanFeatures(input.plan);
    await tx.orgFeatureFlag.createMany({
      data: planFeatures.map(f => ({
        organizationId: org.id,
        feature: f.key,
        enabled: f.defaultValue,
      })),
    });
    
    // 3. Criar roles padrão
    const defaultRoles = this.getDefaultRoles(input.type);
    await tx.role.createMany({
      data: defaultRoles.map(r => ({
        organizationId: org.id,
        name: r.name,
        permissions: r.permissions,
      })),
    });
    
    // 4. Activar metering
    await this.billingService.activateMetering(org.id);
    
    // 5. Audit
    await tx.auditEvent.create({
      data: {
        organizationId: org.id,
        marketCode: input.marketCode,
        actorType: 'system',
        actorId: 'system',
        action: 'TENANT_PROVISIONED',
        resourceType: 'Organization',
        resourceId: org.id,
        payload: { plan: input.plan },
      },
    });
    
    return org;
  });
}
```

---

## 6. Tenant Plan Management

### 6.1 Plan Features

| Feature | Free | Starter | Business | Enterprise |
|---------|------|---------|----------|------------|
| B2C storefront | ✅ | ✅ | ✅ | ✅ |
| B2B procurement | ❌ | ✅ | ✅ | ✅ |
| B2B2C network | ❌ | ❌ | ✅ | ✅ |
| Multi-pharmacy | ❌ | 1 | 10 | Ilimitado |
| Custom branding | ❌ | ❌ | ✅ | ✅ |
| API access | ❌ | ✅ | ✅ | ✅ |
| Webhooks | ❌ | ✅ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ | ✅ |
| Dedicated account manager | ❌ | ❌ | ❌ | ✅ |
| SLA guarantee | ❌ | ❌ | 99.5% | 99.9% |

### 6.2 Plan Upgrade/Downgrade

```ts
async function changePlan(orgId: string, newPlan: Plan): Promise<void> {
  const org = await this.getOrganization(orgId);
  const oldPlan = org.plan;
  
  // Verificar se upgrade ou downgrade
  const isUpgrade = PLAN_ORDER[newPlan] > PLAN_ORDER[oldPlan];
  
  await this.prisma.$transaction(async (tx) => {
    // 1. Actualizar plano
    await tx.organization.update({
      where: { id: orgId },
      data: { plan: newPlan },
    });
    
    // 2. Actualizar features
    if (isUpgrade) {
      // Adicionar features novas
      const newFeatures = this.getPlanFeatures(newPlan).filter(
        f => !org.features.includes(f.key)
      );
      await tx.orgFeatureFlag.createMany({
        data: newFeatures.map(f => ({
          organizationId: orgId,
          feature: f.key,
          enabled: f.defaultValue,
        })),
      });
    } else {
      // Remover features que o plano novo não inclui
      const removedFeatures = this.getPlanFeatures(oldPlan).filter(
        f => !this.getPlanFeatures(newPlan).some(pf => pf.key === f.key)
      );
      await tx.orgFeatureFlag.deleteMany({
        where: {
          organizationId: orgId,
          feature: { in: removedFeatures.map(f => f.key) },
        },
      });
    }
    
    // 3. Audit
    await tx.auditEvent.create({
      data: {
        organizationId: orgId,
        marketCode: org.marketCode,
        actorType: 'system',
        actorId: 'system',
        action: 'PLAN_CHANGED',
        resourceType: 'Organization',
        resourceId: orgId,
        payload: { oldPlan, newPlan, isUpgrade },
      },
    });
    
    // 4. Notificar
    await this.notificationService.notify(orgId, {
      type: 'PLAN_CHANGED',
      title: `Plano alterado para ${newPlan}`,
      body: isUpgrade 
        ? 'Agora tens acesso a mais funcionalidades!'
        : 'O teu plano foi alterado. Algumas funcionalidades podem ficar indisponíveis.',
    });
  });
}
```

---

## 7. Tenant Analytics

### 7.1 Metrics por tenant

| Métrica | Cálculo | Uso |
|---------|---------|-----|
| MRR (Monthly Recurring Revenue) | Σ(plan price per org) | Revenue forecast |
| ARPU (Average Revenue Per User) | MRR / total users | Pricing decisions |
| Churn rate | Orgs cancelled / total orgs | Retention analysis |
| Usage growth | Δ usage month-over-month | Plan recommendations |
| Feature adoption | Features used / features available | Product decisions |

### 7.2 Dashboard de tenant health

```
TENANT HEALTH DASHBOARD
═══════════════════════════════════════

Total tenants: 247
├── Free: 180 (73%)
├── Starter: 45 (18%)
├── Business: 18 (7%)
└── Enterprise: 4 (2%)

MRR: 2,450,000 Kz
ARPU: 9,919 Kz
Churn (30d): 3.2%

Top tenants by usage:
1. Farmácia Central (Business) — 1,247 orders
2. Distribuidor XYZ (Enterprise) — 892 orders
3. Clínica ABC (Starter) — 234 orders

Quota warnings:
- Farmácia Central: storage 82% (5GB/6GB)
- Loja Premium: API 78% (78/100 req/min)
```

---

## 8. Anti-patterns de Multi-Tenancy

| Anti-pattern | Correto |
|--------------|---------|
| Shared data sem RLS | PostgreSQL RLS + middleware validation |
| Quotas sem enforcement | Middleware que bloqueia |
| Billing sem metering | Event tracking por tenant |
| Onboarding manual | Self-service + auto-provisioning |
| Planos sem features | Feature flags por plano |
| Cross-tenant query | `organizationId` obrigatório + audit |
| Sem usage alerts | Alertas a 80% e 100% do limite |
| Downgrade sem verificação | Verificar features activas antes de downgrade |

---

*Este documento é actualizado sempre que novos planos, features ou quotas são adicionados.*
