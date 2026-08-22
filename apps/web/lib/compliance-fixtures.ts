export type CompliancePolicy = {
  marketCode: string;
  maxPrescriptionDays: number;
  saftExportEnabled: boolean;
  agtReportingEnabled: boolean;
};

export type ComplianceDecision = {
  id: string;
  subject: "HEALTHCARE_PROFESSIONAL" | "PHARMACY" | "SUPPLIER" | "PRODUCT" | "E_PRESCRIPTION";
  decision: "APPROVED" | "REJECTED" | "ESCALATED";
  reason: string;
  decidedAt: Date;
};

export type SaFTExport = {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  requestedAt: Date;
};

export const DEMO_COMPLIANCE_POLICY: CompliancePolicy = {
  marketCode: "AO",
  maxPrescriptionDays: 30,
  saftExportEnabled: true,
  agtReportingEnabled: true,
};

export const DEMO_COMPLIANCE_DECISIONS: readonly ComplianceDecision[] = [
  {
    id: "dec-001",
    subject: "E_PRESCRIPTION",
    decision: "APPROVED",
    reason: "Receita dentro do prazo e válida.",
    decidedAt: new Date("2026-08-20T10:00:00Z"),
  },
  {
    id: "dec-002",
    subject: "PHARMACY",
    decision: "APPROVED",
    reason: "Licença farmacêutica válida.",
    decidedAt: new Date("2026-08-19T14:30:00Z"),
  },
  {
    id: "dec-003",
    subject: "PRODUCT",
    decision: "REJECTED",
    reason: "Produto não autorizado para venda.",
    decidedAt: new Date("2026-08-18T09:15:00Z"),
  },
  {
    id: "dec-004",
    subject: "HEALTHCARE_PROFESSIONAL",
    decision: "ESCALATED",
    reason: "Verificação de credencial pendente.",
    decidedAt: new Date("2026-08-17T16:45:00Z"),
  },
];

export const DEMO_SAFT_EXPORTS: readonly SaFTExport[] = [
  {
    id: "saft-001",
    periodStart: new Date("2026-08-01T00:00:00Z"),
    periodEnd: new Date("2026-08-15T23:59:59Z"),
    status: "COMPLETED",
    requestedAt: new Date("2026-08-16T08:00:00Z"),
  },
  {
    id: "saft-002",
    periodStart: new Date("2026-08-16T00:00:00Z"),
    periodEnd: new Date("2026-08-22T23:59:59Z"),
    status: "QUEUED",
    requestedAt: new Date("2026-08-22T07:30:00Z"),
  },
];
