import { act } from "@testing-library/react-native";
import { useAuthStore } from "@/stores/auth-store";
import type { Session } from "@/lib/auth";

const session: Session = {
  userId: "user_1",
  organizationId: "org_1",
  marketCode: "AO",
  portal: "b2c",
  roles: ["buyer"],
};

beforeEach(() => {
  act(() => {
    useAuthStore.setState({ session: null, isLoading: true });
  });
});

describe("useAuthStore", () => {
  it("starts loading with no session", () => {
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it("setSession stores the session and clears loading", () => {
    act(() => useAuthStore.getState().setSession(session));

    const state = useAuthStore.getState();
    expect(state.session).toEqual(session);
    expect(state.isLoading).toBe(false);
  });

  it("setSession(null) clears the session and clears loading", () => {
    act(() => useAuthStore.getState().setSession(session));
    act(() => useAuthStore.getState().setSession(null));

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("setLoading toggles the loading flag independently of the session", () => {
    act(() => useAuthStore.getState().setSession(session));
    act(() => useAuthStore.getState().setLoading(true));

    const state = useAuthStore.getState();
    expect(state.session).toEqual(session);
    expect(state.isLoading).toBe(true);
  });

  it("signOut clears the session and loading", () => {
    act(() => useAuthStore.getState().setSession(session));
    act(() => useAuthStore.getState().signOut());

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(false);
  });
});
