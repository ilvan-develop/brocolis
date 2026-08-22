import { z } from "zod";
import { marketCodeSchema, organizationIdSchema } from "./common.js";

export const regulatoryPolicySchema = z.object({
  marketCode: marketCodeSchema,
  controlledSubstances: z.array(z.string().min(1).max(80)).default([]),
  prescriptionRequiredCategories: z
    .array(z.string().min(1).max(80))
    .default([]),
  maxPrescriptionDaysValid: z.number().int().min(1).max(365).default(30),
  licenseRequirements: z.array(z.string().min(1).max(80)).default([]),
  saftEnabled: z.boolean().default(false),
  agtEndpoint: z.string().url().optional(),
});

export type RegulatoryPolicy = z.infer<typeof regulatoryPolicySchema>;

export const DEFAULT_REGULATORY_POLICY: RegulatoryPolicy = {
  marketCode: "AO",
  controlledSubstances: [],
  prescriptionRequiredCategories: [],
  maxPrescriptionDaysValid: 30,
  licenseRequirements: [],
  saftEnabled: false,
};

/** Fallback seguro: mercado desconhecido → policy vazia (não bloqueante). */
export function policyForMarket(
  marketCode: string,
  policies: readonly RegulatoryPolicy[],
): RegulatoryPolicy {
  const normalized = marketCode.trim().toUpperCase();
  const found = policies.find((policy) => policy.marketCode === normalized);
  if (found) {
    return found;
  }
  return { ...DEFAULT_REGULATORY_POLICY, marketCode: normalized };
}

export const complianceSubjectTypeSchema = z.enum([
  "HEALTHCARE_PROFESSIONAL",
  "PHARMACY",
  "SUPPLIER",
  "PRODUCT",
  "E_PRESCRIPTION",
]);

export type ComplianceSubjectType = z.infer<typeof complianceSubjectTypeSchema>;

export const complianceDecisionOutcomeSchema = z.enum([
  "APPROVED",
  "REJECTED",
  "ESCALATED",
]);

export type ComplianceDecisionOutcome = z.infer<
  typeof complianceDecisionOutcomeSchema
>;

export const complianceDecisionSchema = z.object({
  id: z.string().cuid(),
  subjectType: complianceSubjectTypeSchema,
  subjectId: z.string().cuid(),
  decision: complianceDecisionOutcomeSchema,
  reason: z.string().min(1).max(500),
  decidedBy: z.string().min(1).max(120),
  decidedAt: z.date(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
});

export type ComplianceDecision = z.infer<typeof complianceDecisionSchema>;

export const recordComplianceDecisionInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  subjectType: complianceSubjectTypeSchema,
  subjectId: z.string().cuid(),
  decision: complianceDecisionOutcomeSchema,
  reason: z.string().min(1).max(500),
  decidedBy: z.string().min(1).max(120),
});

export type RecordComplianceDecisionInput = z.infer<
  typeof recordComplianceDecisionInputSchema
>;

export const saftExportTypeSchema = z.enum(["FULL", "SALES", "PURCHASES"]);

export type SaftExportType = z.infer<typeof saftExportTypeSchema>;

export const requestSaftExportInputSchema = z
  .object({
    organizationId: organizationIdSchema,
    marketCode: marketCodeSchema,
    periodStart: z.date(),
    periodEnd: z.date(),
    type: saftExportTypeSchema.default("FULL"),
    requestedBy: z.string().min(1).max(120),
  })
  .refine((input) => input.periodEnd.getTime() >= input.periodStart.getTime(), {
    message: "periodEnd não pode preceder periodStart",
  });

export type RequestSaftExportInput = z.infer<
  typeof requestSaftExportInputSchema
>;

export const saftExportStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
]);

export type SaftExportStatus = z.infer<typeof saftExportStatusSchema>;

export const saftExportJobSchema = z.object({
  id: z.string().cuid(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  periodStart: z.date(),
  periodEnd: z.date(),
  type: saftExportTypeSchema.default("FULL"),
  status: saftExportStatusSchema.default("QUEUED"),
  requestedBy: z.string().min(1).max(120),
  fileUrl: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SaftExportJob = z.infer<typeof saftExportJobSchema>;

export const upsertRegulatoryPolicyInputSchema = regulatoryPolicySchema;

export type UpsertRegulatoryPolicyInput = z.infer<
  typeof upsertRegulatoryPolicyInputSchema
>;

export const auditExplorerQuerySchema = z
  .object({
    organizationId: organizationIdSchema,
    marketCode: marketCodeSchema,
    subjectType: complianceSubjectTypeSchema.optional(),
    subjectId: z.string().cuid().optional(),
    action: z.string().min(1).max(120).optional(),
    from: z.date().optional(),
    to: z.date().optional(),
  })
  .refine(
    (query) =>
      query.from === undefined ||
      query.to === undefined ||
      query.to.getTime() >= query.from.getTime(),
    { message: "'to' não pode preceder 'from'" },
  );

export type AuditExplorerQuery = z.infer<typeof auditExplorerQuerySchema>;

export const auditExplorerEntrySchema = z.object({
  id: z.string().cuid(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  actorType: z.string().min(1).max(40),
  actorId: z.string().min(1).max(120),
  action: z.string().min(1).max(120),
  resourceType: z.string().min(1).max(60),
  resourceId: z.string().min(1).max(120),
  payload: z.record(z.string(), z.unknown()),
  at: z.date(),
});

export type AuditExplorerEntry = z.infer<typeof auditExplorerEntrySchema>;
