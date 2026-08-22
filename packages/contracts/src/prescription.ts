import { z } from "zod";
import { marketCodeSchema, organizationIdSchema } from "./common.js";

export const prescriptionStatusSchema = z.enum([
  "PENDING",
  "RESPONSE_REQUIRED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
]);

export type PrescriptionStatus = z.infer<typeof prescriptionStatusSchema>;

export const prescriptionAttachmentSchema = z.object({
  uri: z.string().url(),
  type: z.string().min(1).max(50),
});

export type PrescriptionAttachment = z.infer<
  typeof prescriptionAttachmentSchema
>;

export const prescriptionSchema = z.object({
  id: z.string().cuid(),
  orderId: z.string().cuid(),
  status: prescriptionStatusSchema.default("PENDING"),
  attachments: z.array(z.string().url()).max(4),
  pharmacistId: z.string().cuid().optional(),
  pharmacistNotes: z.string().max(1000).optional(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Prescription = z.infer<typeof prescriptionSchema>;

export const uploadPrescriptionInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  orderId: z.string().cuid(),
  files: z.array(prescriptionAttachmentSchema).min(1).max(4),
});

export type UploadPrescriptionInput = z.infer<
  typeof uploadPrescriptionInputSchema
>;

export const prescriptionActionSchema = z.enum(["APPROVE", "REJECT"]);

export type PrescriptionAction = z.infer<typeof prescriptionActionSchema>;

export const respondPrescriptionInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  prescriptionId: z.string().cuid(),
  action: prescriptionActionSchema,
  notes: z.string().max(1000).optional(),
});

export type RespondPrescriptionInput = z.infer<
  typeof respondPrescriptionInputSchema
>;

export const expirationRulesSchema = z.object({
  daysValid: z.number().int().min(1).max(365).default(30),
  controlledSubstances: z.array(z.string().min(1).max(80)).default([]),
});

export type ExpirationRules = z.infer<typeof expirationRulesSchema>;
