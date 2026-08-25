import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "auth.error.required")
    .email("auth.error.invalidEmail"),
  password: z.string().min(1, "auth.error.required"),
});

export const signUpSchema = z
  .object({
    name: z.string().min(2, "auth.error.required"),
    email: z
      .string()
      .min(1, "auth.error.required")
      .email("auth.error.invalidEmail"),
    password: z.string().min(8, "auth.error.passwordShort"),
    confirmPassword: z.string().min(1, "auth.error.required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.error.passwordMismatch",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "auth.error.required")
    .email("auth.error.invalidEmail"),
});

export const inviteSchema = z.object({
  emails: z
    .array(z.string().email("auth.error.invalidEmail"))
    .min(1, "auth.error.required"),
});

export const settingsSchema = z.object({
  name: z.string().min(1, "auth.error.required"),
  email: z.string().email("auth.error.invalidEmail"),
  phone: z.string().min(1, "auth.error.required"),
  hours: z.string().optional(),
  deliveryRadius: z.string().optional(),
  baseFee: z.string().optional(),
});

export const checkoutClientSchema = z.object({
  name: z.string().min(1, "auth.error.required"),
  phone: z.string().min(1, "auth.error.required"),
});

export const checkoutDeliverySchema = z.object({
  street: z.string().min(1, "auth.error.required"),
  houseNumber: z.string().min(1, "auth.error.required"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type CheckoutClientInput = z.infer<typeof checkoutClientSchema>;
export type CheckoutDeliveryInput = z.infer<typeof checkoutDeliverySchema>;
