# 03 — Product Experience Architecture

> Aplica-se à **Fase F-EX (obrigatória antes de qualquer UI de produto)** e a todas as fases seguintes. Define **como cada ator entra, configura, opera e gere a plataforma** — um sistema de experiências por cima do Design System (`04-DESIGN-SYSTEM.md`). Cada **Experience Module** é um **Lego** implementável, auditável e testável: tem contrato, RBAC, pontos de injecção de país, testes e gate. O Core e as regras de país permanecem estáveis; só os módulos evoluem.

---

## 0. Modelo de 4 camadas

O `04-DESIGN-SYSTEM.md` implementa o visual. O `02-ARQUITETURA-CONTRATOS.md` define domínios e contratos. **Este documento define a experiência** que liga os dois.

```
GLOBAL PLATFORM
      │
      ▼
EXPERIENCE SYSTEM         ← este documento (03)
B2C · B2B · B2B2C
      │
      ▼
DOMAIN SYSTEM             ← 02 (bounded contexts)
Pharmacy · Prescription · Inventory · Payment · Delivery · Procurement
      │
      ▼
COUNTRY SYSTEM            ← 02/04 (Markets · Country Packs)
AO · MZ · KE · NG · …
```

```
DESIGN SYSTEM        Button · Input · Table · Dialog · Card        (04)
      ↓
EXPERIENCE SYSTEM    Onboarding · Checkout · Order Mgmt · Search · Dashboard · Approval   (03)
      ↓
DOMAIN SYSTEM        Pharmacy · Prescription · Inventory · Payment · Delivery · Procurement  (02)
      ↓
COUNTRY SYSTEM       Tax · Currency · Payment · Address · Regulation · Documents · Localization  (02/04)
```

**Regra de ouro:** o 04-DESIGN-SYSTEM.md passa a **implementar** esta arquitetura de experiência. A equipa/agentes **nunca inventam telas**: todo ecrã deriva de um Experience Module deste documento.

### Ecossistema (actores)

```
                    PLATFORM
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     CONSUMER       BUSINESS       OPERATIONS
        │              │              │
        │          ┌───┴────┐         │
        │          │        │         │
        │       PHARMACY  SUPPLIER   ADMIN
        │          │        │         │
        └──────────┴────────┴─────────┘
                       │
                 COUNTRY / MARKET
                       │
          ┌────────────┼────────────┐
          │            │            │
       ANGOLA      MOZAMBIQUE    NIGERIA
```

---

## 1. Actors & Personas

| Ator | Portal | Objectivo | Frequência |
|------|--------|-----------|------------|
| Consumidor | Consumer App (mobile/web) | Comprar medicamentos com confiança e receber em casa | Diária |
| Farmacêutico | Pharmacy Portal | Dispensar, gerir pedidos e stock | Diária |
| Dono de farmácia | Pharmacy Portal | Gerir farmácia, finanças, equipa | Diária |
| Comprador B2B (clínica/hospital/empresa) | Business Portal | Procurement de alto volume com aprovação | Semanal |
| Fornecedor | Supplier Portal | Catálogo, preços, cotações, logística | Diária |
| Admin / Ops | Admin Console | Gerir marketplace, compliance, suporte | Diária |
| Compliance / Finance | Admin Console | Verificação, auditoria, settlements | Semanal |

Cada persona tem **persona sheet**: contexto, frustrações, jornada de entrada, KPIs. A F-EX cria uma persona sheet por ator em `docs/experience/personas/`.

---

## 2. Roles & Permissions

Matriz RBAC completa vive em `05-REQUISITOS-JORNADAS.md §1`. Aqui define-se o **princípio por experiência**:

- Cada Experience Module declara as **roles** que podem executá-lo.
- Nenhuma UI mostra acção sem permissão; navegação é config-driven com `roles`.
- Permissões são **por portal** (Consumer/Pharmacy/Supplier/Business/Platform) e **por experiência**.

| Experience Module | Roles mínimas |
|-------------------|---------------|
| Onboarding Pharmacy | `pharmacy_owner` (self-service) |
| Order Management | `pharmacy_owner`, `pharmacist`, `pharmacy_staff` |
| Prescription Review | `pharmacist` |
| Procurement | `buyer`, `approver`, `supplier_admin` |
| Country Management | `platform_admin`, `operations` |
| Verification | `compliance`, `platform_admin` |

---

## 3. B2C Experience

Jornada de alto nível do consumidor:

