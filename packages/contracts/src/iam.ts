import { z } from "zod";
import { marketCodeSchema, organizationIdSchema } from "./common.js";

export const portalSchema = z.enum([
  "CONSUMER",
  "PHARMACY",
  "SUPPLIER",
  "BUSINESS",
  "PLATFORM",
]);

export type Portal = z.infer<typeof portalSchema>;

export const userStatusSchema = z.enum([
  "ACTIVE",
  "PENDING",
  "SUSPENDED",
  "DEACTIVATED",
]);

export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1).max(120),
  emailVerified: z.boolean().default(false),
  status: userStatusSchema.default("PENDING"),
  marketCode: marketCodeSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

export const sessionSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  token: z.string().regex(/^[0-9a-f]{64}$/),
  expiresAt: z.date(),
  idleTimeoutMinutes: z.number().int().min(1).max(1440).default(30),
  createdAt: z.date(),
});

export type Session = z.infer<typeof sessionSchema>;

export const signUpInputSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  marketCode: marketCodeSchema,
});

export type SignUpInput = z.infer<typeof signUpInputSchema>;

export const signInInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export type SignInInput = z.infer<typeof signInInputSchema>;

export const verifyEmailInputSchema = z.object({
  token: z.string().min(16),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;

export const sessionInfoSchema = z.object({
  userId: z.string().cuid(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  portal: portalSchema,
  roles: z.array(z.string().min(1)).min(1),
});

export type SessionInfo = z.infer<typeof sessionInfoSchema>;
