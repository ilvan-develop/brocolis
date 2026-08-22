import { z } from "zod";
import { marketCodeSchema, organizationIdSchema } from "./common.js";

export const rfqStatusEnumSchema = z.enum([
  "DRAFT",
  "OPEN",
  "QUOTED",
  "AWARDED",
  "CANCELED",
  "EXPIRED",
]);

export type RfqStatus = z.infer<typeof rfqStatusEnumSchema>;

export const quotationStatusEnumSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
]);

export type QuotationStatus = z.infer<typeof quotationStatusEnumSchema>;

export const poStatusEnumSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "CONFIRMED",
  "IN_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "CANCELED",
]);

export type PoStatus = z.infer<typeof poStatusEnumSchema>;

export const approvalStatusEnumSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ESCALATED",
]);

export type ApprovalStatus = z.infer<typeof approvalStatusEnumSchema>;

export const creditStatusEnumSchema = z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]);

export type CreditStatus = z.infer<typeof creditStatusEnumSchema>;

export const supplierStatusEnumSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);

export type SupplierStatus = z.infer<typeof supplierStatusEnumSchema>;

export const createSupplierInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(120),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(6).max(20).optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierInputSchema>;

export const supplierSchema = createSupplierInputSchema.extend({
  id: z.string().cuid(),
  status: supplierStatusEnumSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Supplier = z.infer<typeof supplierSchema>;

export const createRfqInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  supplierId: z.string().cuid(),
  subject: z.string().min(1).max(300),
  validUntil: z.date().optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateRfqInput = z.infer<typeof createRfqInputSchema>;

export const rfqSchema = createRfqInputSchema.extend({
  id: z.string().cuid(),
  reference: z.string().min(1).max(50),
  status: rfqStatusEnumSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Rfq = z.infer<typeof rfqSchema>;

export const rfqItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99999),
});

export type RfqItem = z.infer<typeof rfqItemSchema>;

export const createQuotationInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  rfqId: z.string().cuid(),
  supplierId: z.string().cuid(),
  totalAmountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default("AOA"),
  validUntil: z.date().optional(),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().int().min(1),
        unitPriceMinor: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

export type CreateQuotationInput = z.infer<typeof createQuotationInputSchema>;

export const quotationSchema = z.object({
  id: z.string().cuid(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  rfqId: z.string().cuid(),
  supplierId: z.string().cuid(),
  reference: z.string().min(1).max(50),
  status: quotationStatusEnumSchema,
  totalAmountMinor: z.number().int(),
  currency: z.string().length(3),
  validUntil: z.date().optional(),
  notes: z.string().max(1000).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Quotation = z.infer<typeof quotationSchema>;

export const purchaseOrderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1),
  unitPriceMinor: z.number().int().nonnegative(),
  lineTotalMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default("AOA"),
});

export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemSchema>;

export const createPurchaseOrderInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  quotationId: z.string().cuid().optional(),
  supplierId: z.string().cuid(),
  totalAmountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default("AOA"),
  requestedDeliveryDate: z.date().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(purchaseOrderItemSchema).min(1),
});

export type CreatePurchaseOrderInput = z.infer<
  typeof createPurchaseOrderInputSchema
>;

export const purchaseOrderSchema = z.object({
  id: z.string().cuid(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  quotationId: z.string().cuid().optional(),
  supplierId: z.string().cuid(),
  reference: z.string().min(1).max(50),
  status: poStatusEnumSchema,
  totalAmountMinor: z.number().int(),
  currency: z.string().length(3),
  requestedDeliveryDate: z.date().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(purchaseOrderItemSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;

export const approvalWorkflowSchema = z.object({
  id: z.string().cuid(),
  purchaseOrderId: z.string().cuid(),
  approverId: z.string().min(1),
  status: approvalStatusEnumSchema,
  level: z.number().int().min(1),
  notes: z.string().max(500).optional(),
  decidedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ApprovalWorkflow = z.infer<typeof approvalWorkflowSchema>;

export const decideApprovalInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  approvalId: z.string().cuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  approverId: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export type DecideApprovalInput = z.infer<typeof decideApprovalInputSchema>;

export const priceTierSchema = z.object({
  id: z.string().cuid(),
  supplierId: z.string().cuid(),
  productId: z.string().cuid(),
  minQty: z.number().int().min(1),
  maxQty: z.number().int().min(1).optional(),
  unitPriceMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default("AOA"),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PriceTier = z.infer<typeof priceTierSchema>;

export const volumePriceSchema = z.object({
  id: z.string().cuid(),
  supplierId: z.string().cuid(),
  productId: z.string().cuid(),
  minVolume: z.number().int().min(1),
  discountBps: z.number().int().min(0).max(10000),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type VolumePrice = z.infer<typeof volumePriceSchema>;

export const creditAccountSchema = z.object({
  id: z.string().cuid(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  supplierId: z.string().cuid(),
  creditLimitMinor: z.number().int().nonnegative(),
  balanceMinor: z.number().int(),
  currency: z.string().length(3).default("AOA"),
  status: creditStatusEnumSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreditAccount = z.infer<typeof creditAccountSchema>;

export const listRfqsInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  status: rfqStatusEnumSchema.optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type ListRfqsInput = z.infer<typeof listRfqsInputSchema>;

export const listPurchaseOrdersInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  status: poStatusEnumSchema.optional(),
  supplierId: z.string().cuid().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type ListPurchaseOrdersInput = z.infer<
  typeof listPurchaseOrdersInputSchema
>;