```
Descobrir → Avaliar → Adquirir → Receber → Acompanhar
```

Passos: `Home → Pesquisa → Produto+Stock+Farmácia → Carrinho → Receita → Checkout → Pagamento → Tracking`.

Pontos de injecção de país: método de pagamento, moeda, formato de endereço, taxas de entrega, regra de receita, canal de suporte (WhatsApp).

Componentes: `ProductCard`, `PharmacyCard`, `PrescriptionUpload`, `PaymentMethod`, `OrderTimeline`, `DeliveryTracking`.

Ver journey detalhado em §3 acima; journey-patterns em `04-DESIGN-SYSTEM.md` e RFs em `05-REQUISITOS-JORNADAS.md`.

---

## 4. B2B Experience

Dois portais: **Supplier** (vender) e **Business** (comprar).

```
Business: Catálogo B2B → RFQ → Cotações → Comparar → PO → Aprovação → Pagamento/Fatura
Supplier: Catálogo → Cotação → PO recebida → Preparar envio → Logística
```

Componentes: `B2B Catalog`, `VolumePricing`, `QuoteComparison`, `PurchaseOrder`, `ApprovalFlow`, `Invoices`, `Logistics`.

Regras: MOQ, lead time, PriceTier por volume, crédito por organização.

---

## 5. B2B2C Experience

Network de três pontas com responsabilidade visível por etapa:

```
Cliente → Farmácia → Fornecedor → Entrega
```

- Pedido do consumidor pode puxar stock do fornecedor.
- Cada etapa mostra dono, estado e SLA.
- Farmácia é a face; fornecedor é invisível ao cliente.

Componentes: `NetworkTimeline`, `ResponsibleParty`, `StockSource`.

---

## 6. Pharmacy Onboarding

**Foco principal da F-EX.** Nada de formulário gigante de 40 campos: **Onboarding Wizard orientado por etapas**, com progresso visível.

```
CADASTRO DA FARMÁCIA
01 Conta | 02 Empresa | 03 Farmácia | 04 Responsável | 05 Documentação
06 Localização | 07 Operação | 08 Pagamentos | 09 Revisão | 10 Aprovação
```

### Etapa 01 — Conta

```
Etapa 5 de 10
██████████░░░░░░░░

Nome
[________________________]

Email
[________________________]

Telefone
[ +244 | 9XX XXX XXX ]

Password
[________________________]

[ Continuar ]
```

Métodos de entrada são **configuráveis por mercado** (Google/Apple/telefone): global, mas país decide.

### Etapa 02 — Empresa

```
Nome legal
Nome comercial
NIF
Tipo de organização
○ Farmácia   ○ Grupo de farmácias   ○ Distribuidor
○ Clínica    ○ Hospital             ○ Outro
```

O NIF **não é hardcoded como conceito angolano**. Internamente é `TaxIdentifier`; Angola configura `NIF`, outro país configura o seu identificador fiscal.

### Etapa 03 — Farmácia

```
Nome da farmácia
Tipo: ○ Comunitária   ○ Hospitalar   ○ Outra
Telefone [ +244 __________ ]
Email
Horário de funcionamento (Seg–Dom, por faixa)
```

### Etapa 04 — Responsável técnico

```
Nome completo
Função
Número profissional
Documento profissional  [ Upload ]
Documento de identificação [ Upload ]
```

Modelo é `ProfessionalCredential` (genérico), **não** `AngolaPharmacistLicense`. A validação por país injeta a credencial correcta.

### Etapa 05 — Documentação

Checklist, não "upload 1..5":

```
DOCUMENTOS NECESSÁRIOS
✓ Documento de constituição
✓ Identificação do responsável
○ Licença da farmácia
○ Documento fiscal
○ Certificação profissional

[ Adicionar documento ]

┌─────────────────────────────────┐
│ ✓ Licença da Farmácia           │
│   licenca-farmacia.pdf 2.4 MB   │
│   Verificado ✓                  │
└─────────────────────────────────┘
```

### Etapa 06 — Localização (Angola-first)

```
Província  [ Luanda ▼ ]
Município  [ Belas ▼ ]
Distrito   [ ________ ]
Bairro     [ ________ ]
Rua        [ ________ ]
Número     [ ________ ]
Ponto de referência [ ________ ]

[ Mapa ] → [ Confirmar localização ]
```

`latitude`/`longitude` registadas internamente; `ponto de referência` é campo operacional.

### Etapa 07 — Operação

