import { createContext, useContext, useEffect } from "react";
import { auth, type Session } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    marketCode: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    session,
    isLoading,
    setSession,
    setLoading,
    signOut: storeSignOut,
  } = useAuthStore();

  useEffect(() => {
    async function loadSession() {
      try {
        const existing = await auth.getSession();
        if (existing) {
          setSession(existing);
        } else {
          const token = await auth.refreshAccessToken();
          if (token) {
            const refreshed = await auth.getSession();
            setSession(refreshed);
          } else {
            setSession(null);
          }
        }
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    }
    void loadSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    const newSession = await auth.signIn(email, password);
    setSession(newSession);
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    marketCode: string,
  ) => {
    const newSession = await auth.signUp(name, email, password, marketCode);
    setSession(newSession);
  };

  const signOut = async () => {
    await auth.signOut();
    storeSignOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, isLoading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
