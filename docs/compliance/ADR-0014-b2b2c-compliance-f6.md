# ADR-0014: B2B2C + Receitas digitais + Compliance (F6) — e-prescription genérica, compliance policy-driven e timeline com responsabilidade

- **Estado:** Aceite
- **Data:** 2026-08-21
- **Fase:** F6 — B2B2C + Receitas digitais + Compliance (09-ROADMAP-FASES.md)

## Contexto

A v2 exige a rede B2B2C completa (Cliente → Farmácia → Fornecedor → Entrega)
com **responsabilidade visível por etapa** (03 §5), receitas digitais emitidas
por profissionais de saúde verificados (03 §11) e compliance regulatório por
mercado (03 §20): medicamentos controlados, licenças, prazos de receita,
SAF-T/AGT. Como nas fases anteriores, as dependências de runtime ainda não
estão instaladas, pelo que a F6 é **dependency-safe**: serviços em memória com
AuditEvent best-effort via `@brocolis/db`.

## Decisão

1. **E-prescription genérica, nunca licenças hardcoded.** O
   `HealthcareProfessional` carrega uma credencial genérica
   (`ProfessionalCredential { type, number, issuedBy?, … }`) em vez de um tipo
   fixo "AngolaPharmacistLicense". A injeção de país acontece na configuração
   do mercado (03 §26: `professional_credential: "AO→AngolaPharmacistLicense"`
   é dado, não código). Cada item da receita traz `activeSubstance` (DCI/código
   genérico) que é cruzado com a policy do mercado para detetar substâncias
   controladas.

2. **Compliance policy-driven (Build Global, Configure Local).**
   `RegulatoryPolicy` por `marketCode` concentra `controlledSubstances`,
   `prescriptionRequiredCategories`, `maxPrescriptionDaysValid`,
   `licenseRequirements`, `saftEnabled` e `agtEndpoint?`. O helper
   `policyForMarket(marketCode, policies)` faz **fallback seguro** (policy
   vazia com defaults) para mercados sem configuração — nenhum serviço contém
   `if (country === "AO")`. A expiração da receita é por dias corridos
   (`daysValid`, teto regulatório validado na emissão e na renovação).

3. **Timeline B2B2C com responsabilidade explícita.** Cada etapa
   (`CONSUMER_ORDER → PHARMACY_CONFIRMATION → SUPPLIER_PULL → DELIVERY`) tem
   dono, estado (`PENDING/IN_PROGRESS/COMPLETED/DELAYED` por SLA),
   `responsibleParty` (`PHARMACY/SUPPLIER/PLATFORM`) e SLA datado. A função
   pura `buildNetworkStages(configs, events, now)` deriva os estados dos
   eventos do pedido; `supplierVisible(stages, showSupplier)` garante que o
   **fornecedor só aparece para operadores** — o cliente vê "Gerido pela sua
   farmácia" (farmácia é a face). `stockSourceFor` expõe a origem do stock
   (`PHARMACY_STOCK | SUPPLIER_PULL`) apenas em contexto operacional.

4. **Auditoria universal nas mutações críticas.** Emitir/dispensar/revogar/
   renovar receita, verificar profissional, upsert de policy, decisão de
   compliance e pedido SAF-T emitem `AuditEvent` na mesma operação (best-effort
   DB + log em memória enquanto o Prisma não está wired, padrão F2/F3).
   `ComplianceDecision` (SUBJECT enum × APPROVED/REJECTED/ESCALATED) existe
   como registo estruturado além do evento bruto; o explorer
   (`auditExplorerQuerySchema`) filtra sempre por `organizationId` +
   `marketCode`.

5. **SAF-T mock com job id.** `POST /compliance/saft-exports` valida
   `saftEnabled` da policy do mercado e devolve um `SaftExportJob` `QUEUED`
   (estrutura mock, sem gerador XML nesta fase); o gerador real fica para o
   endurecimento F7 com as skills AGT/SAF-T.

6. **i18n F6 isolado.** `packages/i18n/src/f6-messages.ts` (prefixos
   `network.*`, `rxdigital.*`, `compliance.*`) nos 6 locales. Enquanto o
   exports map do pacote não expõe o subpath, os componentes web usam shim
   local `apps/web/lib/network-i18n.ts` com paridade testada de chaves.

## Alternativas

- Campo `licenseType: "AngolaPharmacistLicense"` no schema: descartado —
  viola Build Global/Configure Local e espalha detalhes de país pelo Core.
- Validar substâncias controladas por lista hardcoded no serviço: descartado —
  cada mercado tem lista própria; a policy é a única fonte.
- Reutilizar `prescription.ts` (upload F3): mantido separado — receita por
  upload (F3) e e-prescription assinada (F6) têm ciclos de vida distintos;
  ambas coexistem no domínio.
- Timeline derivada no servidor: descartado para UI — o cálculo puro em lib
  testável permite renderizar a partir de eventos mock hoje e de OrderEvents
  reais depois, sem acoplar a API à apresentação.

## Consequências

- Positivo: novos mercados ligam-se com uma linha de policy (zero código);
  auditoria uniforme permite explorer único; timeline reutilizável web/mobile
  (mesmos contratos); gate B2B2C E2E pode correr sobre fixtures determinísticas.
- Negativo: serviços continuam em memória até ao wiring Prisma (padrão das
  fases anteriores); shim i18n temporário duplica as chaves `network.*` na web
  até o subpath `@brocolis/i18n/f6-messages` existir; SAF-T continua mock.
