"use client";

import { t } from "@brocolis/i18n";
import { Button } from "@brocolis/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import { Input } from "@brocolis/ui/components/input";
import { Label } from "@brocolis/ui/components/label";
import { Separator } from "@brocolis/ui/components/separator";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import { validateEmailOnly } from "@/lib/validation";

type SettingsForm = {
  name: string;
  email: string;
  phone: string;
  hours: string;
  deliveryRadius: string;
  baseFee: string;
};

const INITIAL_SETTINGS: SettingsForm = {
  name: "Farmácia Mucuio",
  email: "geral@farmanciamucuio.co.ao",
  phone: "923 456 789",
  hours: "",
  deliveryRadius: "10",
  baseFee: "1500",
};

export default function PharmacySettingsPage() {
  const loading = useSimulatedLoad();
  const [form, setForm] = useState<SettingsForm>(INITIAL_SETTINGS);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof SettingsForm, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function handleSave() {
    if (form.name.trim().length === 0 || form.phone.trim().length === 0) {
      setError(t("auth.error.required"));
      return;
    }
    const email = validateEmailOnly(form.email);
    if (!email.valid) {
      setError(t("auth.error.invalidEmail"));
      return;
    }
    setError(null);
    setEditing(false);
    toast.success(t("pharmacy.settings.saved"));
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-semibold tracking-tight text-2xl">
          {t("pharmacy.settings.title")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("pharmacy.settings.subtitle")}
        </p>
      </header>

      <Card className="max-w-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>{t("pharmacy.settings.title")}</CardTitle>
            <CardDescription>{t("pharmacy.settings.subtitle")}</CardDescription>
          </div>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              {t("pharmacy.settings.edit")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {(
                [
                  {
                    key: "name",
                    label: "pharmacy.settings.name",
                    type: "text",
                  },
                  {
                    key: "email",
                    label: "pharmacy.settings.email",
                    type: "email",
                  },
                  {
                    key: "phone",
                    label: "pharmacy.settings.phone",
                    type: "tel",
                  },
                ] as const
              ).map((field) => (
                <div key={field.key} className="flex flex-col gap-2">
                  <Label htmlFor={`settings-${field.key}`}>
                    {t(field.label)}
                  </Label>
                  {editing ? (
                    <Input
                      id={`settings-${field.key}`}
                      type={field.type}
                      value={form[field.key]}
                      onChange={(event) =>
                        update(field.key, event.target.value)
                      }
                    />
                  ) : (
                    <p className="border-input bg-background flex h-9 w-full items-center rounded-md border px-3 text-sm">
                      {form[field.key]}
                    </p>
                  )}
                </div>
              ))}

              <Separator />

              <div className="flex flex-col gap-2">
                <Label htmlFor="settings-hours">
                  {t("pharmacy.settings.hours")}
                </Label>
                {editing ? (
                  <Input
                    id="settings-hours"
                    type="text"
                    value={form.hours}
                    placeholder={t("pharmacy.settings.hours.placeholder")}
                    onChange={(event) => update("hours", event.target.value)}
                  />
                ) : (
                  <p className="border-input bg-background flex h-9 w-full items-center rounded-md border px-3 text-sm">
                    {form.hours.length > 0
                      ? form.hours
                      : t("pharmacy.settings.hours.placeholder")}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-radius">
                    {t("pharmacy.settings.deliveryRadius")}
                  </Label>
                  {editing ? (
                    <Input
                      id="settings-radius"
                      type="number"
                      min="0"
                      value={form.deliveryRadius}
                      onChange={(event) =>
                        update("deliveryRadius", event.target.value)
                      }
                    />
                  ) : (
                    <p className="border-input bg-background flex h-9 w-full items-center rounded-md border px-3 text-sm">
                      {form.deliveryRadius} km
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-base-fee">
                    {t("pharmacy.settings.baseFee")}
                  </Label>
                  {editing ? (
                    <Input
                      id="settings-base-fee"
                      type="number"
                      min="0"
                      value={form.baseFee}
                      onChange={(event) =>
                        update("baseFee", event.target.value)
                      }
                    />
                  ) : (
                    <p className="border-input bg-background flex h-9 w-full items-center rounded-md border px-3 text-sm">
                      {form.baseFee} Kz
                    </p>
                  )}
                </div>
              </div>

              {error !== null && (
                <p role="alert" className="text-destructive text-sm">
                  {error}
                </p>
              )}

              {editing && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForm(INITIAL_SETTINGS);
                      setError(null);
                      setEditing(false);
                    }}
                  >
                    {t("pharmacy.settings.cancel")}
                  </Button>
                  <Button onClick={handleSave}>
                    {t("pharmacy.settings.save")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
