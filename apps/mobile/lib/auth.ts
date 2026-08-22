import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "brocolis_refresh_token";
const ACCESS_TOKEN_KEY = "brocolis_access_token";
const SESSION_KEY = "brocolis_session";

export type Session = {
  userId: string;
  organizationId: string;
  marketCode: string;
  portal: string;
  roles: string[];
};

async function hasHardwareAsync(): Promise<boolean> {
  try {
    return await LocalAuthentication.hasHardwareAsync();
  } catch {
    return false;
  }
}

async function isEnrolledAsync(): Promise<boolean> {
  try {
    return await LocalAuthentication.isEnrolledAsync();
  } catch {
    return false;
  }
}

async function authenticateAsync(): Promise<boolean> {
  try {
    const hasHardware = await hasHardwareAsync();
    const isEnrolled = await isEnrolledAsync();
    if (!hasHardware || !isEnrolled) return true;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Desbloqueie para aceder à sua sessão",
      cancelLabel: "Cancelar",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

export const auth = {
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },

  async setSession(session: Session): Promise<void> {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  },

  async getSession(): Promise<Session | null> {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  },

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    const authenticated = await authenticateAsync();
    if (!authenticated) return null;

    try {
      const baseUrl =
        process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await auth.clearTokens();
        return null;
      }

      const data = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      await auth.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    }
  },

  async signIn(email: string, password: string): Promise<Session> {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ message: "Login failed" }))) as { message: string };
      throw new Error(error.message);
    }

    const data = (await response.json()) as {
      accessToken: string;
      refreshToken: string;
      session: Session;
    };

    await auth.setTokens(data.accessToken, data.refreshToken);
    await auth.setSession(data.session);
    return data.session;
  },

  async signUp(
    name: string,
    email: string,
    password: string,
    marketCode: string,
  ): Promise<Session> {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/auth/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, marketCode }),
    });

    if (!response.ok) {
      const error = (await response
        .json()
        .catch(() => ({ message: "Signup failed" }))) as { message: string };
      throw new Error(error.message);
    }

    const data = (await response.json()) as {
      accessToken: string;
      refreshToken: string;
      session: Session;
    };

    await auth.setTokens(data.accessToken, data.refreshToken);
    await auth.setSession(data.session);
    return data.session;
  },

  async signOut(): Promise<void> {
    await auth.clearTokens();
  },
};
