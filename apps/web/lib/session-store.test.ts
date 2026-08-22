import { describe, expect, it } from "vitest";
import {
  createInitialSessionState,
  type SessionAction,
  sessionReducer,
} from "./session-store";

const org = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Farmácia Luanda",
  slug: "farmacia-luanda",
  status: "ACTIVE" as const,
  marketCode: "AO",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const otherOrg = {
  ...org,
  id: "00000000-0000-4000-8000-000000000002",
  name: "Clínica Belas",
  slug: "clinica-belas",
};

const user = {
  id: "c1234567890abcdefghijkl",
  email: "ana@example.com",
  name: "Ana",
  emailVerified: true,
  marketCode: "AO",
};

describe("session-store — reducer", () => {
  it("começa anónima e sem organização", () => {
    const state = createInitialSessionState();
    expect(state.status).toBe("anonymous");
    expect(state.organization).toBeNull();
    expect(state.organizations).toEqual([]);
    expect(state.user).toBeNull();
  });

  it("HYDRATE_START marca como loading", () => {
    const next = sessionReducer(createInitialSessionState(), {
      type: "HYDRATE_START",
    });
    expect(next.status).toBe("loading");
    expect(next.error).toBeNull();
  });

  it("HYDRATE_SUCCESS autentica com dados", () => {
    const next = sessionReducer(createInitialSessionState(), {
      type: "HYDRATE_SUCCESS",
      payload: {
        user,
        organization: org,
        organizations: [org, otherOrg],
        portal: "PHARMACY",
        roles: ["OWNER"],
        marketCode: "AO",
      },
    });
    expect(next.status).toBe("authenticated");
    expect(next.user?.email).toBe("ana@example.com");
    expect(next.organization?.name).toBe("Farmácia Luanda");
    expect(next.organizations).toHaveLength(2);
    expect(next.roles).toEqual(["OWNER"]);
  });

  it("SWITCH_ORGANIZATION troca a organização ativa e os papéis", () => {
    const hydrated = sessionReducer(createInitialSessionState(), {
      type: "HYDRATE_SUCCESS",
      payload: {
        user,
        organization: org,
        organizations: [org, otherOrg],
        portal: "PHARMACY",
        roles: ["OWNER"],
        marketCode: "AO",
      },
    });
    const switched = sessionReducer(hydrated, {
      type: "SWITCH_ORGANIZATION",
      payload: {
        organization: otherOrg,
        portal: "BUSINESS",
        roles: ["BUYER"],
        marketCode: "AO",
      },
    });
    expect(switched.status).toBe("authenticated");
    expect(switched.organization?.name).toBe("Clínica Belas");
    expect(switched.portal).toBe("BUSINESS");
    expect(switched.roles).toEqual(["BUYER"]);
    expect(switched.organizations).toHaveLength(2);
  });

  it("HYDRATE_ERROR regista erro e marca como error", () => {
    const next = sessionReducer(createInitialSessionState(), {
      type: "HYDRATE_ERROR",
      error: "fetch falhou",
    });
    expect(next.status).toBe("error");
    expect(next.error).toBe("fetch falhou");
  });

  it("SIGN_OUT limpa a sessão", () => {
    const hydrated = sessionReducer(createInitialSessionState(), {
      type: "HYDRATE_SUCCESS",
      payload: {
        user,
        organization: org,
        organizations: [org],
        portal: "PHARMACY",
        roles: ["OWNER"],
        marketCode: "AO",
      },
    });
    const next = sessionReducer(hydrated, { type: "SIGN_OUT" });
    expect(next.status).toBe("anonymous");
    expect(next.user).toBeNull();
    expect(next.organizations).toEqual([]);
  });

  it("ações desconhecidas devolvem o estado sem mutação", () => {
    const state = createInitialSessionState();
    const next = sessionReducer(state, {
      type: "UNKNOWN",
    } as unknown as SessionAction);
    expect(next).toBe(state);
  });
});
