import { describe, expect, it } from "vitest";
import {
  canProceed,
  createOnboardingState,
  isComplete,
  nextStep,
  ONBOARDING_PORTALS,
  selectPortal,
  setInvitees,
  setOrganization,
  stepIndex,
  stepsForPortal,
  totalSteps,
} from "./onboarding";

describe("onboarding — steps por portal", () => {
  it("lista os 4 portais suportados", () => {
    expect(ONBOARDING_PORTALS).toEqual([
      "CONSUMER",
      "PHARMACY",
      "SUPPLIER",
      "BUSINESS",
    ]);
  });

  it("consumidor salta a criação de organização e convites", () => {
    expect(stepsForPortal("CONSUMER")).toEqual(["portal", "done"]);
  });

  it("portais de organização percorrem 4 passos", () => {
    expect(stepsForPortal("PHARMACY")).toEqual([
      "portal",
      "organization",
      "invite",
      "done",
    ]);
    expect(stepsForPortal("SUPPLIER")).toHaveLength(4);
    expect(stepsForPortal("BUSINESS")).toHaveLength(4);
  });
});

describe("onboarding — máquina de estados", () => {
  it("inicia na seleção de portal sem poder avançar", () => {
    const state = createOnboardingState();
    expect(state.step).toBe("portal");
    expect(canProceed(state)).toBe(false);
  });

  it("total de passos depende do portal escolhido", () => {
    const consumer = selectPortal(createOnboardingState(), "CONSUMER");
    const pharmacy = selectPortal(createOnboardingState(), "PHARMACY");
    expect(totalSteps(consumer)).toBe(2);
    expect(totalSteps(pharmacy)).toBe(4);
  });

  it("selecionar portal permite avançar", () => {
    const state = selectPortal(createOnboardingState(), "PHARMACY");
    expect(canProceed(state)).toBe(true);
  });

  it("consumidor avança de portal direto para done", () => {
    const state = selectPortal(createOnboardingState(), "CONSUMER");
    const advanced = nextStep(state);
    expect(advanced.step).toBe("done");
    expect(isComplete(advanced)).toBe(true);
  });

  it("farmácia não avança dos dados da organização sem os preencher", () => {
    let state = selectPortal(createOnboardingState(), "PHARMACY");
    state = nextStep(state);
    expect(state.step).toBe("organization");
    const stuck = nextStep(state);
    expect(stuck.step).toBe("organization");
    expect(canProceed(stuck)).toBe(false);
  });

  it("preencher a organização permite avançar para convites", () => {
    let state = selectPortal(createOnboardingState(), "PHARMACY");
    state = setOrganization(state, {
      name: "Farmácia Luanda",
      type: "pharmacy",
    });
    expect(stepIndex(state)).toBe(0);
    state = nextStep(state);
    expect(state.step).toBe("organization");
    expect(canProceed(state)).toBe(true);
  });

  it("anexa emails de convidados", () => {
    let state = selectPortal(createOnboardingState(), "BUSINESS");
    state = setOrganization(state, { name: "Clínica Belas", type: "business" });
    state = nextStep(state);
    state = setInvitees(state, ["a@example.com", "b@example.com"]);
    expect(state.invitedEmails).toEqual(["a@example.com", "b@example.com"]);
  });

  it("chega a done após os convites para portais de organização", () => {
    let state = selectPortal(createOnboardingState(), "SUPPLIER");
    state = setOrganization(state, {
      name: "Distribuidora KZ",
      type: "supplier",
    });
    state = nextStep(state);
    state = nextStep(state);
    expect(state.step).toBe("invite");
    state = nextStep(state);
    expect(isComplete(state)).toBe(true);
    const stuck = nextStep(state);
    expect(stuck.step).toBe("done");
  });

  it("mantém o estado imutável quando não pode avançar", () => {
    const state = createOnboardingState();
    const advanced = nextStep(state);
    expect(advanced).toEqual(state);
    expect(advanced).not.toBe(state);
  });
});
