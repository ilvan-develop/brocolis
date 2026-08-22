"use client";

import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import { Input } from "@brocolis/ui/components/input";
import { Label } from "@brocolis/ui/components/label";
import { type FormEvent, useState } from "react";
import { type DeliveryData, isValidDelivery } from "@/lib/checkout";

type StepDeliveryProps = {
  values: DeliveryData | null;
  onCommit: (data: DeliveryData) => void;
};

export function StepDelivery({ values, onCommit }: StepDeliveryProps) {
  const [zone, setZone] = useState(values?.zone ?? "urban");
  const [street, setStreet] = useState(values?.street ?? "");
  const [houseNumber, setHouseNumber] = useState(values?.houseNumber ?? "");
  const [city, setCity] = useState(values?.city ?? "");
  const [referencePoint, setReferencePoint] = useState(
    values?.referencePoint ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate: DeliveryData = {
      zone,
      street: street.trim(),
      houseNumber: houseNumber.trim(),
      ...(city.trim().length > 0 ? { city: city.trim() } : {}),
      ...(referencePoint.trim().length > 0
        ? { referencePoint: referencePoint.trim() }
        : {}),
    };
    if (!isValidDelivery(candidate)) {
      setError(t("auth.error.required"));
      return;
    }
    onCommit(candidate);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <h2 className="text-lg font-semibold">{t("delivery.title")}</h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="checkout-zone">{t("delivery.zone.label")}</Label>
        <select
          id="checkout-zone"
          value={zone}
          onChange={(event) => setZone(event.target.value)}
          className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-base shadow-xs outline-none md:text-sm"
        >
          <option value="urban">{t("delivery.zone.urban")}</option>
          <option value="suburban">{t("delivery.zone.suburban")}</option>
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="checkout-street">{t("delivery.address.street")}</Label>
        <Input
          id="checkout-street"
          autoComplete="street-address"
          value={street}
          onChange={(event) => setStreet(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="checkout-house-number">
          {t("delivery.address.houseNumber")}
        </Label>
        <Input
          id="checkout-house-number"
          value={houseNumber}
          onChange={(event) => setHouseNumber(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="checkout-city">{t("delivery.address.city")}</Label>
        <Input
          id="checkout-city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="checkout-reference">
          {t("delivery.address.referencePoint")}
        </Label>
        <Input
          id="checkout-reference"
          value={referencePoint}
          onChange={(event) => setReferencePoint(event.target.value)}
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
