import { create } from "zustand";
import type { ApiCommunity } from "@/src/types";

type CommunityState = {
  mine: ApiCommunity | null;
  setMine: (c: ApiCommunity | null) => void;
};

export const useCommunityStore = create<CommunityState>((set) => ({
  mine: null,
  setMine: (mine) => set({ mine }),
}));
