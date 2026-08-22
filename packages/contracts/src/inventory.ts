import { z } from "zod";
import { marketCodeSchema, organizationIdSchema } from "./common.js";

export const stockMovementTypeSchema = z.enum([
  "RECEIPT",
  "ADJUSTMENT",
  "DISPENSE",
  "REFUND",
  "RESERVATION",
  "RELEASE",
]);

export type StockMovementType = z.infer<typeof stockMovementTypeSchema>;

export const inventoryAlertTypeSchema = z.enum([
  "LOW",
  "CRITICAL",
  "EXPIRING",
  "EXPIRED",
]);

export type InventoryAlertType = z.infer<typeof inventoryAlertTypeSchema>;

export const inventoryAlertThresholdsSchema = z.object({
  low: z.number().int().min(0).default(0),
  critical: z.number().int().min(0).default(0),
  expiringDays: z.number().int().min(1).max(365).default(90),
});

export type InventoryAlertThresholds = z.infer<
  typeof inventoryAlertThresholdsSchema
>;

export const inventoryItemSchema = z.object({
  id: z.string().cuid(),
  productId: z.string().cuid(),
  batchId: z.string().cuid().optional(),
  pharmacyId: z.string().cuid(),
  quantityOnHand: z.number().int().min(0),
  reorderPoint: z.number().int().min(0),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  updatedAt: z.date(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export const batchSchema = z
  .object({
    id: z.string().cuid(),
    productId: z.string().cuid(),
    pharmacyId: z.string().cuid(),
    batchNumber: z.string().min(1).max(80),
    expiryDate: z.date(),
    receivedQty: z.number().int().min(1),
    remainingQty: z.number().int().min(0),
    costPriceMinor: z.number().int().min(0),
    organizationId: organizationIdSchema,
    marketCode: marketCodeSchema,
    createdAt: z.date(),
  })
  .refine((batch) => batch.remainingQty <= batch.receivedQty, {
    message: "remainingQty não pode exceder receivedQty",
  });

export type Batch = z.infer<typeof batchSchema>;

export const stockMovementSchema = z.object({
  id: z.string().cuid(),
  itemId: z.string().cuid(),
  batchId: z.string().cuid().optional(),
  type: stockMovementTypeSchema,
  qty: z
    .number()
    .int()
    .refine((value) => value !== 0, { message: "qty não pode ser zero" }),
  reason: z.string().max(300).optional(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  createdAt: z.date(),
});

export type StockMovement = z.infer<typeof stockMovementSchema>;

export const inventoryAlertSchema = z.object({
  id: z.string().cuid(),
  itemId: z.string().cuid(),
  pharmacyId: z.string().cuid(),
  type: inventoryAlertTypeSchema,
  message: z.string().max(200).optional(),
  thresholds: inventoryAlertThresholdsSchema.optional(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  createdAt: z.date(),
});

export type InventoryAlert = z.infer<typeof inventoryAlertSchema>;

export const receiveBatchInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  productId: z.string().cuid(),
  pharmacyId: z.string().cuid(),
  batchNumber: z.string().min(1).max(80),
  expiryDate: z.date(),
  receivedQty: z.number().int().min(1).max(1_000_000),
  costPriceMinor: z.number().int().min(0),
});

export type ReceiveBatchInput = z.infer<typeof receiveBatchInputSchema>;

export const adjustStockInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  itemId: z.string().cuid(),
  pharmacyId: z.string().cuid().optional(),
  qty: z
    .number()
    .int()
    .refine((value) => value !== 0, { message: "variação não pode ser zero" }),
  reason: z.string().max(300).optional(),
});

export type AdjustStockInput = z.infer<typeof adjustStockInputSchema>;

export const listInventoryInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  pharmacyId: z.string().cuid().optional(),
  productId: z.string().cuid().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type ListInventoryInput = z.infer<typeof listInventoryInputSchema>;

export const updateReorderPointInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  itemId: z.string().cuid(),
  reorderPoint: z.number().int().min(0),
});

export type UpdateReorderPointInput = z.infer<
  typeof updateReorderPointInputSchema
>;
