# 05 — Requisitos do Utilizador (RBAC · RF · NFR)

> Aplica-se a **todas as fases**. Define o modelo de permissões (RBAC por portal), os requisitos funcionais e não-funcionais por domínio, e o mapa **RF ↔ Experience Module**. As **experiências e jornadas** (fluxos, ecrãs, Order Workspace, IA do Admin) vivem em `03-EXPERIENCE-ARCHITECTURE.md`. Contexto: mercado farmacêutico B2C + B2B + B2B2C, Angola-first.

---

## 1. Modelo de permissões (RBAC por portal)

### 1.1 Permissões (base)

| Permissão | Categoria |
|-----------|-----------|
| `catalog:read` | Catalog |
| `catalog:write` | Catalog |
| `catalog:publish` | Catalog |
| `pharmacy:read` | Pharmacy |
| `pharmacy:verify` | Pharmacy |
| `inventory:read` | Inventory |
| `inventory:update` | Inventory |
| `inventory:batch` | Inventory |
| `orders:read` | Orders |
| `orders:create` | Orders |
| `orders:update` | Orders |
| `orders:fulfill` | Orders |
| `orders:return` | Orders |
| `procurement:read` | Procurement |
| `procurement:create` | Procurement |
| `procurement:approve` | Procurement |
| `prescription:read` | Prescriptions |
| `prescription:validate` | Prescriptions |
| `prescription:dispense` | Prescriptions |
| `payments:read` | Payments |
| `payments:refund` | Payments |
| `settlements:read` | Payments |
| `delivery:read` | Delivery |
| `delivery:manage` | Delivery |
| `members:read` | Members |
| `members:invite` | Members |
| `members:update_role` | Members |
| `tenant:read` | Organization |
| `tenant:update` | Organization |
| `billing:read` | Billing |
| `billing:manage` | Billing |
| `settings:read` | Settings |
| `settings:update` | Settings |
| `analytics:read` | Analytics |
| `audit:read` | Audit |
| `compliance:read` | Compliance |
| `compliance:decide` | Compliance |
| `support:read` | Support |
| `support:manage` | Support |
| `marketplace:manage` | Platform |

### 1.2 Perfis por portal

**Consumer (B2C)** — auto-registo; dados de cliente.

**Pharmacy Portal** — membros da organização farmácia:

| Perfil | Permissões |
|--------|-----------|
| pharmacy_owner | Todas do portal |
| pharmacist | `prescription:read/validate/dispense`, `orders:read/fulfill`, `inventory:update` |
| pharmacy_staff | `orders:read/update`, `inventory:read/update`, `delivery:read` |
| pharmacy_finance | `payments:read`, `settlements:read`, `analytics:read` |
| pharmacy_viewer | Leitura essencial |

**Supplier Portal** — membros da organização fornecedor:

| Perfil | Permissões |
|--------|-----------|
| supplier_admin | Todas do portal |
| supplier_sales | `catalog:write`, `procurement:read`, `orders:read` |
| supplier_logistics | `delivery:manage`, `inventory:update` |
| supplier_finance | `payments:read`, `billing:read` |

**Business Portal (B2B comprador)** — clínica/hospital/empresa:

| Perfil | Permissões |
|--------|-----------|
| business_admin | Todas do portal |
| buyer | `procurement:create/read`, `orders:read` |
| approver | `procurement:approve` |
| business_finance | `payments:read`, `billing:read` |
| inventory_manager | `inventory:read/update` |
| viewer | Leitura essencial |

**Platform (Admin/Operations)**:

| Perfil | Permissões |
|--------|-----------|
| platform_admin | Todas (cross-market, bypass RBAC) |
| operations | `marketplace:manage`, `orders:read/update`, `delivery:manage`, `support:manage` |
| compliance | `compliance:read/decide`, `audit:read`, `pharmacy:verify` |
| finance | `settlements:read`, `payments:read`, `billing:manage` |
| analyst | `analytics:read` + leituras |
| support | `support:read/manage`, `orders:read` |

> A matriz "Experience Module → roles" está em `03-EXPERIENCE-ARCHITECTURE.md §2`.

---

## 2. Requisitos funcionais por domínio (RF)

### 2.1 IAM e Tenants

