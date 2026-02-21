import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CarbonAssessmentResult, CarbonBreakdown } from "@/types/app";

type CarbonState = {
  baselineKgPerYear: number;
  breakdown: CarbonBreakdown;
  updatedAt: string | null;
  setAssessment: (assessment: CarbonAssessmentResult) => void;
  clearAssessment: () => void;
};

const emptyBreakdown: CarbonBreakdown = {
  transport: 0,
  food: 0,
  homeEnergy: 0,
  shopping: 0,
};

export const useCarbonStore = create<CarbonState>()(
  persist(
    (set) => ({
      baselineKgPerYear: 0,
      breakdown: emptyBreakdown,
      updatedAt: null,
      setAssessment: (assessment) =>
        set({
          baselineKgPerYear: assessment.totalKgPerYear,
          breakdown: assessment.breakdown,
          updatedAt: new Date().toISOString(),
        }),
      clearAssessment: () =>
        set({
          baselineKgPerYear: 0,
          breakdown: emptyBreakdown,
          updatedAt: null,
        }),
    }),
    {
      name: "ecoact-carbon-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
