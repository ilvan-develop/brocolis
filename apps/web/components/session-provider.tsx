"use client";

import type { Organization, Portal } from "@brocolis/contracts";
import * as React from "react";
import { type ApiClient, ApiError, createApiClient } from "@/lib/api";
import {
  createInitialSessionState,
  type HydrateSuccessPayload,
  type SessionAction,
  type SessionState,
  sessionReducer,
} from "@/lib/session-store";

const SESSION_STORAGE_KEY = "brocolis.session.v1";

export type SessionContextValue = {
  state: SessionState;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  hydrate: () => Promise<void>;
};

export const SessionContext = React.createContext<SessionContextValue | null>(
  null,
);

function readStoredSession(): HydrateSuccessPayload | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as HydrateSuccessPayload;
  } catch {
    return null;
  }
}

function persistSession(payload: HydrateSuccessPayload | null): void {
  if (typeof window === "undefined") {
    return;
  }
  if (payload === null) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
}

type SessionProviderProps = {
  children: React.ReactNode;
  apiClient?: ApiClient;
};

export function SessionProvider({
  children,
  apiClient = createApiClient(),
}: SessionProviderProps) {
  const [state, dispatch] = React.useReducer(
    sessionReducer,
    undefined,
    createInitialSessionState,
  );

  async function hydrate(): Promise<void> {
    dispatch({ type: "HYDRATE_START" });

    const stored = readStoredSession();
    if (stored !== null) {
      dispatch({ type: "HYDRATE_SUCCESS", payload: stored });
      return;
    }

    try {
      const session = await apiClient.auth.getSession();
      if (session === null) {
        persistSession(null);
        dispatch({ type: "SIGN_OUT" });
        return;
      }
      dispatch({ type: "HYDRATE_ERROR", error: "awaiting-onboarding" });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "session-unknown";
      dispatch({ type: "HYDRATE_ERROR", error: message });
    }
  }

  React.useEffect(() => {
    void hydrate();
  }, []);

  async function signIn(input: {
    email: string;
    password: string;
  }): Promise<void> {
    const result = await apiClient.auth.signIn(input);
    const payload: HydrateSuccessPayload = {
      user: result.user,
      organization: result.organizations[0] ?? {
        id: "",
        name: "",
        slug: "",
        status: "PENDING",
        marketCode: result.user.marketCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      organizations: result.organizations,
      portal: "CONSUMER",
      roles: ["CONSUMER"],
      marketCode: result.user.marketCode,
    };
    persistSession(payload);
    dispatch({ type: "HYDRATE_SUCCESS", payload });
  }

  async function signOut(): Promise<void> {
    try {
      await apiClient.auth.signOut();
    } catch {
      // noop: limpeza local acontece mesmo sem servidor
    }
    persistSession(null);
    dispatch({ type: "SIGN_OUT" });
  }

  async function switchOrganization(organizationId: string): Promise<void> {
    const session = await apiClient.organizations.switch({ organizationId });
    const organization =
      state.organizations.find((org) => org.id === organizationId) ?? null;

    if (organization === null) {
      return;
    }

    const switchPayload: {
      organization: Organization;
      portal: Portal;
      roles: string[];
      marketCode: string;
    } = {
      organization,
      portal: session.portal,
      roles: [...session.roles],
      marketCode: session.marketCode,
    };
    if (state.user !== null) {
      persistSession({
        user: state.user,
        organization,
        organizations: state.organizations,
        portal: session.portal,
        roles: [...session.roles],
        marketCode: session.marketCode,
      });
    }
    dispatch({ type: "SWITCH_ORGANIZATION", payload: switchPayload });
  }

  const value = React.useMemo<SessionContextValue>(
    () => ({
      state,
      signIn,
      signOut,
      switchOrganization,
      hydrate,
    }),
    [state],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
