import { z } from "zod";

export const organizationIdSchema = z.string().uuid({
  message: "organizationId inválido (UUID esperado)",
});

export const marketCodeSchema = z
  .string()
  .length(2)
  .transform((v) => v.toUpperCase())
  .refine((v) => /^[A-Z]{2}$/.test(v), {
    message: "marketCode inválido (ISO 3166-1 alpha-2 esperado)",
  });

export const moneySchema = z.object({
  amount: z.number().finite().nonnegative(),
  currency: z.string().length(3).toUpperCase(),
});

export type Money = z.infer<typeof moneySchema>;
export type MarketCode = z.infer<typeof marketCodeSchema>;
export type OrganizationId = z.infer<typeof organizationIdSchema>;