| ID | Requisito |
|----|-----------|
| RF-01 | Utilizador regista-se com email + password (scrypt OWASP) e verifica email |
| RF-02 | Utilizador activa MFA TOTP (otplib) |
| RF-03 | Consumidor cria conta com telefone +244 E.164 opcional |
| RF-04 | Organização (farmácia/supplier/empresa) cria-se com tipo e documento fiscal |
| RF-05 | Admin convida membros por email (invitation, expiração) |
| RF-06 | Admin atribui roles (matriz por portal) e actualiza roles |
| RF-07 | Sessão server-side com idle timeout 30min e revogação |
| RF-08 | Org-switcher entre tenants do utilizador (cookie SameSite=Strict) |
| RF-09 | `marketCode` derivado do mercado; UI em pt-AO por defeito |

### 2.2 Catalog

| ID | Requisito |
|----|-----------|
| RF-20 | GlobalProduct com DCI, dosagem, forma, fabricante, identificadores globais |
| RF-21 | CountryProduct por mercado (registo local, classificação, regra de receita) |
| RF-22 | MarketOffer por farmácia (preço, stock, disponibilidade) |
| RF-23 | Pesquisa por nome/DCI/EAN com sugestões e histórico |
| RF-24 | Filtros: categoria, preço, stock, receita, farmácia, zona |
| RF-25 | Avisos de interacção medicamentosa no carrinho (dados de catálogo) |

### 2.3 Pharmacy

| ID | Requisito |
|----|-----------|
| RF-30 | Registo de farmácia com documentos (licença, identidade, NIF) |
| RF-31 | Verificação documental com estados VERIFIED/PREMIUM/PENDING/SUSPENDED |
| RF-32 | Horário de funcionamento e estado aberta/fechada |
| RF-33 | Zona de serviço e taxa de entrega por zona |
| RF-34 | Perfil público: rating, distância, nº produtos |

### 2.4 Inventory & Batch

| ID | Requisito |
|----|-----------|
| RF-40 | InventoryItem com stock por lote e validade |
| RF-41 | Movimentos de stock (entrada/saída/ajuste) auditados |
| RF-42 | Alertas LOW_STOCK / CRITICAL / EXPIRING / EXPIRED |
| RF-43 | Venda respeita lote: FIFO por validade |
| RF-44 | Bloqueio de venda de produto expirado |

### 2.5 Pricing

| ID | Requisito |
|----|-----------|
| RF-50 | Preço base + PriceTier por volume (B2B) |
| RF-51 | Preço parceiro vs preço público (B2B2C) com margem estimada |
| RF-52 | Cupões e promoções por mercado |
| RF-53 | Todos os preços em AOA por defeito; formatação única |

### 2.6 Cart & Checkout

| ID | Requisito |
|----|-----------|
| RF-60 | Carrinho multi-farmácia (agrupado por farmácia) |
| RF-61 | Checkout com passos: cliente → entrega → farmácia → receita → pagamento → review → confirmação |
| RF-62 | Receita obrigatória para produtos com `prescriptionRequired` |
| RF-63 | Pagamento via FinPay (intent) ou dinheiro na entrega |
| RF-64 | Idempotência por `IdempotencyKey` em todas as mutations |
| RF-65 | Pedido guardado localmente no mobile em modo offline (syncing) |

### 2.7 Orders & Fulfillment

| ID | Requisito |
|----|-----------|
| RF-70 | Order com items, split por farmácia, estados e histórico append-only |
| RF-71 | Farmacêutico confirma/dispensa; pedido vai para preparação |
| RF-72 | Entrega atribuída a driver; tracking em tempo real |
| RF-73 | Devoluções e reembolsos via FinPay (refund) |
| RF-74 | Cancelamento com regras por estado |

### 2.8 Procurement (B2B)

| ID | Requisito |
|----|-----------|
| RF-80 | Catálogo B2B com SKU/EAN, lote, validade, stock, MOQ, lead time |
| RF-81 | RFQ → Quotation → SupplierOffer → QuoteComparison |
| RF-82 | PurchaseOrder com approval flow por valor |
| RF-83 | Crédito por organização com limite e utilização |
| RF-84 | Faturação B2B (invoices) e export AGT/SAF-T |
| RF-85 | PO aprovada alimenta stock do comprador (B2B2C) |

