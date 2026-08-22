import { z } from "zod";
import {
  marketCodeSchema,
  moneySchema,
  organizationIdSchema,
} from "./common.js";

const slugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const listMarketOffersInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  query: z.string().max(100).optional(),
  categoryId: z.string().cuid().optional(),
  prescriptionRequired: z.boolean().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export type ListMarketOffersInput = z.infer<typeof listMarketOffersInputSchema>;

export const categorySchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(120),
  slug: slugSchema,
  parentId: z.string().cuid().optional(),
  active: z.boolean().default(true),
  marketCode: marketCodeSchema,
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type Category = z.infer<typeof categorySchema>;

export const brandSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(120),
  slug: slugSchema,
  logoUrl: z.string().url().optional(),
  createdAt: z.date(),
});

export type Brand = z.infer<typeof brandSchema>;

export const globalProductSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(200),
  dci: z.string().min(1).max(120).optional(),
  dosage: z.string().min(1).max(80).optional(),
  form: z.string().min(1).max(80).optional(),
  manufacturer: z.string().min(1).max(120).optional(),
  brandId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  active: z.boolean().default(true),
  createdAt: z.date(),
});

export type GlobalProduct = z.infer<typeof globalProductSchema>;

export const availabilitySchema = z.enum(["AVAILABLE", "UNAVAILABLE"]);

export type Availability = z.infer<typeof availabilitySchema>;

export const countryProductSchema = z.object({
  id: z.string().cuid(),
  globalProductId: z.string().cuid(),
  countryCode: z.string().length(2).toUpperCase(),
  marketCode: marketCodeSchema,
  name: z.string().min(1).max(200),
  prescriptionRequired: z.boolean().default(false),
  availability: availabilitySchema.default("AVAILABLE"),
  referencePrice: moneySchema.optional(),
  createdAt: z.date(),
});

export type CountryProduct = z.infer<typeof countryProductSchema>;

export const offerStatusSchema = z.enum(["ACTIVE", "INACTIVE", "OUT_OF_STOCK"]);

export type OfferStatus = z.infer<typeof offerStatusSchema>;

export const marketOfferSchema = z.object({
  id: z.string().cuid(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  pharmacyId: z.string().cuid(),
  productId: z.string().cuid(),
  priceMoney: moneySchema,
  stock: z.number().int().min(0),
  prescriptionRequired: z.boolean().default(false),
  status: offerStatusSchema.default("ACTIVE"),
});

export type MarketOffer = z.infer<typeof marketOfferSchema>;

export const searchCatalogInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  query: z.string().max(100).optional(),
  pharmacyId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type SearchCatalogInput = z.infer<typeof searchCatalogInputSchema>;

export { moneySchema, organizationIdSchema } from "./common.js";
