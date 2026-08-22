# 15 — Data Governance (Classification, Retention, Privacy)

> Aplica-se a **todas as fases**. Define a classificação de dados, política de retenção, conformidade LGPD/GDPR, e mecanismos de privacy-by-design no Brócolis. Dados são o activo mais valioso e o maior risco.

---

## 1. Princípios de Data Governance

| Princípio | Regra |
|-----------|-------|
| Data minimisation | Recolher só o necessário para o propósito |
| Purpose limitation | Dados usados só para o fim declarado no consentimento |
| Storage limitation | Retenção definida por tipo; eliminação automática |
| Accuracy | Dados correctos e actualizados; direito de rectificação |
| Integrity & confidentiality | Encriptação at rest + in transit; access control |
| Accountability | Dono de dados por domínio; auditoria de acesso |

---

## 2. Data Classification Scheme

### 2.1 Níveis de classificação

| Nível | Cor | Descrição | Dados Brócolis | Controlos |
|-------|-----|-----------|----------------|-----------|
| **Restricted** | Vermelho | Dados sensíveis regulamentares | Senhas, MFA secrets, tokens de sessão, dados de cartão | Never logged, encrypted AES-256, access audit, MFA para acesso |
| **Confidential** | Laranja | Dados de negócio sensíveis | NIF, documentos de licença, dados financeiros, settlements | RBAC strict, audit log, encrypted at rest, signed URLs |
| **Internal** | Amarelo | Dados internos da plataforma | Configs, API keys, webhook secrets, feature flags | Never in client, env vars, access logged |
| **Private** | Azul | Dados pessoais (PII/LGPD) | Nome, email, telefone, endereço, histórico de compras, receitas | Consentimento, retenção por tier, right to erasure, redacção |
| **Public** | Verde | Dados públicos | Produtos, preços, farmácias verificadas, categorias | Cacheable, CDN, sem restrições |

### 2.2 Mapeamento por modelo Prisma

| Modelo | Campos Restricted | Campos Confidential | Campos Private | Campos Public |
|--------|-------------------|---------------------|----------------|---------------|
| User | password, mfaSecret | — | name, email, phone | — |
| Session | token | — | userId, expiresAt | — |
| Pharmacy | — | licenseDocument, taxId | ownerName, ownerEmail | name, rating, address |
| Order | — | paymentIntentId | customerId, deliveryAddress | status, total |
| Payment | — | finpayIntentId, amount | customerId | status |
| Prescription | — | documentUrl | patientName, healthcareProId | status |
| AuditEvent | — | payload (if contains PII) | actorId | action, resourceType |

---

## 3. Data Retention Policy

### 3.1 Retenção por tipo de dado

| Categoria | Tipo de dado | Retenção | Acção após expiração |
|-----------|-------------|----------|---------------------|
| **Autenticação** | Sessões | 30 dias idle timeout | Revogação automática |
| **Autenticação** | MFA backup codes | Até utilização | Eliminação |
| **Fiscal** | Facturas, settlements | 7 anos (legislação angolana) | Arquivo + anonymização |
| **Pedidos** | Order, OrderItem | 5 anos | Anonymização (mantém analytics) |
| **Pagamentos** | Payment, PaymentStatusHistory | 7 anos (fiscal) | Arquivo |
| **Receitas** | Prescription, PrescriptionImage | 5 anos após dispensa | Eliminação segura |
| **Auditoria** | AuditEvent | 10 anos | Arquivo + compressão |
| **Marketing** | Consent records | Enquanto activo + 2 anos após revogação | Eliminação |
| **PII** | Nome, email, telefone | Enquanto conta activa | Eliminação 30 dias após pedido de erasure |
| **Analytics** | Eventos agregados | 2 anos | Anonymização |
| **Logs** | Application logs | 90 dias | Eliminação |
| **Backup** | Database backups | 30 dias (rolling) | Eliminação |

### 3.2 Lifecycle de dados

```
CRIAÇÃO → USO → ARQUIVO → ELIMINAÇÃO
   │        │        │          │
   │        │        │          └─ Eliminação segura (overwrite + verify)
   │        │        └─ Compressão + storage frio (R2/S3 Glacier)
   │        └─ Access control + audit
   └─ Classification tagging
```

---

## 4. LGPD / GDPR Compliance

### 4.1 Bases legais por tratamento

| Tratamento | Base legal | Artigo |
|------------|-----------|--------|
| Registo de conta | Execução de contrato | Art. 6(1)(b) |
| Processamento de pagamento | Execução de contrato | Art. 6(1)(b) |
| Envio de newsletter | Consentimento | Art. 6(1)(a) |
| Auditoria fiscal | Obrigação legal | Art. 6(1)(c) |
| Prevenção de fraude | Legítimo interesse | Art. 6(1)(f) |
| Análise de mercado | Legítimo interesse (anonymizado) | Art. 6(1)(f) |
| Receitas médicas | Consentimento explícito + obrigação legal | Art. 6(1)(a) + Art. 9(2)(a) |