```
A farmácia realiza:
☑ Venda presencial   ☑ Venda online
☑ Levantamento       ☑ Entrega
☐ Atendimento 24h

Área de entrega
Raio [ 10 km ] · Tempo médio [ 30–60 min ] · Taxa base [ 1.500 Kz ]
```

### Etapa 08 — Pagamentos (Country Pack)

```
COMO A FARMÁCIA RECEBE?
☑ Transferência bancária   ☑ Multicaixa   ☑ TPA
```

País pode configurar mais tarde: Mobile Money, carteiras, cards.

### Etapa 09 — Revisão

```
REVISAR CADASTRO
Farmácia ✓ Empresa ✓ Responsável ✓ Documentos ✓
Localização ✓ Operação ✓ Pagamentos ✓
[ Enviar para aprovação ]
```

### Etapa 10 — Aprovação

```
Cadastro enviado ✓
A sua farmácia está em análise.
Tempo estimado: 1–3 dias úteis.
Você será notificado quando a análise terminar.
[ Ver cadastro ] [ Falar com suporte ]
```

**Nunca** jogar o usuário no dashboard sem aprovação. Estados: `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → REJECTED → SUSPENDED`.

---

## 7. Pharmacy Management

Depois da aprovação, o Pharmacy Portal com 9 domínios:

```
Pharmacy Portal
├── Overview
├── Orders
├── Catalog
├── Inventory
├── Prescriptions
├── Customers
├── Delivery
├── Finance
└── Settings
```

Dashboard: KPIs (`Pedidos 128 · Vendas 2.4M · Stock 92%`) + pedidos recentes. IA detalhada na §7; journey-patterns em `04-DESIGN-SYSTEM.md`.

---

## 8. Supplier Onboarding

Wizard simplificado (5 passos): `Conta → Empresa → Documentos → Localização → Operação`. Reusa passos 01–02 e 05–06 do Pharmacy; injecção de país nos documentos fiscais.

---

## 9. Supplier Management

```
Supplier Portal
├── Overview
├── Catalog
├── Pricing
├── Quotations
├── Purchase Orders
├── Logistics
└── Settings
```

Fluxo central: responder RFQ → cotação → PO recebida → preparar envio.

---

## 10. Customer Experience

- Perfil, histórico de pedidos e receitas.
- Notificações (in-app, push, WhatsApp, email).
- Estados vazios com próximo passo acção (não "nada aqui").

---

## 11. Prescription Experience

```
Prescription Center
Pendentes 12 · Aprovadas 284 · Rejeitadas 8 · Expiradas 3
```

```
┌─ Receita #RX-29382 ────────────────┐
│ Paciente: João Manuel              │
│ Receita: [ visualizar documento ]  │
│ Medicamentos: Amoxicilina 500mg    │
│ [ Aprovar ]      [ Rejeitar ]      │
└────────────────────────────────────┘
```

Estados: `PENDING/UPLOADED/UNDER_REVIEW/APPROVED/REJECTED/EXPIRED/CANCELLED`. Regras de medicamentos controlados por país.

---

## 12. Inventory Experience

O stock em farmácia é **por lote e validade**, não só quantidade:

```
Total 2.430 · Stock baixo 84 · Sem stock 31 · Expirando 9

Produto | Lote | Validade | Quantidade | Reservado | Disponível
```

Alertas: `LOW_STOCK / CRITICAL / EXPIRING / EXPIRED`; FIFO por validade; bloqueio de expirado.

---

## 13. Order Management

Não basta uma tabela:

```
Pedidos
├── Todos  ├── Novos  ├── Confirmados  ├── Em preparação
├── Prontos ├── Em entrega ├── Entregues  └── Cancelados
```

Cada pedido abre um **Order Workspace**:

```
Pedido #ANG-29382
Cliente: João Manuel
Pagamento ✓ Confirmado   Receita ✓ Validada
Produtos: 3 itens   Entrega: Em preparação
```

### Edição em tela (princípio)

| Complexidade | Padrão |
|--------------|--------|
| Operações frequentes | **Inline editing** (ex.: preço `2 500 Kz ✎`) |
| Objetos médios | **Side panel** |
| Onboarding/produto complexo/config/regras/integrações | **Full-page editor** |

```
Inline: [ 2 500 Kz ] ✓
Side:   Produtos | Editar produto (painel lateral)
Full:   página dedicada com secções
```

---

## 14. Payment Experience

