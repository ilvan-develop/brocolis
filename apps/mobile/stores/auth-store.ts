import { create } from "zustand";
import type { Session } from "@/lib/auth";

type AuthState = {
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  setSession: (session) => set({ session, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  signOut: () => set({ session: null, isLoading: false }),
}));
