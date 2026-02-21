import { create } from "zustand";
import type { ApiUser } from "@/src/types";

type UserState = {
  profile: ApiUser | null;
  setProfile: (p: ApiUser | null) => void;
};

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
}));
