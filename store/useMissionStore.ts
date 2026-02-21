import { create } from "zustand";
import type { ApiMission } from "@/src/types";

type MissionState = {
  completedIds: Set<string>;
  setCompletedIds: (ids: string[]) => void;
  addCompleted: (id: string) => void;
};

export const useMissionStore = create<MissionState>((set) => ({
  completedIds: new Set(),
  setCompletedIds: (ids) => set({ completedIds: new Set(ids) }),
  addCompleted: (id) =>
    set((s) => {
      const next = new Set(s.completedIds);
      next.add(id);
      return { completedIds: next };
    }),
}));
