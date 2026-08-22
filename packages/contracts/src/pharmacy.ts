import { z } from "zod";
import { marketCodeSchema, organizationIdSchema } from "./common.js";

export const pharmacistSchema = z.object({
  id: z.string().cuid(),
  pharmacyId: z.string().cuid(),
  userId: z.string().cuid(),
  role: z.literal("PHARMACIST"),
  active: z.boolean().default(true),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  createdAt: z.date(),
});

export type Pharmacist = z.infer<typeof pharmacistSchema>;

export const pharmacyVerificationStatusSchema = z.enum([
  "VERIFIED",
  "PREMIUM_VERIFIED",
  "PENDING_VERIFICATION",
  "SUSPENDED",
]);

export type PharmacyVerificationStatus = z.infer<
  typeof pharmacyVerificationStatusSchema
>;

export const verifyPharmacyInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  pharmacyId: z.string().cuid(),
  status: pharmacyVerificationStatusSchema.default("VERIFIED"),
  documentUrls: z.array(z.string().url()).min(1).optional(),
});

export type VerifyPharmacyInput = z.infer<typeof verifyPharmacyInputSchema>;

export const settlementStatusSchema = z.enum(["PENDING", "PAID", "FAILED"]);

export type SettlementStatus = z.infer<typeof settlementStatusSchema>;

export const deliveryStatusSchema = z.enum([
  "SCHEDULED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED",
]);

export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>;

export const pharmacySettlementSchema = z
  .object({
    id: z.string().cuid(),
    pharmacyId: z.string().cuid(),
    organizationId: organizationIdSchema,
    marketCode: marketCodeSchema,
    periodStart: z.date(),
    periodEnd: z.date(),
    grossMinor: z.number().int().min(0),
    commissionRateBps: z.number().int().min(0),
    commissionMinor: z.number().int().min(0),
    netMinor: z.number().int().min(0),
    reserveMinor: z.number().int().min(0),
    status: settlementStatusSchema.default("PENDING"),
    finpayRef: z.string().optional(),
    createdAt: z.date(),
  })
  .refine(
    (settlement) =>
      settlement.periodEnd.getTime() >= settlement.periodStart.getTime(),
    { message: "periodEnd não pode preceder periodStart" },
  );

export type PharmacySettlement = z.infer<typeof pharmacySettlementSchema>;

export const createSettlementInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  pharmacyId: z.string().cuid(),
  periodStart: z.date(),
  periodEnd: z.date(),
});

export type CreateSettlementInput = z.infer<typeof createSettlementInputSchema>;

export const refundStatusSchema = z.enum([
  "INITIATED",
  "APPROVED",
  "REFUNDED",
  "FAILED",
]);

export type RefundStatus = z.infer<typeof refundStatusSchema>;

export const refundSchema = z.object({
  id: z.string().cuid(),
  orderId: z.string().cuid(),
  amountMinor: z.number().int().min(0),
  reason: z.string().min(1).max(500),
  status: refundStatusSchema.default("INITIATED"),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  finpayRef: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Refund = z.infer<typeof refundSchema>;

export const requestRefundInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  orderId: z.string().cuid(),
  reason: z.string().min(1).max(500),
});

export type RequestRefundInput = z.infer<typeof requestRefundInputSchema>;
