# B2B2C Network + Receitas digitais + Compliance (Fase 6)

Documentação de módulo do backend — bounded contexts **Prescription Digital**
(`prescription-digital`), **Regulatory & Compliance** (`compliance`) e
**Network Visibility** (componentes `apps/web/components/network`). Ver também
`ADR-0014-b2b2c-compliance-f6.md`, `blueprint/03-EXPERIENCE-ARCHITECTURE.md`
(§5, §11, §20) e `docs/pharmacy/` (F3).

## Bounded contexts

| Contexto | Responsabilidade | Fronteira |
|----------|------------------|-----------|
| Prescription Digital | Profissionais de saúde verificados emitem e-prescriptions assinadas; farmácia valida e dispensa | Não conhece Order/Payment; consome policy via Compliance |
| Regulatory & Compliance | Policies por mercado, decisões auditadas, exports SAF-T/AGT, explorer de auditoria | Única fonte de verdade regulatória; nenhum outro módulo hardcode regras de país |
| Network Visibility | Timeline B2B2C com dono/estado/SLA por etapa | Só apresentação; estado vem dos eventos do pedido |

## Fluxo B2B2C (03 §5)

```
Cliente → Farmácia → Fornecedor → Entrega
```

- O pedido do consumidor pode puxar stock do fornecedor (`SUPPLIER_PULL`).
- Cada etapa mostra **dono**, **estado** e **SLA** (`NetworkTimeline`).
- A **farmácia é a face**; o fornecedor é invisível ao cliente
  (`showSupplier=false` esconde a etapa e mostra "Gerido pela sua farmácia").
- Origem do stock explícita para operadores: `StockSourceBadge`
  (`PHARMACY_STOCK | SUPPLIER_PULL`).

## Contratos (`@brocolis/contracts`)

| Ficheiro | Conteúdo |
|----------|----------|
| `src/prescription-digital.ts` | `professionalCredentialSchema` (genérica — nunca licenças hardcoded), `healthcareProfessionalSchema` (VERIFIED/PENDING/SUSPENDED), `ePrescriptionSchema` (ACTIVE/DISPENSED/EXPIRED/REVOKED/REJECTED, `daysValid`, `signatureHash`, `sourceMarketCode`), inputs `issue/validate/revoke/renew`, helpers `ePrescriptionExpiry`, `isEPrescriptionExpired`, `controlledSubstancesIn` |
| `src/compliance.ts` | `regulatoryPolicySchema` (controlledSubstances, prescriptionRequiredCategories, maxPrescriptionDaysValid, licenseRequirements, saftEnabled, agtEndpoint?), `policyForMarket` com fallback seguro, `complianceDecisionSchema` (APPROVED/REJECTED/ESCALATED sobre SUBJECT enum), `requestSaftExportInputSchema` + `saftExportJobSchema` (QUEUED/RUNNING/COMPLETED/FAILED), `auditExplorerQuerySchema` |

Regras: `organizationId` + `marketCode` obrigatórios em todo input scoped;
substâncias controladas vêm sempre da **policy do mercado** — zero
`if (country === "AO")`.

## API (`apps/api`)

```
src/prescription-digital/
  POST /prescription-digital/professionals                        regista profissional (PENDING)
  POST /prescription-digital/professionals/:id/verification       VERIFIED | SUSPENDED
  POST /prescription-digital                                      emite e-prescription (profissional VERIFIED)
  POST /prescription-digital/:id/validate                         valida na farmácia (estado + expiração + controladas)
  POST /prescription-digital/:id/dispense                         marca DISPENSED (header x-pharmacist-id)
  POST /prescription-digital/:id/revoke                           REVOKED com motivo
  POST /prescription-digital/:id/renew                            renova dias dentro do máximo regulatório

src/compliance/
  PUT  /compliance/policies/:marketCode      upsert policy (platform_admin)
  GET  /compliance/policies[/:marketCode]    lista/detalhe (fallback seguro)
  POST /compliance/decisions                 decisão APPROVED/REJECTED/ESCALATED (AuditEvent sempre)
  GET  /compliance/decisions                 decisões filtradas por subject/período
  POST /compliance/saft-exports              pede export SAF-T → job QUEUED (estrutura mock)
  GET  /compliance/saft-exports[/:jobId]     jobs por escopo
  GET  /compliance/audit                     explorer do AuditEvent (org/market/subject/período/ação)
```

Regras de negócio:

1. **Emissão** exige profissional `VERIFIED` no mesmo tenant+mercado e
   `daysValid ≤ maxPrescriptionDaysValid` da policy do mercado.
2. **Validação na farmácia** devolve `{ valid, reasons[], controlledSubstances[] }`;
   substâncias controladas sinalizam-se por cruzamento
   `item.activeSubstance × policy.controlledSubstances`.
3. **Dispensa** só de receitas `ACTIVE` não expiradas; marca `DISPENSED`.
4. **Audit trail**: toda a mutação crítica emite `AuditEvent` (best-effort DB +
   log em memória) — emitir, dispensar, revogar, renovar, verificar
   profissional, upsert de policy, decisão de compliance, pedido SAF-T.

## Web (`apps/web`)

```
components/network/network-timeline.tsx        timeline vertical (dono + estado + SLA por etapa)
components/network/responsible-party-badge.tsx PHARMACY | SUPPLIER | PLATFORM
components/network/stock-source-badge.tsx      PHARMACY_STOCK | SUPPLIER_PULL
lib/network-timeline.ts (+testes)              buildNetworkStages, detectSlaBreach, supplierVisible, stockSourceFor
lib/network-fixtures.ts                        encomenda B2B2C demo completa
lib/network-i18n.ts (+testes)                  chaves network.* nos 6 locales (shim até subpath f6-messages)
```

## Schema (`@brocolis/db/prisma/schema.prisma`) — a aplicar

Modelos F6 reportados no relatório da fase: `HealthcareProfessional`,
`EPrescription`, `EPrescriptionItem`, `RegulatoryPolicy`,
`ComplianceDecision`, `SaftExportJob` + enums
(`HealthcareProfessionalStatus`, `EPrescriptionStatus`,
`ComplianceSubjectType`, `ComplianceDecisionOutcome`, `SaftExportType`,
`SaftExportStatus`). Índices `(organizationId, marketCode, …)` em todos os
modelos scoped.

## Gate de saída

B2B2C E2E verde (network timeline): pedido do consumidor visível com dono,
estado e SLA por etapa; fornecedor invisível ao cliente; receita digital
emitida por profissional verificado, validada e dispensada na farmácia;
decisões de compliance registadas em AuditEvent.
