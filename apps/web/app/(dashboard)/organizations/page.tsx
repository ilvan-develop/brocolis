"use client";

import type { Member, MemberRole } from "@brocolis/contracts";
import { type MessageKey, t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import { Button } from "@brocolis/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@brocolis/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@brocolis/ui/components/dialog";
import { Input } from "@brocolis/ui/components/input";
import { Label } from "@brocolis/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@brocolis/ui/components/select";
import { Skeleton } from "@brocolis/ui/components/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/form";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { type InviteInput, inviteSchema } from "@/lib/schemas";

const ROLE_LABEL = {
  OWNER: "roles.owner",
  ADMIN: "roles.admin",
  PHARMACIST: "roles.pharmacist",
  BUYER: "roles.buyer",
  FINANCE: "roles.finance",
  INVENTORY: "roles.inventory",
  VIEWER: "roles.viewer",
} as const satisfies Record<MemberRole, MessageKey>;

const STATUS_LABEL = {
  ACTIVE: "members.status.active",
  INVITED: "members.status.invited",
  SUSPENDED: "members.status.suspended",
  DEACTIVATED: "members.status.suspended",
} as const satisfies Record<string, MessageKey>;

export default function OrganizationsPage() {
  const { state } = useSession();
  const organizationId = state.organization?.id ?? "";
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const form = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { emails: [""] },
  });

  async function loadMembers() {
    setLoading(true);
    setError(null);
    try {
      const list = await api.organizations.listMembers(organizationId);
      setMembers(list);
    } catch {
      setError(t("error.generic"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, [organizationId]);

  async function handleInvite(values: InviteInput) {
    setInviteSuccess(null);
    const email = values.emails[0] ?? "";
    try {
      await api.organizations.inviteMember({
        organizationId,
        email,
        role: "PHARMACIST",
        expiresInDays: 7,
      });
      setInviteSuccess(`${t("members.invite.success")} ${email}`);
      form.reset();
      await loadMembers();
    } catch {
      form.setError("root", { type: "server", message: t("error.generic") });
    }
  }

  const memberRoles = Object.keys(ROLE_LABEL) as MemberRole[];

  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("organizations.title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("members.description")}
        </p>
      </header>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>{t("members.title")}</CardTitle>
            <CardDescription>{t("members.description")}</CardDescription>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>{t("members.invite")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("members.invite")}</DialogTitle>
                <DialogDescription>
                  {t("members.description")}
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit(handleInvite)}
                className="flex flex-col gap-4"
              >
                <FormField
                  control={form.control}
                  name="emails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("members.email")}</FormLabel>
                      <FormControl>
                        <Input
                          id="invite-email"
                          type="email"
                          value={field.value[0] ?? ""}
                          onChange={(event) =>
                            field.onChange([event.target.value])
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="invite-role">{t("members.role")}</Label>
                  <Select value="PHARMACIST" onValueChange={(_value) => {}}>
                    <SelectTrigger id="invite-role">
                      <SelectValue placeholder={t("members.role")} />
                    </SelectTrigger>
                    <SelectContent>
                      {memberRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {t(ROLE_LABEL[role])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {inviteSuccess && (
                  <p role="status" className="text-sm">
                    {inviteSuccess}
                  </p>
                )}
                {form.formState.errors.root?.message && (
                  <p role="alert" className="text-destructive text-sm">
                    {form.formState.errors.root.message}
                  </p>
                )}
                <DialogFooter>
                  <Button type="submit">{t("members.invite.submit")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2" aria-busy="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : error !== null ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : members.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("members.empty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="py-2 pr-4 font-medium">
                    {t("members.email")}
                  </th>
                  <th className="py-2 pr-4 font-medium">{t("members.role")}</th>
                  <th className="py-2 font-medium">{t("members.status")}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId} className="border-b last:border-0">
                    <td className="py-2 pr-4">{member.userId}</td>
                    <td className="py-2 pr-4">{t(ROLE_LABEL[member.role])}</td>
                    <td className="py-2">
                      <Badge variant="secondary">
                        {t(
                          STATUS_LABEL[member.status] ??
                            "members.status.invited",
                        )}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
