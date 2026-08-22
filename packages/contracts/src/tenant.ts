import { z } from "zod";
import { marketCodeSchema, organizationIdSchema } from "./common.js";

export const orgStatusSchema = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "PENDING",
  "CLOSED",
]);

export type OrgStatus = z.infer<typeof orgStatusSchema>;

export const membershipStatusSchema = z.enum([
  "ACTIVE",
  "INVITED",
  "SUSPENDED",
  "DEACTIVATED",
]);

export type MembershipStatus = z.infer<typeof membershipStatusSchema>;

export const invitationStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
]);

export type InvitationStatus = z.infer<typeof invitationStatusSchema>;

export const memberRoleSchema = z.enum([
  "OWNER",
  "ADMIN",
  "PHARMACIST",
  "BUYER",
  "FINANCE",
  "INVENTORY",
  "VIEWER",
]);

export type MemberRole = z.infer<typeof memberRoleSchema>;

export const organizationSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: orgStatusSchema,
  marketCode: marketCodeSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Organization = z.infer<typeof organizationSchema>;

export const memberSchema = z.object({
  organizationId: organizationIdSchema,
  userId: z.string().cuid(),
  role: memberRoleSchema,
  status: membershipStatusSchema,
  createdAt: z.date(),
});

export type Member = z.infer<typeof memberSchema>;

export const invitationSchema = z.object({
  id: z.string().cuid(),
  organizationId: organizationIdSchema,
  email: z.string().email(),
  role: memberRoleSchema,
  status: invitationStatusSchema,
  expiresAt: z.date(),
  createdAt: z.date(),
});

export type Invitation = z.infer<typeof invitationSchema>;

export const inviteMemberInputSchema = z.object({
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
  email: z.string().email(),
  role: memberRoleSchema,
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export type InviteMemberInput = z.infer<typeof inviteMemberInputSchema>;

export const acceptInvitationInputSchema = z.object({
  token: z.string().min(16),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationInputSchema>;

export const organizationSwitcherInputSchema = z.object({
  userId: z.string().cuid(),
  organizationId: organizationIdSchema,
  marketCode: marketCodeSchema,
});

export type OrganizationSwitcherInput = z.infer<
  typeof organizationSwitcherInputSchema
>;
