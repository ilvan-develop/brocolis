import * as LocalAuthentication from "expo-local-authentication";
import { auth } from "@/lib/auth";

function mockFetchOnce(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as typeof fetch;
}

beforeEach(async () => {
  await auth.clearTokens();
  jest.clearAllMocks();
});

describe("auth.setTokens / getAccessToken / getRefreshToken / clearTokens", () => {
  it("round-trips access and refresh tokens through SecureStore", async () => {
    await auth.setTokens("access-1", "refresh-1");

    expect(await auth.getAccessToken()).toBe("access-1");
    expect(await auth.getRefreshToken()).toBe("refresh-1");
  });

  it("clearTokens removes both tokens and the session", async () => {
    await auth.setTokens("access-1", "refresh-1");
    await auth.setSession({
      userId: "u1",
      organizationId: "org_1",
      marketCode: "AO",
      portal: "b2c",
      roles: ["buyer"],
    });

    await auth.clearTokens();

    expect(await auth.getAccessToken()).toBeNull();
    expect(await auth.getRefreshToken()).toBeNull();
    expect(await auth.getSession()).toBeNull();
  });
});

describe("auth.setSession / getSession", () => {
  it("round-trips the session as JSON", async () => {
    const session = {
      userId: "u1",
      organizationId: "org_1",
      marketCode: "AO",
      portal: "b2c",
      roles: ["buyer"],
    };
    await auth.setSession(session);

    expect(await auth.getSession()).toEqual(session);
  });

  it("returns null when no session is stored", async () => {
    expect(await auth.getSession()).toBeNull();
  });
});

describe("auth.signIn", () => {
  it("stores tokens and session on success", async () => {
    mockFetchOnce(200, {
      accessToken: "access-1",
      refreshToken: "refresh-1",
      session: {
        userId: "u1",
        organizationId: "org_1",
        marketCode: "AO",
        portal: "b2c",
        roles: ["buyer"],
      },
    });

    const session = await auth.signIn("user@example.com", "password123");

    expect(session.userId).toBe("u1");
    expect(await auth.getAccessToken()).toBe("access-1");
  });

  it("throws with the server error message on failure", async () => {
    mockFetchOnce(401, { message: "Credenciais inválidas" });

    await expect(auth.signIn("user@example.com", "wrong")).rejects.toThrow(
      "Credenciais inválidas",
    );
  });
});

describe("auth.signOut", () => {
  it("clears all stored tokens and session", async () => {
    await auth.setTokens("access-1", "refresh-1");

    await auth.signOut();

    expect(await auth.getAccessToken()).toBeNull();
  });
});

describe("auth.refreshAccessToken", () => {
  it("returns null when there is no stored refresh token", async () => {
    expect(await auth.refreshAccessToken()).toBeNull();
  });

  it("returns null and clears tokens when the server rejects the refresh", async () => {
    await auth.setTokens("access-1", "refresh-1");
    mockFetchOnce(401, { message: "expired" });

    const result = await auth.refreshAccessToken();

    expect(result).toBeNull();
    expect(await auth.getAccessToken()).toBeNull();
  });

  it("does not call the biometric prompt when there is no hardware/enrollment", async () => {
    await auth.setTokens("access-1", "refresh-1");
    mockFetchOnce(200, { accessToken: "access-2", refreshToken: "refresh-2" });

    await auth.refreshAccessToken();

    // hasHardwareAsync/isEnrolledAsync are both mocked to resolve false in
    // jest-setup.ts, so authenticateAsync must be skipped (auto-approved).
    expect(LocalAuthentication.authenticateAsync).not.toHaveBeenCalled();
  });
});
