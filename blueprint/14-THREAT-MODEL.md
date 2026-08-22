# 14 — Threat Model e Segurança Formal

> Aplica-se a **todas as fases**. Define o threat model STRIDE por bounded context, attack trees, e as mitigações arquitecturais. Obrigatório antes da Fase 1 (IAM) e actualizado em cada fase que exponha superfície de ataque nova.

---

## 1. Princípios de Segurança

| Princípio | Regra |
|-----------|-------|
| Defence in depth | Múltiplas camadas; nenhuma depende de uma só |
| Least privilege | Cada serviço/sessão/role só tem o mínimo necessário |
| Zero trust | Nunca confiar em rede interna; validar tudo |
| Security by design | Threat model antes do código; mitigações no schema/contrato |
| Audit everything | Toda acção sensível registada; append-only |
| Fail secure | Em erro, negar acesso; nunca degradar para aberto |

---

## 2. STRIDE por Bounded Context

### 2.1 Identity & Access (IAM)

| Ameaça | STRIDE | Risco | Mitigação |
|--------|--------|-------|-----------|
| Credential stuffing | Spoofing | Alto | Rate limiting + MFA TOTP + account lockout |
| Session hijacking | Spoofing | Alto | Server-side sessions, SameSite=Strict, idle timeout 30min |
| Privilege escalation | Elevation | Crítico | RBAC guard em toda rota; `@Roles()` obrigatório |
| Token replay | Repudiation | Médio | Idempotency keys, nonce por request |
| Password brute force | Spoofing | Alto | Scrypt N=32768 + throttler Redis (5 tentativas/min) |
| MFA bypass | Elevation | Alto | TOTP com janela ±1; backup codes hashed |
| Invitation abuse | Spoofing | Médio | Expiração 7d, email verificado, max 5 pending/org |

**Attack tree — Account takeover:**
```
Account Takeover
├── Credential stuffing
│   ├── Rate limit (Throttler) ─── BLOQUEADO
│   ├── MFA TOTP ─── BLOQUEADO
│   └── Account lockout ─── BLOQUEADO
├── Session hijacking
│   ├── SameSite=Strict ─── BLOQUEADO
│   ├── HTTPS-only cookies ─── BLOQUEADO
│   └── Idle timeout 30min ─── BLOQUEADO
└── Password reset abuse
    ├── Token expira 15min ─── BLOQUEADO
    ├── One-time use ─── BLOQUEADO
    └── Rate limit no request ─── BLOQUEADO
```

### 2.2 Tenants & Organizations

| Ameaça | STRIDE | Risco | Mitigação |
|--------|--------|-------|-----------|
| Cross-tenant IDOR | Information disclosure | Crítico | `organizationId` em todo contrato + validação membership |
| Tenant data leak via search | Information disclosure | Alto | `marketCode` + `organizationId` em toda query |
| Org settings tampering | Tampering | Alto | `org:write` restrito a owner/admin |
| Invitation spoofing | Spoofing | Médio | Email verificado + token assinado |
| White-label injection | Tampering | Médio | Apenas platform_admin pode alterar |

### 2.3 Catalog & Products

| Ameaça | STRIDE | Risco | Mitigação |
|--------|--------|-------|-----------|
| Price manipulation | Tampering | Alto | Preço definido pelo supplier; buyer não altera |
| SKU injection | Tampering | Médio | Validação Zod + sanitização |
| Cross-market product leak | Information disclosure | Alto | `marketCode` obrigatório; query scoped |
| Inventory spoofing | Elevation | Alto | Stock real do banco; nunca cache stale |

### 2.4 Orders & Fulfillment

| Ameaça | STRIDE | Risco | Mitigação |
|--------|--------|-------|-----------|
| Order manipulation | Tampering | Alto | Status append-only; sem UPDATE directo |
| Double spending | Elevation | Crítico | Idempotency key + `$transaction` |
| Price race condition | Tampering | Alto | Lock pessimista no checkout + stock reservation |
| Cancel after confirm | Repudiation | Médio | Regras de cancelamento por estado |

### 2.5 Payments & Settlement (FinPay)

