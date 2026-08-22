import type { Organization, Portal, User } from "@brocolis/contracts";

export type SessionUser = Pick<
  User,
  "id" | "email" | "name" | "emailVerified" | "marketCode"
>;

export type SessionStatus = "loading" | "authenticated" | "anonymous" | "error";

export type SessionState = {
  status: SessionStatus;
  user: SessionUser | null;
  organization: Organization | null;
  organizations: Organization[];
  portal: Portal | null;
  roles: string[];
  marketCode: string | null;
  error: string | null;
};

export type SessionAction =
  | {
      type: "HYDRATE_START";
    }
  | {
      type: "HYDRATE_SUCCESS";
      payload: {
        user: SessionUser;
        organization: Organization;
        organizations: Organization[];
        portal: Portal;
        roles: string[];
        marketCode: string;
      };
    }
  | {
      type: "SWITCH_ORGANIZATION";
      payload: {
        organization: Organization;
        portal: Portal;
        roles: string[];
        marketCode: string;
      };
    }
  | { type: "HYDRATE_ERROR"; error: string }
  | { type: "SIGN_OUT" };

export type HydrateSuccessPayload = Extract<
  SessionAction,
  { type: "HYDRATE_SUCCESS" }
>["payload"];

export function createInitialSessionState(): SessionState {
  return {
    status: "anonymous",
    user: null,
    organization: null,
    organizations: [],
    portal: null,
    roles: [],
    marketCode: null,
    error: null,
  };
}

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case "HYDRATE_START":
      return { ...state, status: "loading", error: null };
    case "HYDRATE_SUCCESS":
      return {
        status: "authenticated",
        user: action.payload.user,
        organization: action.payload.organization,
        organizations: [...action.payload.organizations],
        portal: action.payload.portal,
        roles: [...action.payload.roles],
        marketCode: action.payload.marketCode,
        error: null,
      };
    case "SWITCH_ORGANIZATION":
      return {
        ...state,
        organization: action.payload.organization,
        portal: action.payload.portal,
        roles: [...action.payload.roles],
        marketCode: action.payload.marketCode,
        error: null,
      };
    case "HYDRATE_ERROR":
      return { ...state, status: "error", error: action.error };
    case "SIGN_OUT":
      return createInitialSessionState();
    default:
      return state;
  }
}
