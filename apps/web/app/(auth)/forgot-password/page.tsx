"use client";

import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import { Input } from "@brocolis/ui/components/input";
import { Label } from "@brocolis/ui/components/label";
import { type FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { validateEmailOnly } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateEmailOnly(email);
    if (!result.valid) {
      setError(
        result.errors.email === undefined ? null : t(result.errors.email),
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.auth.requestPasswordReset(email);
      setSent(true);
    } catch {
      setError(t("error.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h2 className="text-lg font-semibold">{t("auth.forgot.title")}</h2>
      <p className="text-muted-foreground text-sm">
        {t("auth.forgot.description")}
      </p>
      {sent ? (
        <p className="text-sm">{t("auth.forgot.sent")}</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-2 text-left">
            <Label htmlFor="forgot-email">{t("auth.signin.email")}</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error !== null}
              aria-describedby={
                error !== null ? "forgot-email-error" : undefined
              }
            />
            {error !== null && (
              <p id="forgot-email-error" className="text-destructive text-sm">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {t("auth.forgot.submit")}
          </Button>
        </form>
      )}
    </div>
  );
}
