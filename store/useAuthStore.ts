import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthProvider, UserProfile } from "@/types/app";

type AuthState = {
  user: UserProfile | null;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  login: (provider: AuthProvider, name: string, email: string) => void;
  logout: () => void;
};

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildUser(provider: AuthProvider, name: string, email: string): UserProfile {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = normalizeName(name);

  return {
    id: `${provider}-${normalizedEmail}`,
    name: normalizedName,
    email: normalizedEmail,
    provider,
    createdAt: new Date().toISOString(),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      login: (provider, name, email) => set({ user: buildUser(provider, name, email) }),
      logout: () => set({ user: null }),
    }),
    {
      name: "ecoact-auth-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