- Cliente: escolha do método (país), estado visível, comprovativo.
- Farmácia: receber pagamento, ver settlements, reconciliar.
- Processadora: FinPay (adapter + webhook). Ver `07-FINPAY-INTEGRATION.md`.

Estados: `PENDING / PROCESSING / CONFIRMED / EXPIRED / DECLINED / REFUNDED`.

---

## 15. Delivery Experience

- Zonas, taxas, estimativas por mercado.
- Tracking em tempo real + prova (foto+assinatura).
- Driver: rotas, até 2 entregas concorrentes.
- Angola: `ponto de referência` no endereço.

---

## 16. Admin Experience

```
ADMIN
├── Overview
├── Marketplace
├── Organizations
├── Pharmacies
├── Suppliers
├── Products
├── Orders
├── Prescriptions
├── Payments
├── Logistics
├── Compliance
├── Support
├── Countries
└── Settings
```

Regras: navegação config-driven com `roles`; cada linha de tabela navega para a **ficha**.

---

## 17. Country Management

### Markets (listagem)

```
Markets
🇦🇴 Angola      Active
🇲🇿 Mozambique  Coming soon
🇳🇬 Nigeria     Coming soon
🇰🇪 Kenya       Coming soon
```

### Angola (detalhe)

```
ANGOLA
Status ● Active
Currency AOA
Languages pt-AO
Payment methods ✓ Multicaixa ✓ TPA ✓ Transferência
Address model ✓ Province/Municipality/District/Neighborhood/Landmark
Regulatory profile Angola Pharmacy Rules
```

### Country Setup (criar mercado)

```
Create Market
Country [ Kenya ]
Currency [ KES ]
Languages ☑ English ☑ Swahili
Timezone [ Africa/Nairobi ]
Payment methods [ Configure ]
Address [ Configure ]
Regulatory framework [ Configure ]
Pharmacy onboarding [ Configure ]
Delivery [ Configure ]
[ Activate Market ]
```

**O Admin não exige código novo por país** — tudo configurado a partir do Country Pack.

---

## 18. Country-specific Onboarding

O fluxo global mantém-se; o país **injeta** as suas necessidades:

```
GLOBAL ONBOARDING
        │
        ├── Common steps
        └── Country-specific steps
                  │
             ┌────┴────┐
             │         │
            AO        KE
             │         │
          NIF       Tax ID
          License   License
          Rules     Rules
```

**80% do fluxo é partilhado; 20% é configurável por país.**

---

## 19. Localization

- `pt-AO` primeiro; estrutura pronta para `pt-MZ`, `en-KE`, `fr-SN`, `ar-EG` (RTL).
- Moeda, data, telefone, endereço via `@brocolis/formatters`.
- Texto via `t()` (`@brocolis/i18n`), nunca hardcoded.
- Formatação de moeda por mercado; RTL-ready.

---

## 20. Regulatory Experience

- Regras por mercado: medicamentos controlados, licenças, receitas, SAF-T/AGT.
- Decisões de compliance registadas em `AuditEvent`.
- Fichas de verificação: `VERIFIED / PENDING / SUSPENDED`.

---

## 21. Notification Experience

| Canal | Uso |
|-------|-----|
| In-app (WebSocket) | status pedido/receita/pagamento |
| Push (expo-notifications) | mobile |
| WhatsApp | suporte, entrega, receita |
| Email | verificação, reset, facturas, convites |

Preferências por canal e frequência; mensagens transaccionais obrigatórias.

---

## 22. Support Experience

- Help center + WhatsApp como canal de suporte (Angola).
- Tickets e disputas no Admin (Support).
- SLA por mercado.

---

## 23. Empty / Loading / Error States

| Estado | Padrão |
|--------|--------|
| Empty | ilustração + título + **próximo passo com acção** |
| Loading | skeleton (nunca spinner em massa) |
| Error | mensagem clara + retry + suporte |
| Offline | banner + cache + sync quando voltar |

Componentes: `EmptyState`, `Skeleton`, `ErrorState`, `OfflineBanner` (journey-patterns).

---

## 24. Responsive Experience

- Web: grid responsivo, breakpoints padrão.
- Mobile: touch-first, ≥44×44px, densidade adaptada (healthcare 48dp).
- Tablet: entre-páginas para Pharmacy/Admin.
- Baixa largura de banda: imagens otimizadas, cache, offline-first no mobile.

---

## 25. Accessibility (WCAG 2.2 AA)

Spec completo em `04-DESIGN-SYSTEM.md §25`. Aqui: cada Experience Module tem checklist a11y (keyboard, focus, contraste, screen reader, touch targets).