### 4.2 Direitos do titular

| Direito | Implementação | SLA |
|---------|---------------|-----|
| **Acesso** (Art. 15) | Endpoint `GET /api/me/data` — export em JSON/CSV | 30 dias |
| **Rectificação** (Art. 16) | Endpoint `PATCH /api/me` — campos editáveis | Imediato |
| **Eliminação** (Art. 17) | Endpoint `DELETE /api/me` — soft delete + hard delete 30d | 30 dias |
| **Portabilidade** (Art. 20) | Export em formato estruturado (JSON) | 30 dias |
| **Oposição** (Art. 21) | Opt-out de marketing; anonymização de analytics | Imediato |
| **Restrição** (Art. 18) | Marcar conta como restricted; sem tratamento | 72 horas |
| **Consentimento** | Granular; withdrawable; versionado | Imediato |

### 4.3 Consentimento

```ts
// Model Prisma
model ConsentRecord {
  id              String    @id @default(cuid())
  userId          String
  purpose         String    // "marketing", "analytics", "healthcare_data"
  granted         Boolean
  version         String    // "1.0" — versão da política
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime  @default(now())

  @@index([userId, purpose])
  @@map("consent_records")
}
```

**Regras:**
- Consentimento granular por propósito
- Versão da política registada
- Withdrawal tão fácil quanto grant
- Consentimento para dados de saúde: explícito + específico

---

## 5. PII Handling

### 5.1 PII Fields por modelo

| Modelo | PII Fields | Tratamento |
|--------|-----------|------------|
| User | name, email, phone | Redacção em logs; encrypt at rest |
| Order | deliveryAddress, customerName | Signed URLs para acesso; redacção em logs |
| Prescription | patientName, documentImage | Access restrito a pharmacist + compliance |
| Pharmacy | ownerName, ownerPhone, ownerEmail | RBAC strict; redacção em audit |

### 5.2 Redacção de PII em logs

```ts
// patterns de redacção
const PII_PATTERNS = {
  email: /[^@]+@[^@]+\.[^@]+/g,
  phone: /\+?\d{9,15}/g,
  nif: /\d{9,15}/g,
  address: /[^,]+,\s*[^,]+,\s*[^,]+/g,
};

// Logger com redacção automática
const redactPII = (msg: string) => {
  let result = msg;
  for (const pattern of Object.values(PII_PATTERNS)) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
};
```

### 5.3 Signed URLs para documentos

```ts
// Nunca URLs públicas de documentos sensíveis
const signedUrl = await storage.getSignedUrl({
  bucket: 'brocolis-documents',
  key: `prescriptions/${prescriptionId}.pdf`,
  expiresIn: 3600, // 1 hora
  conditions: {
    ip: requestIp, // restrição por IP
  },
});
```

---

## 6. Right to Erasure (RF-130)

### Fluxo

```
Utilizador pede eliminação
    │
    ▼
Verificar obrigações legais (factos: 7 anos, auditoria: 10 anos)
    │
    ├── Dados com obrigação legal → anonymizar (manter; remover PII)
    └── Sem obrigação → eliminar
            │
            ▼
    Soft delete (marca; 30 dias)
            │
            ▼
    Hard delete (eliminação física dos dados)
            │
            ▼
    Registar acção em AuditEvent (sem PII)
            │
            ▼
    Notificar utilizador (email)
```

### Implementação

```ts
// Serviço de erasure
async function eraseUserData(userId: string): Promise<void> {
  return this.prisma.$transaction(async (tx) => {
    // 1. Verificar obrigações legais
    const legalHolds = await tx.legalHold.findMany({ where: { userId } });
    
    // 2. Anonymizar dados com obrigação legal
    for (const hold of legalHolds) {
      await tx.order.updateMany({
        where: { customerId: userId },
        data: { customerId: null, customerName: '[ANONYMISED]' },
      });
    }
    
    // 3. Eliminar dados sem obrigação
    await tx.notification.deleteMany({ where: { userId } });
    await tx.cart.deleteMany({ where: { userId } });
    await tx.session.deleteMany({ where: { userId } });
    
    // 4. Marcar conta para hard delete
    await tx.user.update({
      where: { id: userId },
      data: { 
        status: 'ERASURE_PENDING',
        erasedAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    
    // 5. Audit (sem PII)
    await tx.auditEvent.create({
      data: {
        organizationId: user.organizationId,
        marketCode: user.marketCode,
        actorType: 'system',
        actorId: 'system',
        action: 'USER_ERASURE_REQUESTED',
        resourceType: 'User',
        resourceId: userId,
      },
    });
  });
}
```

