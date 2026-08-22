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
  type SignInValues,
  type ValidationErrorKey,
  type ValidationField,
  validateSignIn,
} from "@/lib/validation";

type SignInFormProps = {
  onSubmit?: (values: SignInValues) => Promise<void>;
  api?: ApiClient;
};

export function SignInForm({ onSubmit, api = defaultApi }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<ValidationField, ValidationErrorKey>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values: SignInValues = { email, password };
    const result = validateSignIn(values);
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
        await api.auth.signIn(values);
        router.push("/");
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
        <Label htmlFor="signin-email">{t("auth.signin.email")}</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={errors.email !== undefined}
          aria-describedby={errors.email ? "signin-email-error" : undefined}
        />
        {errors.email !== undefined && (
          <p id="signin-email-error" className="text-destructive text-sm">
            {t(errors.email)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="signin-password">{t("auth.signin.password")}</Label>
        <Input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={errors.password !== undefined}
          aria-describedby={
            errors.password ? "signin-password-error" : undefined
          }
        />
        {errors.password !== undefined && (
          <p id="signin-password-error" className="text-destructive text-sm">
            {t(errors.password)}
          </p>
        )}
      </div>

      {serverError !== null && (
        <p role="alert" className="text-destructive text-sm">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {t("auth.signin.submit")}
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm">
        <Link
          href="/forgot-password"
          className="text-primary underline-offset-4 hover:underline"
        >
          {t("auth.signin.forgot")}
        </Link>
        <p className="text-muted-foreground">
          {t("auth.signin.noaccount")}{" "}
          <Link
            href="/register"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("auth.signin.linksignup")}
          </Link>
        </p>
      </div>
    </form>
  );
}
