export type AuditEvent = {
  id: string;
  action: string;
  actor: string;
  resource: string;
  timestamp: Date;
};

export const DEMO_AUDIT_EVENTS: readonly AuditEvent[] = [
  {
    id: "audit-001",
    action: "compliance.decision.approved",
    actor: "Sistema",
    resource: "E_PRESCRIPTION/RX-29382",
    timestamp: new Date("2026-08-20T10:00:00Z"),
  },
  {
    id: "audit-002",
    action: "compliance.decision.rejected",
    actor: "Sistema",
    resource: "PRODUCT/PRD-5511",
    timestamp: new Date("2026-08-19T14:30:00Z"),
  },
  {
    id: "audit-003",
    action: "compliance.saft.request",
    actor: "Admin",
    resource: "SAF-T/saft-001",
    timestamp: new Date("2026-08-19T08:00:00Z"),
  },
  {
    id: "audit-004",
    action: "pharmacy.prescriptions.approved",
    actor: "Farmacêutico",
    resource: "RX-29379",
    timestamp: new Date("2026-08-18T11:20:00Z"),
  },
  {
    id: "audit-005",
    action: "compliance.decision.escalated",
    actor: "Sistema",
    resource: "HEALTHCARE_PROFESSIONAL/HP-882",
    timestamp: new Date("2026-08-17T16:45:00Z"),
  },
];
