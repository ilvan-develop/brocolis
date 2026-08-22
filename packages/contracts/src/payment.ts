import { z } from "zod";
import { marketCodeSchema, organizationIdSchema } from "./common.js";

export const currencyCodeSchema = z
  .string()
  .length(3)
  .toUpperCase()
  .default("AOA");

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;

export const paymentMethodSchema = z.enum([
  "CARD",
  "WALLET",
  "REFERENCE",
  "COD",
  "MOBILE",
]);

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const paymentStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "FAILED",
  "REFUNDED",
]);

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const paymentSchema = z.object({
  id: z.string().cuid(),
  intentId: z.string().min(1).max(128),
  orderId: z.string().cuid(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  amountMinor: z.number().int().min(0),
  currency: currencyCodeSchema,
  method: paymentMethodSchema,
  status: paymentStatusSchema.default("PENDING"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Payment = z.infer<typeof paymentSchema>;

export const createPaymentInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  orderId: z.string().cuid(),
  amountMinor: z.number().int().min(0),
  currency: currencyCodeSchema,
  method: paymentMethodSchema,
});

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;

export const finpayWebhookEventTypeSchema = z.enum(["CONFIRMED", "FAILED"]);

export type FinpayWebhookEventType = z.infer<
  typeof finpayWebhookEventTypeSchema
>;

export const finpayWebhookSchema = z.object({
  eventId: z.string().min(1).max(128),
  eventType: finpayWebhookEventTypeSchema,
  intentId: z.string().min(1).max(128),
  orderId: z.string().cuid(),
  amountMinor: z.number().int().min(0),
  currency: currencyCodeSchema,
  signature: z.string().min(1).optional(),
});

export type FinpayWebhook = z.infer<typeof finpayWebhookSchema>;
