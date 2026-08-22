"use client";

import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import { Input } from "@brocolis/ui/components/input";
import { Label } from "@brocolis/ui/components/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { type ApiClient, api as defaultApi } from "@/lib/api";
import {
  type SignUpValues,
  type ValidationErrorKey,
  type ValidationField,
  validateSignUp,
} from "@/lib/validation";

type RegisterFormProps = {
  onSubmit?: (values: SignUpValues) => Promise<void>;
  api?: ApiClient;
};

export function RegisterForm({
  onSubmit,
  api = defaultApi,
}: RegisterFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<ValidationField, ValidationErrorKey>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values: SignUpValues = { name, email, password, confirmPassword };
    const result = validateSignUp(values);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setServerError(null);
    setSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        await api.auth.signUp({
          name,
          email,
          password,
          marketCode: "AO",
        });
        router.push("/verify-email");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setServerError(message || t("error.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-name">{t("auth.signup.name")}</Label>
        <Input
          id="signup-name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name !== undefined}
          aria-describedby={errors.name ? "signup-name-error" : undefined}
        />
        {errors.name !== undefined && (
          <p id="signup-name-error" className="text-destructive text-sm">
            {t(errors.name)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-email">{t("auth.signup.email")}</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={errors.email !== undefined}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
        />
        {errors.email !== undefined && (
          <p id="signup-email-error" className="text-destructive text-sm">
            {t(errors.email)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-password">{t("auth.signup.password")}</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={errors.password !== undefined}
          aria-describedby={
            errors.password ? "signup-password-error" : undefined
          }
        />
        {errors.password !== undefined && (
          <p id="signup-password-error" className="text-destructive text-sm">
            {t(errors.password)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signup-confirm">{t("auth.signup.confirm")}</Label>
        <Input
          id="signup-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          aria-invalid={errors.confirm !== undefined}
          aria-describedby={errors.confirm ? "signup-confirm-error" : undefined}
        />
        {errors.confirm !== undefined && (
          <p id="signup-confirm-error" className="text-destructive text-sm">
            {t(errors.confirm)}
          </p>
        )}
      </div>

      {serverError !== null && (
        <p role="alert" className="text-destructive text-sm">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {t("auth.signup.submit")}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {t("auth.signup.haveaccount")}{" "}
        <Link
          href="/sign-in"
          className="text-primary underline-offset-4 hover:underline"
        >
          {t("auth.signup.linksignin")}
        </Link>
      </p>
    </form>
  );
}
