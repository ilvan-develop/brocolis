import { t } from "@brocolis/i18n";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Criar conta — Brócolis",
};

export default function RegisterPage() {
  return (
    <>
      <h2 className="text-lg font-semibold">{t("auth.signup.title")}</h2>
      <RegisterForm />
    </>
  );
}
