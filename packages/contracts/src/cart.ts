import { z } from "zod";
import {
  marketCodeSchema,
  moneySchema,
  organizationIdSchema,
} from "./common.js";

export const cartItemInputSchema = z.object({
  productId: z.string().cuid(),
  pharmacyId: z.string().cuid(),
  quantity: z.number().int().min(1).max(999),
});

export type CartItemInput = z.infer<typeof cartItemInputSchema>;

export const cartItemSchema = cartItemInputSchema.extend({
  unitPrice: moneySchema,
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const addToCartInputSchema = cartItemInputSchema.extend({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
});

export type AddToCartInput = z.infer<typeof addToCartInputSchema>;

export const updateCartItemInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  productId: z.string().cuid(),
  pharmacyId: z.string().cuid(),
  quantity: z.number().int().min(1).max(999),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;

export const removeCartItemInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  productId: z.string().cuid(),
  pharmacyId: z.string().cuid(),
});

export type RemoveCartItemInput = z.infer<typeof removeCartItemInputSchema>;

export const getCartInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
});

export type GetCartInput = z.infer<typeof getCartInputSchema>;

export const cartSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().min(1).max(256),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  items: z.array(cartItemSchema),
  subtotal: moneySchema,
  itemCount: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Cart = z.infer<typeof cartSchema>;
