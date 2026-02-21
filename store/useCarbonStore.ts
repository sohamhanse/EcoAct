import { create } from "zustand";

type CarbonState = {
  baseline: number;
  breakdown: Record<string, number>;
  setCarbon: (total: number, breakdown: Record<string, number>) => void;
};

export const useCarbonStore = create<CarbonState>((set) => ({
  baseline: 0,
  breakdown: {},
  setCarbon: (total, breakdown) =>
    set({ baseline: total, breakdown }),
}));