import { t } from "@brocolis/i18n";
import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Entrar — Brócolis",
};

export default function SignInPage() {
  return (
    <>
      <h2 className="text-lg font-semibold">{t("auth.signin.title")}</h2>
      <SignInForm />
    </>
  );
}
