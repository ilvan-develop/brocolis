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
import { type SignUpInput, signUpSchema } from "@/lib/schemas";

type RegisterFormProps = {
  onSubmit?: (values: SignUpInput) => Promise<void>;
  api?: ApiClient;
  marketCode?: string;
};

export function RegisterForm({
  onSubmit,
  api = defaultApi,
  marketCode = "AO",
}: RegisterFormProps) {
  const router = useRouter();
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function handleSubmit(values: SignUpInput) {
    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        await api.auth.signUp({
          name: values.name,
          email: values.email,
          password: values.password,
          marketCode,
        });
        router.push("/verify-email");
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
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="signup-name">{t("auth.signup.name")}</FormLabel>
            <FormControl>
              <Input id="signup-name" autoComplete="name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="signup-email">
              {t("auth.signup.email")}
            </FormLabel>
            <FormControl>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="signup-password">
              {t("auth.signup.password")}
            </FormLabel>
            <FormControl>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("auth.signup.confirm")}</FormLabel>
            <FormControl>
              <Input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                {...field}
              />
            </FormControl>
            <FormMessage />
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
        {form.formState.isSubmitting ? "..." : t("auth.signup.submit")}
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
