import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { badgeCatalog } from "@/features/gamification/badgeCatalog";
import type { BadgeId, Mission } from "@/types/app";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type MissionCompletionStatus = "completed" | "already_completed_today";

type MissionState = {
  completedByDay: Record<string, string>;
  totalCompletions: number;
  totalCo2SavedKg: number;
  points: number;
  streakDays: number;
  longestStreakDays: number;
  lastCompletionDate: string | null;
  badgeIds: BadgeId[];
  completeMission: (mission: Mission) => MissionCompletionStatus;
  resetProgress: () => void;
};

export function formatDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function isYesterday(todayKey: string, previousKey: string): boolean {
  const today = new Date(`${todayKey}T00:00:00.000Z`);
  const previous = new Date(`${previousKey}T00:00:00.000Z`);
  const distance = today.getTime() - previous.getTime();

  return distance === DAY_IN_MS;
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function evaluateBadges(state: {
  totalCompletions: number;
  points: number;
  streakDays: number;
  totalCo2SavedKg: number;
}): BadgeId[] {
  return badgeCatalog
    .filter((badge) => {
      switch (badge.id) {
        case "first-action":
          return state.totalCompletions >= 1;
        case "streak-7":
          return state.streakDays >= 7;
        case "points-100":
          return state.points >= 100;
        case "saved-25":
          return state.totalCo2SavedKg >= 25;
        default:
          return false;
      }
    })
    .map((badge) => badge.id);
}

const initialState = {
  completedByDay: {},
  totalCompletions: 0,
  totalCo2SavedKg: 0,
  points: 0,
  streakDays: 0,
  longestStreakDays: 0,
  lastCompletionDate: null,
  badgeIds: [],
};

export const useMissionStore = create<MissionState>()(
  persist(
    (set) => ({
      ...initialState,
      completeMission: (mission) => {
        const todayKey = formatDateKey(new Date());
        let status: MissionCompletionStatus = "completed";

        set((state) => {
          if (state.completedByDay[mission.id] === todayKey) {
            status = "already_completed_today";
            return state;
          }

          const nextTotalCompletions = state.totalCompletions + 1;
          const nextTotalCo2SavedKg = roundToSingleDecimal(state.totalCo2SavedKg + mission.co2SavedKg);
          const nextPoints = state.points + mission.points;

          let nextStreak = 1;
          if (state.lastCompletionDate === todayKey) {
            nextStreak = state.streakDays;
          } else if (state.lastCompletionDate && isYesterday(todayKey, state.lastCompletionDate)) {
            nextStreak = state.streakDays + 1;
          }

          const nextLongestStreak = Math.max(state.longestStreakDays, nextStreak);
          const badgeIds = evaluateBadges({
            totalCompletions: nextTotalCompletions,
            points: nextPoints,
            streakDays: nextStreak,
            totalCo2SavedKg: nextTotalCo2SavedKg,
          });

          return {
            ...state,
            completedByDay: { ...state.completedByDay, [mission.id]: todayKey },
            totalCompletions: nextTotalCompletions,
            totalCo2SavedKg: nextTotalCo2SavedKg,
            points: nextPoints,
            streakDays: nextStreak,
            longestStreakDays: nextLongestStreak,
            lastCompletionDate: todayKey,
            badgeIds,
          };
        });

        return status;
      },
      resetProgress: () =>
        set({
          ...initialState,
        }),
    }),
    {
      name: "ecoact-mission-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
