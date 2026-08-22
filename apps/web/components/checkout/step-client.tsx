"use client";

import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import { Input } from "@brocolis/ui/components/input";
import { Label } from "@brocolis/ui/components/label";
import { type FormEvent, useState } from "react";
import { type ClientData, isValidClient } from "@/lib/checkout";

type StepClientProps = {
  values: ClientData | null;
  onCommit: (data: ClientData) => void;
};

export function StepClient({ values, onCommit }: StepClientProps) {
  const [fullName, setFullName] = useState(values?.fullName ?? "");
  const [phone, setPhone] = useState(values?.phone ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate: ClientData = {
      fullName: fullName.trim(),
      phone: phone.trim(),
    };
    if (!isValidClient(candidate)) {
      setError(t("auth.error.required"));
      return;
    }
    onCommit(candidate);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <h2 className="text-lg font-semibold">{t("checkout.client.title")}</h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="checkout-name">{t("checkout.client.name")}</Label>
        <Input
          id="checkout-name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="checkout-phone">{t("checkout.client.phone")}</Label>
        <Input
          id="checkout-phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      {error !== null && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full">
        {t("checkout.continue")}
      </Button>
    </form>
  );
}
