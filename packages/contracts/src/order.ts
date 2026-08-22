import { z } from "zod";
import {
  marketCodeSchema,
  moneySchema,
  organizationIdSchema,
} from "./common.js";

export const orderStatusEnumSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELED",
]);

export type OrderStatus = z.infer<typeof orderStatusEnumSchema>;

export const orderItemCreateSchema = z.object({
  productId: z.string().cuid(),
  pharmacyId: z.string().cuid(),
  quantity: z.number().int().min(1).max(999),
});

export type OrderItemCreate = z.infer<typeof orderItemCreateSchema>;

export const orderItemSchema = orderItemCreateSchema.extend({
  unitPrice: moneySchema,
  lineTotal: moneySchema,
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const orderTotalsSchema = z.object({
  subtotal: moneySchema,
  deliveryFee: moneySchema,
  vat: moneySchema,
  discount: moneySchema.optional(),
  total: moneySchema,
});

export type OrderTotals = z.infer<typeof orderTotalsSchema>;

export const deliveryAddressSchema = z.object({
  zone: z.string().min(1).max(40),
  addressLine: z.string().min(1).max(200),
  city: z.string().min(1).max(80).optional(),
  referencePoint: z.string().max(200).optional(),
});

export type DeliveryAddress = z.infer<typeof deliveryAddressSchema>;

export const orderSchema = z.object({
  id: z.string().cuid(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  customerId: z.string().min(1).max(200).optional(),
  items: z.array(orderItemSchema).min(1),
  totals: orderTotalsSchema,
  status: orderStatusEnumSchema,
  idempotencyKey: z.string().min(8).max(128).optional(),
  deliveryAddress: deliveryAddressSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof orderSchema>;

export const createOrderInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  customerId: z.string().min(1).max(200).optional(),
  items: z.array(orderItemCreateSchema).min(1),
  deliveryAddress: deliveryAddressSchema.optional(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const getOrderInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  orderId: z.string().cuid(),
});

export type GetOrderInput = z.infer<typeof getOrderInputSchema>;

export const listOrdersInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type ListOrdersInput = z.infer<typeof listOrdersInputSchema>;

export const orderStatusHistorySchema = z.object({
  id: z.string().cuid(),
  orderId: z.string().cuid(),
  from: orderStatusEnumSchema.optional(),
  to: orderStatusEnumSchema,
  note: z.string().max(500).optional(),
  createdAt: z.date(),
});

export type OrderStatusHistory = z.infer<typeof orderStatusHistorySchema>;
