import { z } from "zod";
import { marketCodeSchema, organizationIdSchema } from "./common.js";

export const professionalCredentialSchema = z.object({
  type: z.string().min(1).max(80),
  number: z.string().min(1).max(80),
  issuedBy: z.string().min(1).max(160).optional(),
  issuedAt: z.date().optional(),
  expiresAt: z.date().optional(),
});

export type ProfessionalCredential = z.infer<
  typeof professionalCredentialSchema
>;

export const healthcareProfessionalStatusSchema = z.enum([
  "VERIFIED",
  "PENDING",
  "SUSPENDED",
]);

export type HealthcareProfessionalStatus = z.infer<
  typeof healthcareProfessionalStatusSchema
>;

export const healthcareProfessionalSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(160),
  credential: professionalCredentialSchema,
  specialty: z.string().min(1).max(80),
  marketCode: marketCodeSchema,
  verificationStatus: healthcareProfessionalStatusSchema.default("PENDING"),
  organizationId: organizationIdSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type HealthcareProfessional = z.infer<
  typeof healthcareProfessionalSchema
>;

export const registerHealthcareProfessionalInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  name: z.string().min(1).max(160),
  credential: professionalCredentialSchema,
  specialty: z.string().min(1).max(80),
});

export type RegisterHealthcareProfessionalInput = z.infer<
  typeof registerHealthcareProfessionalInputSchema
>;

export const setProfessionalVerificationInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  professionalId: z.string().cuid(),
  status: z.enum(["VERIFIED", "SUSPENDED"]),
  decidedBy: z.string().min(1).max(120),
});

export type SetProfessionalVerificationInput = z.infer<
  typeof setProfessionalVerificationInputSchema
>;

export const ePrescriptionItemSchema = z.object({
  productId: z.string().cuid(),
  activeSubstance: z.string().min(1).max(80),
  dosage: z.string().min(1).max(120),
  instructions: z.string().min(1).max(500),
  quantity: z.number().int().min(1).max(999),
});

export type EPrescriptionItem = z.infer<typeof ePrescriptionItemSchema>;

export const ePrescriptionStatusSchema = z.enum([
  "ACTIVE",
  "DISPENSED",
  "EXPIRED",
  "REVOKED",
  "REJECTED",
]);

export type EPrescriptionStatus = z.infer<typeof ePrescriptionStatusSchema>;

export const ePrescriptionSchema = z
  .object({
    id: z.string().cuid(),
    professionalId: z.string().cuid(),
    patientRef: z.string().cuid(),
    items: z.array(ePrescriptionItemSchema).min(1).max(20),
    issuedAt: z.date(),
    expiresAt: z.date(),
    daysValid: z.number().int().min(1).max(365),
    signatureHash: z.string().min(8).max(128),
    status: ePrescriptionStatusSchema.default("ACTIVE"),
    sourceMarketCode: marketCodeSchema,
    organizationId: organizationIdSchema,
    marketCode: marketCodeSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .refine((rx) => rx.expiresAt.getTime() >= rx.issuedAt.getTime(), {
    message: "expiresAt não pode preceder issuedAt",
  });

export type EPrescription = z.infer<typeof ePrescriptionSchema>;

export const issueEPrescriptionInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  professionalId: z.string().cuid(),
  patientRef: z.string().cuid(),
  items: z.array(ePrescriptionItemSchema).min(1).max(20),
  daysValid: z.number().int().min(1).max(365).default(30),
});

export type IssueEPrescriptionInput = z.infer<
  typeof issueEPrescriptionInputSchema
>;

export const validateEPrescriptionInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  prescriptionId: z.string().cuid(),
  pharmacyId: z.string().cuid(),
});

export type ValidateEPrescriptionInput = z.infer<
  typeof validateEPrescriptionInputSchema
>;

export const ePrescriptionValidationResultSchema = z.object({
  prescriptionId: z.string().cuid(),
  pharmacyId: z.string().cuid(),
  valid: z.boolean(),
  reasons: z.array(z.string().max(200)).max(20),
  controlledSubstances: z.array(z.string().max(80)).max(50),
});

export type EPrescriptionValidationResult = z.infer<
  typeof ePrescriptionValidationResultSchema
>;

export const revokeEPrescriptionInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  prescriptionId: z.string().cuid(),
  reason: z.string().min(1).max(500),
});

export type RevokeEPrescriptionInput = z.infer<
  typeof revokeEPrescriptionInputSchema
>;

export const renewEPrescriptionInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  prescriptionId: z.string().cuid(),
  daysValid: z.number().int().min(1).max(365),
});

export type RenewEPrescriptionInput = z.infer<
  typeof renewEPrescriptionInputSchema
>;

const DAY_MS = 24 * 60 * 60 * 1000;

export function ePrescriptionExpiry(issuedAt: Date, daysValid: number): Date {
  return new Date(issuedAt.getTime() + daysValid * DAY_MS);
}

export function isEPrescriptionExpired(
  rx: Pick<EPrescription, "expiresAt" | "status">,
  now: Date,
): boolean {
  if (rx.status !== "ACTIVE") {
    return false;
  }
  return now.getTime() > rx.expiresAt.getTime();
}

export function controlledSubstancesIn(
  items: readonly EPrescriptionItem[],
  controlledSubstances: readonly string[],
): string[] {
  const controlled = new Set(
    controlledSubstances.map((s) => s.trim().toUpperCase()),
  );
  const found = new Set<string>();
  for (const item of items) {
    const substance = item.activeSubstance.trim().toUpperCase();
    if (controlled.has(substance)) {
      found.add(item.activeSubstance);
    }
  }
  return [...found];
}