### 2.9 Prescriptions

| ID | Requisito |
|----|-----------|
| RF-90 | Upload de receita (foto/gallery) com estados PENDING/UPLOADED/UNDER_REVIEW/APPROVED/REJECTED/EXPIRED/CANCELLED |
| RF-91 | Farmacêutico valida receita antes da dispensa |
| RF-92 | Regras de medicamentos controlados (quantidade, repetição) por mercado |
| RF-93 | Histórico de receitas do cliente |

### 2.10 Payments & Settlement (FinPay)

| ID | Requisito |
|----|-----------|
| RF-100 | Checkout cria PaymentIntent na FinPay (controlAmount AOA) |
| RF-101 | Estados de pagamento: PENDING/PROCESSING/CONFIRMED/EXPIRED/DECLINED/REFUNDED |
| RF-102 | Webhook FinPay (HMAC) actualiza pedido; retry + dead-letter |
| RF-103 | Refund de pedidos devolvidos via FinPay |
| RF-104 | Settlement semanal à farmácia com reserva 7 dias e comissão |

### 2.11 Delivery

| ID | Requisito |
|----|-----------|
| RF-110 | Zonas de entrega, taxas e estimativas por mercado |
| RF-111 | Entrega com estados AVAILABLE→…→DELIVERED e prova (foto+assinatura) |
| RF-112 | Driver vê rotas e até 2 entregas concorrentes |
| RF-113 | Ponto de referência como campo operacional do endereço |

### 2.12 Notificações e WhatsApp

| ID | Requisito |
|----|-----------|
| RF-120 | Notificações in-app (WebSocket) para status de pedido/receita/pagamento |
| RF-121 | Push (expo-notifications) no mobile |
| RF-122 | WhatsApp: suporte de pedido, entrega e receita |
| RF-123 | Email transaccional (verificação, reset, facturas, convites) |

---

## 3. Requisitos não-funcionais (NFR)

| Categoria | Requisito |
|-----------|-----------|
| **Performance** | P95 API < 300ms; LCP < 2.5s; Lighthouse ≥ 90; mobile smooth em low-end |
| **Disponibilidade** | ≥ 99.5% em produção; health checks DB/Redis/FinPay/Queue |
| **Conectividade** | Offline-first no mobile: cache de catálogo, pedido local, sync |
| **Segurança** | OWASP Top 10; PCI-DSS delegado à FinPay; LGPD; nunca secrets no cliente |
| **A11y** | WCAG 2.2 AA |
| **Dados** | Backup postgres; PII redaction; retenção por tier |
| **Testes** | Cobertura ≥80%; unit + integração + E2E por fase |
| **Conformidade** | AGT/SAF-T export; auditoria de pedidos e pagamentos |
| **i18n** | pt-AO obrigatório; estrutura pronta para pt-MZ, en-KE, fr-SN, ar-EG (RTL) |

---

## 4. Mapa RF ↔ Experience Module

| Domínio | RFs | Experience Module (03) |
|---------|-----|------------------------|
| IAM/Tenants | RF-01..09 | 03 §2 Roles/Permissions, 03 §6 Onboarding |
| Catalog | RF-20..25 | 03 §3 B2C, 03 §10 Customer |
| Pharmacy | RF-30..34 | 03 §6 Pharmacy Onboarding |
| Inventory | RF-40..44 | 03 §12 Inventory |
| Pricing | RF-50..53 | 03 §4 B2B |
| Cart/Checkout | RF-60..65 | 03 §3 B2C, 03 §14 Payment |
| Orders | RF-70..74 | 03 §13 Order Management |
| Procurement | RF-80..85 | 03 §4 B2B, 03 §9 Supplier |
| Prescriptions | RF-90..93 | 03 §11 Prescription |
| Payments | RF-100..104 | 03 §14 Payment + 07 |
| Delivery | RF-110..113 | 03 §15 Delivery |
| Notificações | RF-120..123 | 03 §21 Notifications |

> Fonte única de fluxos/ecrãs: `03-EXPERIENCE-ARCHITECTURE.md`. As jornadas E2E obrigatórias por fase estão em `06-TESTES.md §...` e `09-ROADMAP-FASES.md`.