---

## 7. Data Protection Impact Assessment (DPIA)

### Quando é obrigatório DPIA

| Critério | Brócolis |
|----------|----------|
| Tratamento de dados de saúde (receitas) | Sim — DPIA obrigatório |
| Processamento em larga escala | Sim — marketplace multi-tenant |
| Decisões automatizadas (preço, fraude) | Potencial — F7 |
| Dados de menores | Potencial — verificar idade no registo |
| Novo mercado (novos tipos de dados) | Sim — DPIA por novo Country Pack |

### Template DPIA

```markdown
# DPIA — [Nome do Tratamento]

## Descrição
- Finalidade: [porquê]
- Dados: [quais]
- Titulares: [quem]
- Base legal: [qual]

## Necessidade
- Proporcionalidade: [justificação]
- Alternativas: [outras opções]

## Riscos
- Risco 1: [descrição] → Impacto: [alto/médio/baixo] → Probabilidade: [alta/média/baixa]
- Risco 2: ...

## Mitigações
- Mitigação 1: [descrição] → Reduz risco para: [baixo]
- Mitigação 2: ...

## Aprovação
- Data Protection Officer: [nome]
- Data: [dd/mm/aaaa]
- Próxima revisão: [dd/mm/aaaa]
```

---

## 8. Data Breach Response

### 72h Response Plan (Art. 33 LGPD)

```
DETECÇÃO
    │
    ├── Classificar severidade ( Restricted/Confidential/Private)
    ├── Contain: bloquear acesso, revogar tokens
    ├── Notificar CISO/lead de segurança
    │
    ▼
AVALIAÇÃO (até 24h)
    │
    ├── Dados afectados: que tipos, quantos titulares
    ├── Risco para titulares: alto/médio/baixo
    ├── Causa raiz: vulnerabilidade/humano/config
    │
    ▼
NOTIFICAÇÃO (até 72h)
    │
    ├── Autoridade nacional de protecção de dados
    ├── Titulares afectados (se risco alto)
    ├── Registar em AuditEvent
    │
    ▼
REMEDIÇÃO
    │
    ├── Fix vulnerabilidade
    ├── Actualizar controlos
    ├── Post-mortem (16-INCIDENT-MANAGEMENT.md)
    └── Actualizar threat model (14-THREAT-MODEL.md)
```

---

## 9. Data Processing Agreements (DPAs)

### Quando é necessário DPA

| Parceiro | Tipo de dado | DPA obrigatório |
|----------|-------------|-----------------|
| FinPay | Payment data | Sim — processador |
| Supabase | Storage (documentos) | Sim — sub-processador |
| Sentry | Error logs (potencialmente PII) | Sim — sub-processador |
| Vercel | Web hosting | Sim — sub-processador |
| Expo | Push notifications (token) | Sim — sub-processador |
| WhatsApp/Meta | Messages (PII) | Sim — sub-processador |

### Cláusulas obrigatórias no DPA

1. Finalidade limitada
2. Non-EU transfer (SCCs se aplicável)
3. Sub-processing restrictions
4. Security measures
5. Breach notification (24h ao Brócolis)
6. Audit rights
7. Data return/deletion on termination

---

## 10. Data Governance por Domínio

| Domínio | Data Owner | Classificação | Retenção | DPIA |
|---------|-----------|---------------|----------|------|
| IAM | platform_admin | Restricted + Private | Conta activa + 30d | Não (standard) |
| Catalog | operations | Public + Internal | Indefinido | Não |
| Orders | platform_admin | Private + Confidential | 5 anos | Sim (healthcare) |
| Payments | finance | Confidential | 7 anos | Sim (financial) |
| Prescriptions | compliance | Confidential + Restricted | 5 anos | Sim (healthcare) |
| Delivery | operations | Private | 2 anos | Não |
| Audit | compliance | Confidential | 10 anos | Não |

---

## 11. Anti-patterns de Data Governance

| Anti-pattern | Correto |
|--------------|---------|
| Logs com email/telefone completos | Redacção automática |
| Retenção indefinida de PII | Retenção por tier; eliminação automática |
| Consentimento genérico ("aceito tudo") | Granular por propósito |
| Right to erasure ignorado | SLA 30 dias; fluxo automatizado |
| Documentos com URLs públicas | Signed URLs com expiração |
| Backup sem encriptação | Encrypted at rest + access audit |
| Dados de saúde sem DPIA | DPIA obrigatório para receitas |
| Sub-processador sem DPA | DPA com todas as integrações |

---

*Este documento é revisado trimestralmente e sempre que houver nova regulamentação, novo mercado ou incidente de dados.*
