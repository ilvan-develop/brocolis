import { z } from "zod";
import {
  marketCodeSchema,
  moneySchema,
  organizationIdSchema,
} from "./common.js";

export const b2b2cFlowStageSchema = z.enum([
  "CONSUMER_ORDER",
  "PHARMACY_CONFIRMATION",
  "SUPPLIER_PULL",
  "DELIVERY",
]);

export type B2b2cFlowStage = z.infer<typeof b2b2cFlowStageSchema>;

export const b2b2cFlowStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "DELAYED",
]);

export type B2b2cFlowStatus = z.infer<typeof b2b2cFlowStatusSchema>;

export const b2b2cPartyTypeSchema = z.enum([
  "PHARMACY",
  "SUPPLIER",
  "PLATFORM",
]);

export type B2b2cPartyType = z.infer<typeof b2b2cPartyTypeSchema>;

export const b2b2cStockSourceSchema = z.enum([
  "PHARMACY_STOCK",
  "SUPPLIER_PULL",
]);

export type B2b2cStockSource = z.infer<typeof b2b2cStockSourceSchema>;

export const b2b2cTimelineEntrySchema = z.object({
  id: z.string().cuid(),
  orderId: z.string().cuid(),
  stage: b2b2cFlowStageSchema,
  status: b2b2cFlowStatusSchema,
  responsibleParty: b2b2cPartyTypeSchema,
  responsibleId: z.string().min(1).max(120),
  stockSource: b2b2cStockSourceSchema.optional(),
  slaDeadline: z.date().optional(),
  note: z.string().max(500).optional(),
  createdAt: z.date(),
});

export type B2b2cTimelineEntry = z.infer<typeof b2b2cTimelineEntrySchema>;

export const b2b2cOrderSchema = z.object({
  id: z.string().cuid(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  customerId: z.string().min(1).max(200).optional(),
  pharmacyId: z.string().cuid(),
  supplierId: z.string().cuid().optional(),
  currentStage: b2b2cFlowStageSchema,
  currentStatus: b2b2cFlowStatusSchema,
  stockSource: b2b2cStockSourceSchema.default("PHARMACY_STOCK"),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().int().min(1).max(999),
        unitPrice: moneySchema,
      }),
    )
    .min(1),
  total: moneySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type B2b2cOrder = z.infer<typeof b2b2cOrderSchema>;

export const createB2b2cOrderInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  customerId: z.string().min(1).max(200).optional(),
  pharmacyId: z.string().cuid(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().int().min(1).max(999),
        unitPrice: moneySchema,
      }),
    )
    .min(1),
  total: moneySchema,
});

export type CreateB2b2cOrderInput = z.infer<typeof createB2b2cOrderInputSchema>;

export const getB2b2cOrderInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  orderId: z.string().cuid(),
});

export type GetB2b2cOrderInput = z.infer<typeof getB2b2cOrderInputSchema>;

export const listB2b2cOrdersInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  pharmacyId: z.string().cuid().optional(),
  stage: b2b2cFlowStageSchema.optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type ListB2b2cOrdersInput = z.infer<typeof listB2b2cOrdersInputSchema>;

export const confirmPharmacyInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  orderId: z.string().cuid(),
  pharmacyId: z.string().cuid(),
  note: z.string().max(500).optional(),
});

export type ConfirmPharmacyInput = z.infer<typeof confirmPharmacyInputSchema>;

export const pullFromSupplierInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  orderId: z.string().cuid(),
  supplierId: z.string().cuid(),
  note: z.string().max(500).optional(),
});

export type PullFromSupplierInput = z.infer<typeof pullFromSupplierInputSchema>;

export const markDeliveredInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  orderId: z.string().cuid(),
  note: z.string().max(500).optional(),
});

export type MarkDeliveredInput = z.infer<typeof markDeliveredInputSchema>;

export const getB2b2cTimelineInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  orderId: z.string().cuid(),
});

export type GetB2b2cTimelineInput = z.infer<typeof getB2b2cTimelineInputSchema>;
