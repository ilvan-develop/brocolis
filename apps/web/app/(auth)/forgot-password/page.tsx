"use client";

import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import { Input } from "@brocolis/ui/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import { api } from "@/lib/api";
import { type ForgotPasswordInput, forgotPasswordSchema } from "@/lib/schemas";

export default function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(values: ForgotPasswordInput) {
    try {
      await api.auth.requestPasswordReset(values.email);
      setSent(true);
    } catch {
      setServerError(t("error.generic"));
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
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex w-full flex-col gap-4"
          noValidate
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.signin.email")}</FormLabel>
                <FormControl>
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {serverError && (
            <p role="alert" className="text-destructive text-sm">
              {serverError}
            </p>
          )}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting ? "..." : t("auth.forgot.submit")}
          </Button>
        </form>
      )}
    </div>
  );
}
