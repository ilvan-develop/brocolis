"use client";

import { t } from "@brocolis/i18n";
import { Badge } from "@brocolis/ui/components/badge";
import { Button } from "@brocolis/ui/components/button";
import { Card, CardContent } from "@brocolis/ui/components/card";
import { Input } from "@brocolis/ui/components/input";
import { Label } from "@brocolis/ui/components/label";
import { useState } from "react";
import {
  canProceed,
  createOnboardingState,
  isComplete,
  nextStep,
  ONBOARDING_PORTALS,
  type OnboardingPortalId,
  previousStep,
  selectPortal,
  setInvitees,
  setOrganization,
  stepIndex,
  totalSteps,
} from "@/lib/onboarding";

export default function OnboardingPage() {
  const [state, setState] = useState(() => createOnboardingState());
  const [orgName, setOrgName] = useState("");
  const [inviteText, setInviteText] = useState("");

  const stepNumber = stepIndex(state) + 1;
  const total = totalSteps(state);

  const ready =
    state.step === "organization"
      ? orgName.trim().length > 0
      : canProceed(state);

  function handlePortal(portal: OnboardingPortalId) {
    setState((current) => selectPortal(current, portal));
  }

  function handleContinue() {
    if (state.step === "organization") {
      const type =
        state.portal === "SUPPLIER"
          ? "supplier"
          : state.portal === "BUSINESS"
            ? "business"
            : "pharmacy";
      setState((current) => setOrganization(current, { name: orgName, type }));
    }
    if (state.step === "invite") {
      const emails = inviteText
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);
      setState((current) => setInvitees(current, emails));
    }
    setState((current) => nextStep(current));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Brócolis</h1>
        <Badge>{t("pharmacy.verified")}</Badge>
      </header>

      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-6 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t("onboarding.step")} {stepNumber} {t("onboarding.of")} {total}
            </span>
            <ProgressBar current={stepNumber} total={total} />
          </div>

          {state.step === "portal" && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">
                {t("onboarding.portal.title")}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {ONBOARDING_PORTALS.map((portal) => (
                  <Button
                    key={portal}
                    type="button"
                    variant={state.portal === portal ? "default" : "outline"}
                    onClick={() => handlePortal(portal)}
                  >
                    {portal.toLowerCase()}
                  </Button>
                ))}
              </div>
            </section>
          )}

          {state.step === "organization" && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">
                {t("onboarding.organization.title")}
              </h2>
              <div className="flex flex-col gap-2">
                <Label htmlFor="org-name">
                  {t("onboarding.organization.name")}
                </Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                />
              </div>
              <Badge variant="secondary" className="w-fit">
                {String(state.portal ?? "").toLowerCase()}
              </Badge>
            </section>
          )}

          {state.step === "invite" && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">
                {t("onboarding.invite.title")}
              </h2>
              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-emails">
                  {t("onboarding.invite.placeholder")}
                </Label>
                <Input
                  id="invite-emails"
                  value={inviteText}
                  onChange={(event) => setInviteText(event.target.value)}
                />
              </div>
            </section>
          )}

          {state.step === "done" && (
            <section className="flex flex-col gap-4 text-center">
              <h2 className="text-lg font-semibold">
                {t("onboarding.done.title")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t("onboarding.done.description")}
              </p>
              <Badge className="mx-auto">
                {String(state.portal ?? "").toLowerCase()}
              </Badge>
            </section>
          )}

          {!isComplete(state) && (
            <div className="flex items-center justify-between">
              {stepNumber > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setState((current) => previousStep(current))}
                >
                  {t("onboarding.back")}
                </Button>
              ) : (
                <span />
              )}
              <Button type="button" disabled={!ready} onClick={handleContinue}>
                {t("onboarding.next")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      className="flex gap-1"
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`size-2 rounded-full ${index < current ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}