| Ameaça | STRIDE | Risco | Mitigação |
|--------|--------|-------|-----------|
| Webhook forgery | Spoofing | Crítico | HMAC SHA-256 verification obrigatória |
| Amount tampering | Tampering | Crítico | Montante do server-side; nunca do client |
| Refund replay | Elevation | Alto | Idempotency + estado CONFIRMED only |
| Settlement manipulation | Tampering | Alto | Append-only; cálculo automático |
| PCI data exposure | Information disclosure | Crítico | Nunca dados de cartão no Brócolis |
| FinPay API key leak | Spoofing | Crítico | envx; never in code; rotation policy |

### 2.6 Delivery & Logistics

| Ameaça | STRIDE | Risco | Mitigação |
|--------|--------|-------|-----------|
| Driver impersonation | Spoofing | Alto | Autenticação obrigatória + GPS verification |
| Delivery proof forgery | Repudiation | Médio | Foto + assinatura + timestamp + GPS |
| Zone bypass | Elevation | Médio | Validação de zona no checkout |

### 2.7 Prescriptions

| Ameaça | STRIDE | Risco | Mitigação |
|--------|--------|-------|-----------|
| Fake prescription upload | Spoofing | Crítico | Pharmacist review obrigatório |
| Prescription reuse | Elevation | Alto | One-time use; status tracking |
| Controlled substance abuse | Elevation | Crítico | Regras por mercado; quantity limits |

### 2.8 Notifications & WhatsApp

| Ameaça | STRIDE | Risco | Mitigação |
|--------|--------|-------|-----------|
| Notification spoofing | Spoofing | Médio | Canal assinado; template validado |
| WhatsApp phishing | Spoofing | Alto | Links oficiais; verificação de domínio |
| Email header injection | Tampering | Médio | Sanitização de input |

### 2.9 Audit & Platform

| Ameaça | STRIDE | Risco | Mitigação |
|--------|--------|-------|-----------|
| Audit trail tampering | Tampering | Crítico | Append-only; `$transaction` with mutation |
| Log injection | Tampering | Médio | Structured logging; sanitização |
| Feature flag abuse | Elevation | Médio | Apenas platform_admin; audit de mudanças |

---

## 3. Attack Surface Map

```
INTERNET
    │
    ▼
┌─────────────────────────────────────────────┐
│              CLOUDFLARE WAF                 │
│  Rate Limiting · Bot Protection · DDoS     │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│  WEB   │  │   API    │  │  MOBILE  │
│ Next.js│  │ NestJS   │  │  Expo    │
└───┬────┘  └────┬─────┘  └────┬─────┘
    │            │             │
    └────────────┼─────────────┘
                 │
    ┌────────────┼────────────────────┐
    │            │                    │
    ▼            ▼                    ▼
┌────────┐  ┌──────────┐  ┌──────────────┐
│Postgres│  │  Redis   │  │   FinPay     │
│  17    │  │   8      │  │  (externa)   │
└────────┘  └──────────┘  └──────────────┘
```

**Superfícies de ataque externas:**
1. HTTP/HTTPS (web + API)
2. WebSocket (notificações)
3. Webhooks (FinPay)
4. Push notifications (Expo)
5. WhatsApp API (suporte)

---

## 4. Security Controls Matrix

### Preventive

| Controlo | Implementação | Fase |
|----------|---------------|------|
| Authentication | Better Auth + scrypt OWASP + MFA TOTP | F1 |
| Authorization | RBAC guard + `@Roles()` + `organizationId` | F1 |
| Input validation | Zod schemas (contratos) + sanitização | F0 |
| Rate limiting | `@nestjs/throttler` + Redis (5 req/min auth, 100/min API) | F1 |
| Encryption at rest | PostgreSQL TDE + encrypted volumes | F0 |
| Encryption in transit | TLS 1.3 everywhere; HSTS | F0 |
| Secrets management | dotenvx + `.refine()` rejeita placeholders | F0 |
| CSP headers | helmet + CSP policy | F0 |
| CORS | whitelist de origins | F0 |
| Cookie security | SameSite=Strict, HttpOnly, Secure | F1 |

### Detective

| Controlo | Implementação | Fase |
|----------|---------------|------|
| Audit logging | `AuditEvent` append-only | F2 |
| Webhook verification | HMAC SHA-256 FinPay | F2 |
| Session monitoring | Idle timeout + revogação | F1 |
| Anomaly detection | Rate limit alerts + Sentry | F7 |
| Dependency scanning | CodeQL + dependency-review | F0 |
| Container scanning | Trivy no CI | F0 |

