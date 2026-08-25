"use client";

import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import { Input } from "@brocolis/ui/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import { type ApiClient, api as defaultApi } from "@/lib/api";
import { type SignInInput, signInSchema } from "@/lib/schemas";

type SignInFormProps = {
  onSubmit?: (values: SignInInput) => Promise<void>;
  api?: ApiClient;
};

export function SignInForm({ onSubmit, api = defaultApi }: SignInFormProps) {
  const router = useRouter();
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function handleSubmit(values: SignInInput) {
    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        await api.auth.signIn(values);
        router.push("/");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      form.setError("root", {
        type: "server",
        message: message || t("error.generic"),
      });
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="signin-email">
              {t("auth.signin.email")}
            </FormLabel>
            <FormControl>
              <Input
                id="signin-email"
                type="email"
                autoComplete="email"
                {...field}
                aria-invalid={!!form.formState.errors.email}
                aria-describedby={
                  form.formState.errors.email ? "signin-email-error" : undefined
                }
              />
            </FormControl>
            <FormMessage id="signin-email-error" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="signin-password">
              {t("auth.signin.password")}
            </FormLabel>
            <FormControl>
              <Input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                {...field}
                aria-invalid={!!form.formState.errors.password}
                aria-describedby={
                  form.formState.errors.password
                    ? "signin-password-error"
                    : undefined
                }
              />
            </FormControl>
            <FormMessage id="signin-password-error" />
          </FormItem>
        )}
      />

      {form.formState.errors.root?.message && (
        <p role="alert" className="text-destructive text-sm">
          {form.formState.errors.root.message}
        </p>
      )}

      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full"
      >
        {form.formState.isSubmitting ? "..." : t("auth.signin.submit")}
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
