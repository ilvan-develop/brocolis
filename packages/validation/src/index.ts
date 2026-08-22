import { z } from "zod";

const notAPlaceholder = (value: string) =>
  !value.includes("<") && !value.includes("trocar") && value.trim().length > 0;

export const portSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(65535)
  .default(4000);

export const requiredSecretSchema = (label: string) =>
  z
    .string()
    .min(8)
    .refine(
      notAPlaceholder,
      `${label} deve ser trocado (nunca um placeholder)`,
    );

export const urlSchema = (label: string) =>
  z.string().url(`${label} deve ser uma URL válida`);

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production", "staging"])
    .default("development"),
  PORT: portSchema,
  WEB_ORIGIN: urlSchema("WEB_ORIGIN").default("http://localhost:3000"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL obrigatório"),
  REDIS_URL: z
    .string()
    .min(1, "REDIS_URL obrigatório")
    .default("redis://localhost:16379"),
  BETTER_AUTH_SECRET: requiredSecretSchema("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: urlSchema("BETTER_AUTH_URL"),
  FINPAY_MODE: z.enum(["mock", "live"]).default("mock"),
  BROCOLIS_MARKET: z.string().length(2).toUpperCase().default("AO"),
  BROCOLIS_LOCALE: z.string().min(2).default("pt-AO"),
  BROCOLIS_CURRENCY: z.string().length(3).toUpperCase().default("AOA"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(env: object = process.env): Env {
  return envSchema.parse(env);
}