### Responsive

| Controlo | Implementação | Fase |
|----------|---------------|------|
| Incident response | 16-INCIDENT-MANAGEMENT.md | F7 |
| Account lockout | 5 tentativas → lock 15min | F1 |
| Webhook retry | 3x exponencial → dead-letter | F2 |
| Rollback | Tag revert + migrate reversa | F7 |
| Communication | WhatsApp/email para utilizadores afetados | F7 |

---

## 5. Data Classification

| Nível | Descrição | Dados Brócolis | Controlos |
|-------|-----------|----------------|-----------|
| **Restricted** | Dados sensíveis regulamentares | Senhas, MFA secrets, dados de cartão | Never logged, encrypted at rest, access audit |
| **Confidential** | Dados de negócio sensíveis | NIF, documentos de licença, financial data | RBAC strict, audit, encrypted |
| **Internal** | Dados internos da plataforma | Configs, API keys, webhook secrets | Never in client, env vars only |
| **Private** | Dados pessoais (LGPD/PII) | Nome, email, telefone, endereço | Consent, retention policy, right to erasure |
| **Public** | Dados públicos | Produtos, preços, farmácias verificadas | Cacheable, CDN |

---

## 6. Security Gates (por fase)

| Fase | Gate de segurança |
|------|-------------------|
| F0 | .env.example sem secrets; helmet + CORS configurados |
| F1 | Auth E2E verde; RBAC 403 em todas as rotas sem permissão |
| F2 | Webhook HMAC testado; idempotência de pagamento; PCI clean |
| F3 | Stock isolation; settlement append-only |
| F4 | Procurement approval flow; crédito isolado |
| F5 | SecureStore para sessão mobile; biometria |
| F6 | E-prescription validation; compliance audit |
| F7 | OWASP ZAP scan 0 high; rate limiting activo; Sentry + alerting |

---

## 7. Secrets Management

### Regras

| Regra | Implementação |
|-------|---------------|
| Nunca em git | `.gitignore` + pre-commit hook (gitleaks) |
| Nunca no cliente | Server-side only; `NEXT_PUBLIC_` prefix para públicos |
| Rotação 90 dias | Renovate + script de rotação automática |
| Nunca hardcoded | dotenvx + `.refine()` rejeita placeholders |
| Access audit | Logs de acesso a secrets (quem, quando, onde) |
| Backup encriptado | Secrets backup em vault; never plain text |

### Tools

| Ferramenta | Uso |
|------------|-----|
| dotenvx | Encryption de .env files |
| gitleaks | Pre-commit secret scanning |
| GitHub secret scanning | Push protection |
| AWS Secrets Manager / Vault | Production secrets |

---

## 8. Compliance Security Mapping

| Regulatório | Controlo Brócolis |
|-------------|-------------------|
| LGPD | Consentimento, retenção, redacção PII, right to erasure |
| PCI-DSS | Delegado à FinPay; zero dados de cartão no Brócolis |
| AGT/SAF-T | AuditEvent append-only; exportabilidade fiscal |
| OWASP Top 10 | Mapeado neste threat model; mitigado por fase |
| WCAG 2.2 AA | Acessibilidade como segurança de utilização |

---

## 9. Anti-patterns de Segurança

| Anti-pattern | Correto |
|--------------|---------|
| `service_role` no cliente | Signed URLs; server-side only |
| Secrets em git/env sem encriptação | dotenvx + gitleaks |
| Rate limit só no auth | Rate limit em todas as rotas públicas |
| Audit trail com UPDATE | Append-only; `$transaction` com mutation |
| Webhook sem HMAC | Sempre verificar; rejeitar se inválido |
| Health endpoint com detalhes | Sanitizado; só status |
| CORS `*` | Whitelist explícita |
| Cookies sem SameSite | SameSite=Strict obrigatório |
| `any` em middleware de auth | Tipos derivados de Zod |
| Logs com PII | Redacção de email, telefone, endereço |

---

*Este documento é actualizado sempre que uma nova superfície de ataque é descoberta ou um incidente ocorre. Threat model é living document, não deliverable único.*
