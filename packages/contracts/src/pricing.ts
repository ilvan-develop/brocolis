import { z } from "zod";
import { marketCodeSchema, organizationIdSchema } from "./common.js";

export const priceTierInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  supplierId: z.string().cuid(),
  productId: z.string().cuid(),
  minQty: z.number().int().min(1),
  maxQty: z.number().int().min(1).optional(),
  unitPriceMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default("AOA"),
});

export type PriceTierInput = z.infer<typeof priceTierInputSchema>;

export const volumePriceInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  supplierId: z.string().cuid(),
  productId: z.string().cuid(),
  minVolume: z.number().int().min(1),
  discountBps: z.number().int().min(0).max(10000),
});

export type VolumePriceInput = z.infer<typeof volumePriceInputSchema>;

export const calculatePriceInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  supplierId: z.string().cuid(),
  productId: z.string().cuid(),
  quantity: z.number().int().min(1),
});

export type CalculatePriceInput = z.infer<typeof calculatePriceInputSchema>;

export const calculatedPriceSchema = z.object({
  unitPriceMinor: z.number().int().nonnegative(),
  tierApplied: z.string().optional(),
  volumeDiscountBps: z.number().int().nonnegative().optional(),
  lineTotalMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
});

export type CalculatedPrice = z.infer<typeof calculatedPriceSchema>;

export const createCreditAccountInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  supplierId: z.string().cuid(),
  creditLimitMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default("AOA"),
});

export type CreateCreditAccountInput = z.infer<
  typeof createCreditAccountInputSchema
>;

export const checkCreditInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  supplierId: z.string().cuid(),
  amountMinor: z.number().int().positive(),
});

export type CheckCreditInput = z.infer<typeof checkCreditInputSchema>;

export const creditCheckResultSchema = z.object({
  available: z.boolean(),
  creditLimitMinor: z.number().int(),
  balanceMinor: z.number().int(),
  requestedMinor: z.number().int(),
});

export type CreditCheckResult = z.infer<typeof creditCheckResultSchema>;
