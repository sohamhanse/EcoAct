import { create } from "zustand";

type MissionState = {
  savedCO2: number;
  points: number;
  complete: (co2: number) => void;
};

export const useMissionStore = create<MissionState>((set) => ({
  savedCO2: 0,
  points: 0,
  complete: (co2) =>
    set((s) => ({
      savedCO2: s.savedCO2 + co2,
      points: s.points + Math.round(co2 * 10),
    })),
}));