import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as authApi from "@/api/auth.api";
import { getAccessToken } from "@/api/axiosInstance";
import type { ApiUser } from "@/src/types";

type AuthState = {
  user: ApiUser | null;
  hydrated: boolean;
  setUser: (user: ApiUser | null) => void;
  setHydrated: (h: boolean) => void;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      hydrated: false,
      setUser: (user) => set({ user }),
      setHydrated: (hydrated) => set({ hydrated }),
      loginWithGoogle: async (idToken: string) => {
        const data = await authApi.googleAuth(idToken);
        set({ user: data.user });
      },
      logout: async () => {
        await authApi.logout();
        set({ user: null });
      },
      refreshUser: async () => {
        const token = await getAccessToken();
        if (!token) return;
        try {
          const user = await authApi.getMe();
          set({ user });
        } catch {
          set({ user: null });
        }
      },
      isAuthenticated: async () => {
        const token = await getAccessToken();
        return !!token && !!get().user;
      },
    }),
    {
      name: "ecotrack-auth-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
