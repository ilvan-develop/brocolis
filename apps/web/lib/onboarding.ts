export type OnboardingPortalId =
  | "CONSUMER"
  | "PHARMACY"
  | "SUPPLIER"
  | "BUSINESS";

export type OnboardingStepId = "portal" | "organization" | "invite" | "done";

export type OrganizationType = "pharmacy" | "supplier" | "business";

export const ONBOARDING_PORTALS: readonly OnboardingPortalId[] = [
  "CONSUMER",
  "PHARMACY",
  "SUPPLIER",
  "BUSINESS",
];

const FULL_STEPS: readonly [
  OnboardingStepId,
  OnboardingStepId,
  OnboardingStepId,
  OnboardingStepId,
] = ["portal", "organization", "invite", "done"];

const CONSUMER_STEPS: readonly [OnboardingStepId, OnboardingStepId] = [
  "portal",
  "done",
];

export function stepsForPortal(
  portal: OnboardingPortalId,
): readonly OnboardingStepId[] {
  if (portal === "CONSUMER") {
    return CONSUMER_STEPS;
  }
  return FULL_STEPS;
}

export const ORGANIZATION_TYPES: Record<
  Exclude<OnboardingPortalId, "CONSUMER">,
  readonly OrganizationType[]
> = {
  PHARMACY: ["pharmacy"],
  SUPPLIER: ["supplier"],
  BUSINESS: ["business"],
};

export type OnboardingState = {
  portal: OnboardingPortalId | null;
  step: OnboardingStepId;
  organizationName: string;
  organizationType: OrganizationType | null;
  invitedEmails: string[];
};

export function createOnboardingState(): OnboardingState {
  return {
    portal: null,
    step: "portal",
    organizationName: "",
    organizationType: null,
    invitedEmails: [],
  };
}

function nextStepId(
  current: OnboardingStepId,
  steps: readonly OnboardingStepId[],
): OnboardingStepId {
  const index = steps.indexOf(current);
  const next = steps[index + 1];
  return next ?? current;
}

export function selectPortal(
  state: OnboardingState,
  portal: OnboardingPortalId,
): OnboardingState {
  return { ...state, portal };
}

export function setOrganization(
  state: OnboardingState,
  input: { name: string; type: OrganizationType },
): OnboardingState {
  return {
    ...state,
    organizationName: input.name.trim(),
    organizationType: input.type,
  };
}

export function setInvitees(
  state: OnboardingState,
  emails: readonly string[],
): OnboardingState {
  return { ...state, invitedEmails: [...emails] };
}

export function canProceed(state: OnboardingState): boolean {
  if (state.step === "portal") {
    return state.portal !== null;
  }
  if (state.step === "organization") {
    return (
      state.portal !== null &&
      state.portal !== "CONSUMER" &&
      state.organizationName.length > 0 &&
      state.organizationType !== null
    );
  }
  if (state.step === "invite") {
    return state.portal !== null && state.organizationName.length > 0;
  }
  return false;
}

export function nextStep(state: OnboardingState): OnboardingState {
  if (state.portal === null || !canProceed(state)) {
    return { ...state };
  }
  const steps = stepsForPortal(state.portal);
  return { ...state, step: nextStepId(state.step, steps) };
}

export function stepIndex(state: OnboardingState): number {
  const steps = stepsForPortal(state.portal ?? "PHARMACY");
  return steps.indexOf(state.step);
}

export function totalSteps(state: OnboardingState): number {
  return stepsForPortal(state.portal ?? "PHARMACY").length;
}

export function isComplete(state: OnboardingState): boolean {
  return state.step === "done";
}
