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
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { validateEmailOnly } from "@/lib/validation";

type SettingsForm = {
  name: string;
  email: string;
  phone: string;
};

export default function PharmacySettingsPage() {
  const { state } = useSession();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<SettingsForm>({
    name: "",
    email: "",
    phone: "",
  });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    if (state.organization) {
      setForm({
        name: state.organization.name,
        email: state.user?.email ?? "",
        phone: "",
      });
    }
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  });

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
    toast.success("Settings saved successfully");
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
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  disabled={!editing}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  disabled={!editing}
                />
              </div>
              {error !== null && (
                <p role="alert" className="text-destructive text-sm">
                  {error}
                </p>
              )}
              {editing && (
                <Button onClick={handleSave} className="w-full">
                  Save
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