---

## 26. Experience Governance

Cada Experience Module é um **Lego**:

```yaml
ExperienceModule:
  id: EXP-<NN>-<slug>          # ex.: EXP-06-pharmacy-onboarding
  actors: [pharmacy_owner]
  portal: pharmacy
  phases: [F-EX, F3]           # definida no roadmap (09)
  steps: [conta, empresa, farmácia, responsável, documentos, localização, operação, pagamentos, revisão, aprovação]
  screens: [onboarding-wizard, progress-bar, upload-card, ...]
  states: [DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SUSPENDED]
  rbac: [pharmacy:write, pharmacy:verify]
  rf_refs: [RF-30, RF-31]
  country_injection:
    tax_identifier: "AO→NIF"
    professional_credential: "AO→AngolaPharmacistLicense"
    documents: "por país"
    payment_methods: "por país"
  acceptance: [wizard completa em ≤10 min, ...]
  tests: [unit, integration, e2e]
  gate: "Pharmacy Onboarding E2E verde"
```

Regras de governança:
- **Fase F-EX**: documento 03 completo + contratos dos módulos em `@brocolis/contracts` + RBAC mapeado.
- Nenhuma UI de produto antes de F-EX (gate obrigatório).
- Cada módulo novo = ADR + Lego registry entry + evidência em `state/evidence.json` (ver `11-PIPELINE-AUTONOMO.md`).
- Módulos registados no pipeline como unidades auditáveis; Core e regras de país permanecem estáveis.

---

## 27. Mapa Experience Module → ficheiros/fases

| Module | Doc | Fase |
|--------|-----|------|
| Actors/Personas | 03 §1 | F-EX |
| Roles/Permissions | 03 §2 + 05 §1 | F1 |
| B2C | 03 §3 | F2 |
| B2B | 03 §4 | F4 |
| B2B2C | 03 §5 | F6 |
| Pharmacy Onboarding | 03 §6 | F3 |
| Pharmacy Management | 03 §7 | F3 |
| Supplier Onboarding | 03 §8 | F4 |
| Supplier Management | 03 §9 | F4 |
| Customer | 03 §10 | F2 |
| Prescription | 03 §11 | F3/F6 |
| Inventory | 03 §12 | F3 |
| Order Management | 03 §13 | F2/F3 |
| Payment | 03 §14 + 07 | F2 |
| Delivery | 03 §15 | F2 |
| Admin | 03 §16 | F3 |
| Country Management | 03 §17 | F6/F7 |
| Country-specific Onboarding | 03 §18 | F-EX/F6 |
| Localization | 03 §19 | F-DS/F-EX |
| Regulatory | 03 §20 | F6 |
| Notifications | 03 §21 | F2/F5 |
| Support | 03 §22 | F3 |
| States | 03 §23 | F-DS |
| Responsive | 03 §24 | F-DS |
| A11y | 03 §25 + 04 §25 | F-DS |
| Governance | 03 §26 | F-EX |
| Insurance (Seguros) | 13 §5 | **post-mvp (v2.x)** |
| Cashback / Loyalty | 13 §5 | **post-mvp (v2.x)** |

> **MVP-first:** os módulos `Insurance` e `Cashback/Loyalty` existem como **backlog pós-MVP** (v2.x) e **não entram nos contratos, schema, RBAC nem UI do MVP v1**. Fases do MVP v1: F0 → F-EX → F-DS → F1 → F2 → F3 (`09-ROADMAP-FASES.md` §Milestones).

---

## 28. Anti-patterns de experiência

| Anti-pattern | Correto |
|--------------|---------|
| Formulário gigante de 40 campos | Wizard por etapas (03 §6) |
| `NIF` hardcoded | `TaxIdentifier` configurável por país |
| `AngolaPharmacistLicense` hardcoded | `ProfessionalCredential` genérico |
| `if (country === "AO")` em UI | Country Pack injeta (03 §18) |
| Ecrã improvisado | Experience Module oficial (03) |
| Tabela para tudo | Order Workspace + edição inline/panel/full (03 §13) |
| Jogar usuário no dashboard sem aprovação | Etapa de aprovação + estado UNDER_REVIEW (03 §6) |
| "Upload 1..5" | Checklist de documentos com verificação (03 §6) |
| Novo país = novo código | Create Market config-driven (03 §17) |
| Design System sem experiência | F-EX define experiência antes do F-DS (09) |
