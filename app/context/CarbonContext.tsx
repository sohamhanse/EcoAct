import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createAccount,
  isEmailUnique,
  normalizeEmail,
  validateEmail,
  validatePassword,
} from "../services/authService";
import { calculateBadges } from "../services/badgeEngine";
import {
  calculateBaselineResult,
  calculateDailyQuickLogEmission,
  calculateMonthlyUtilityEmission,
  calculateNetImpact,
} from "../services/carbonCalculationService";
import { trackEvent } from "../services/analyticsService";
import {
  calculateMissionPoints,
  getAllMissionsCompletedBonus,
  getSevenDayStreakBonus,
} from "../services/pointsEngine";
import { generateDailyMissions } from "../services/missionRecommendationEngine";
import { calculateStreakAfterMission, getDateKey, shouldResetStreak } from "../services/streakEngine";
import type {
  Account,
  AppState,
  BaselineQuestionnaire,
  BaselineResult,
  DailyFoodType,
  DailyQuickLog,
  Mission,
  MonthlyUtilityLog,
} from "../types/domain";

const STORAGE_KEY = "ecoact-flow-state-v3";

const initialState: AppState = {
  onboardingCompleted: false,
  accounts: [],
  currentUserId: null,
  baselineQuestionnaire: null,
  baselineResult: null,
  totalSavedKg: 0,
  points: 0,
  streak: 0,
  lastMissionCompletionDate: null,
  badges: [],
  dailyLogsByDate: {},
  monthlyUtilitiesByMonth: {},
  missionsByDate: {},
  missionCompletionsByDate: {},
  allMissionsBonusDates: [],
};

type RouteTarget = "Onboarding" | "Auth" | "BaselineQuestionnaire" | "Dashboard";

type ManualSignupInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type ContextValue = {
  isHydrated: boolean;
  state: AppState;
  currentUser: Account | null;
  entryRoute: RouteTarget;
  todayDateKey: string;
  todayMonthKey: string;
  todaysMissions: Mission[];
  todayMissionCompletions: string[];
  hasCompletedDailyLogToday: boolean;
  needsMonthlyUtilityUpdate: boolean;
  dynamicMonthlyKg: number;
  netImpactKg: number;
  improvementPercent: number;
  markOnboardingCompleted: () => void;
  signInWithGoogle: () => Promise<void>;
  signUpManual: (input: ManualSignupInput) => { ok: boolean; error?: string };
  signOut: () => void;
  saveBaselineResult: (questionnaire: BaselineQuestionnaire) => BaselineResult;
  submitDailyQuickLog: (input: {
    carKm: number;
    foodType: DailyFoodType;
    acHours: number;
  }) => void;
  submitMonthlyUtilityLog: (input: {
    electricityKwh: number;
    lpgUsage: number;
    gasCylinderCount: number;
  }) => void;
  completeMission: (missionId: string) => { ok: boolean; reason?: string };
};

const CarbonContext = createContext<ContextValue | undefined>(undefined);

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function getMonthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

function getCurrentUser(accounts: Account[], userId: string | null): Account | null {
  if (!userId) {
    return null;
  }

  return accounts.find((account) => account.id === userId) ?? null;
}

function getLatestDailyLog(logsByDate: Record<string, DailyQuickLog>): DailyQuickLog | undefined {
  const keys = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a));
  if (!keys[0]) {
    return undefined;
  }

  return logsByDate[keys[0]];
}

function sumMonthEmission<T extends { dateKey?: string; monthKey?: string; dailyEmissionKg?: number; utilityEmissionKg?: number }>(
  collection: Record<string, T>,
  monthKey: string,
): number {
  return roundToTwo(
    Object.values(collection).reduce((accumulator, item) => {
      if (item.dateKey && item.dateKey.startsWith(monthKey)) {
        return accumulator + (item.dailyEmissionKg ?? 0);
      }
      if (item.monthKey === monthKey) {
        return accumulator + (item.utilityEmissionKg ?? 0);
      }
      return accumulator;
    }, 0),
  );
}

export function CarbonProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [state, setState] = useState<AppState>(initialState);

  const todayDateKey = getDateKey();
  const todayMonthKey = getMonthKey();
  const todayDayOfMonth = new Date().getDate();

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored || !mounted) {
          return;
        }

        const parsed = JSON.parse(stored) as Partial<AppState>;
        setState((previous) => ({
          ...previous,
          ...parsed,
          accounts: parsed.accounts ?? previous.accounts,
          dailyLogsByDate: parsed.dailyLogsByDate ?? previous.dailyLogsByDate,
          monthlyUtilitiesByMonth: parsed.monthlyUtilitiesByMonth ?? previous.monthlyUtilitiesByMonth,
          missionsByDate: parsed.missionsByDate ?? previous.missionsByDate,
          missionCompletionsByDate: parsed.missionCompletionsByDate ?? previous.missionCompletionsByDate,
          allMissionsBonusDates: parsed.allMissionsBonusDates ?? previous.allMissionsBonusDates,
          badges: parsed.badges ?? previous.badges,
        }));
      } catch {
        // Use defaults when hydration fails.
      } finally {
        if (mounted) {
          setIsHydrated(true);
        }
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      // Local persistence best-effort only.
    });
  }, [isHydrated, state]);

  const currentUser = useMemo(
    () => getCurrentUser(state.accounts, state.currentUserId),
    [state.accounts, state.currentUserId],
  );

  const entryRoute: RouteTarget = useMemo(() => {
    if (currentUser && state.baselineResult) {
      return "Dashboard";
    }
    if (currentUser && !state.baselineResult) {
      return "BaselineQuestionnaire";
    }
    if (state.onboardingCompleted) {
      return "Auth";
    }
    return "Onboarding";
  }, [currentUser, state.baselineResult, state.onboardingCompleted]);

  // Ensure daily mission pool refreshes once every new date.
  useEffect(() => {
    if (!isHydrated || !currentUser || !state.baselineResult) {
      return;
    }

    setState((previous) => {
      if (previous.missionsByDate[todayDateKey]) {
        return previous;
      }

      const previouslyCompletedMissionIds = Object.values(previous.missionCompletionsByDate)
        .flat()
        .slice(-10);

      const latestDailyLog = getLatestDailyLog(previous.dailyLogsByDate);

      const newMissions = generateDailyMissions({
        topEmissionSource: previous.baselineResult?.topEmissionSource ?? "energy",
        latestDailyLog,
        previouslyCompletedMissionIds,
      });

      trackEvent("mission_pool_generated", {
        date: todayDateKey,
        topSource: previous.baselineResult?.topEmissionSource,
      });

      return {
        ...previous,
        missionsByDate: {
          ...previous.missionsByDate,
          [todayDateKey]: newMissions,
        },
      };
    });
  }, [currentUser, isHydrated, state.baselineResult, todayDateKey]);

  // Reset streak if user missed at least one day without mission completion.
  useEffect(() => {
    if (!isHydrated || !currentUser) {
      return;
    }

    if (
      shouldResetStreak({
        streak: state.streak,
        lastMissionCompletionDate: state.lastMissionCompletionDate,
        todayDateKey,
      })
    ) {
      setState((previous) => ({
        ...previous,
        streak: 0,
      }));
    }
  }, [currentUser, isHydrated, state.lastMissionCompletionDate, state.streak, todayDateKey]);

  const todaysMissions = state.missionsByDate[todayDateKey] ?? [];
  const todayMissionCompletions = state.missionCompletionsByDate[todayDateKey] ?? [];
  const hasCompletedDailyLogToday = Boolean(state.dailyLogsByDate[todayDateKey]);
  const needsMonthlyUtilityUpdate = todayDayOfMonth === 1 && !state.monthlyUtilitiesByMonth[todayMonthKey];
  const dynamicMonthlyKg = roundToTwo(
    sumMonthEmission(state.dailyLogsByDate, todayMonthKey) + sumMonthEmission(state.monthlyUtilitiesByMonth, todayMonthKey),
  );

  const baselineAnnualKg = state.baselineResult?.annualTotalKg ?? 0;
  const { netImpactKg, improvementPercent } = calculateNetImpact({
    baselineAnnualKg,
    totalSavedKg: state.totalSavedKg,
  });

  function markOnboardingCompleted() {
    setState((previous) => ({
      ...previous,
      onboardingCompleted: true,
    }));
  }

  async function signInWithGoogle() {
    const normalizedEmail = normalizeEmail("google.user@ecoact.app");
    const existing = state.accounts.find((account) => account.email === normalizedEmail);

    if (existing) {
      setState((previous) => ({
        ...previous,
        currentUserId: existing.id,
      }));
      trackEvent("auth_google_login", { accountId: existing.id });
      return;
    }

    const created = createAccount({
      name: "Google User",
      email: normalizedEmail,
      provider: "google",
    });

    setState((previous) => ({
      ...previous,
      onboardingCompleted: true,
      accounts: [...previous.accounts, created],
      currentUserId: created.id,
      totalSavedKg: 0,
      points: 0,
      streak: 0,
    }));

    trackEvent("auth_google_signup", { accountId: created.id });
  }

  function signUpManual(input: ManualSignupInput): { ok: boolean; error?: string } {
    const trimmedName = input.name.trim();
    const normalized = normalizeEmail(input.email);

    if (trimmedName.length < 2) {
      return { ok: false, error: "Full name is required." };
    }
    if (!validateEmail(normalized)) {
      return { ok: false, error: "Please enter a valid email address." };
    }
    if (!validatePassword(input.password)) {
      return { ok: false, error: "Password must be at least 8 characters." };
    }
    if (input.password !== input.confirmPassword) {
      return { ok: false, error: "Passwords do not match." };
    }
    if (!isEmailUnique(state.accounts, normalized)) {
      return { ok: false, error: "This email already exists. Use another email." };
    }

    const account = createAccount({
      name: trimmedName,
      email: normalized,
      provider: "manual",
      password: input.password,
    });

    setState((previous) => ({
      ...previous,
      onboardingCompleted: true,
      accounts: [...previous.accounts, account],
      currentUserId: account.id,
      baselineResult: null,
      baselineQuestionnaire: null,
      totalSavedKg: 0,
      points: 0,
      streak: 0,
      badges: [],
      lastMissionCompletionDate: null,
      dailyLogsByDate: {},
      monthlyUtilitiesByMonth: {},
      missionCompletionsByDate: {},
      missionsByDate: {},
      allMissionsBonusDates: [],
    }));

    trackEvent("auth_manual_signup", { accountId: account.id });

    return { ok: true };
  }

  function signOut() {
    setState((previous) => ({
      ...previous,
      currentUserId: null,
    }));
  }

  function saveBaselineResult(questionnaire: BaselineQuestionnaire): BaselineResult {
    const baselineResult = calculateBaselineResult(questionnaire);

    setState((previous) => ({
      ...previous,
      baselineQuestionnaire: questionnaire,
      baselineResult,
    }));

    trackEvent("baseline_calculated", {
      annualKg: baselineResult.annualTotalKg,
      topSource: baselineResult.topEmissionSource,
    });

    return baselineResult;
  }

  function submitDailyQuickLog(input: { carKm: number; foodType: DailyFoodType; acHours: number }) {
    const dailyEmissionKg = calculateDailyQuickLogEmission(input);
    const log: DailyQuickLog = {
      dateKey: todayDateKey,
      carKm: input.carKm,
      foodType: input.foodType,
      acHours: input.acHours,
      dailyEmissionKg,
    };

    setState((previous) => ({
      ...previous,
      dailyLogsByDate: {
        ...previous.dailyLogsByDate,
        [todayDateKey]: log,
      },
    }));

    trackEvent("daily_log_submitted", log);
  }

  function submitMonthlyUtilityLog(input: {
    electricityKwh: number;
    lpgUsage: number;
    gasCylinderCount: number;
  }) {
    const utilityEmissionKg = calculateMonthlyUtilityEmission(input);
    const utilityLog: MonthlyUtilityLog = {
      monthKey: todayMonthKey,
      electricityKwh: input.electricityKwh,
      lpgUsage: input.lpgUsage,
      gasCylinderCount: input.gasCylinderCount,
      utilityEmissionKg,
    };

    setState((previous) => ({
      ...previous,
      monthlyUtilitiesByMonth: {
        ...previous.monthlyUtilitiesByMonth,
        [todayMonthKey]: utilityLog,
      },
    }));

    trackEvent("monthly_utility_updated", utilityLog);
  }

  function completeMission(missionId: string): { ok: boolean; reason?: string } {
    const mission = todaysMissions.find((item) => item.id === missionId);
    if (!mission) {
      return { ok: false, reason: "mission_not_found" };
    }

    if (todayMissionCompletions.includes(missionId)) {
      return { ok: false, reason: "already_completed" };
    }

    setState((previous) => {
      const completedToday = previous.missionCompletionsByDate[todayDateKey] ?? [];
      const nextCompletedToday = [...completedToday, missionId];

      const missionPoints = calculateMissionPoints({
        co2SavedKg: mission.co2SavedKg,
        difficulty: mission.difficulty,
      });

      let nextPoints = previous.points + missionPoints;
      let nextStreak = previous.streak;
      const firstCompletionToday = completedToday.length === 0;

      if (firstCompletionToday) {
        nextStreak = calculateStreakAfterMission({
          previousStreak: previous.streak,
          lastMissionCompletionDate: previous.lastMissionCompletionDate,
          todayDateKey,
        });
      }

      if (firstCompletionToday && nextStreak === 7 && previous.streak < 7) {
        nextPoints += getSevenDayStreakBonus();
      }

      const alreadyAwardedAllThreeBonus = previous.allMissionsBonusDates.includes(todayDateKey);
      if (nextCompletedToday.length === 3 && !alreadyAwardedAllThreeBonus) {
        nextPoints += getAllMissionsCompletedBonus();
      }

      const nextTotalSavedKg = roundToTwo(previous.totalSavedKg + mission.co2SavedKg);
      const nextBadges = calculateBadges({
        totalSavedKg: nextTotalSavedKg,
        streak: nextStreak,
      });

      return {
        ...previous,
        totalSavedKg: nextTotalSavedKg,
        points: nextPoints,
        streak: nextStreak,
        badges: nextBadges,
        lastMissionCompletionDate: firstCompletionToday
          ? todayDateKey
          : previous.lastMissionCompletionDate,
        missionCompletionsByDate: {
          ...previous.missionCompletionsByDate,
          [todayDateKey]: nextCompletedToday,
        },
        allMissionsBonusDates:
          nextCompletedToday.length === 3 && !alreadyAwardedAllThreeBonus
            ? [...previous.allMissionsBonusDates, todayDateKey]
            : previous.allMissionsBonusDates,
      };
    });

    trackEvent("mission_completed", {
      missionId,
      date: todayDateKey,
    });

    return { ok: true };
  }

  const value: ContextValue = {
    isHydrated,
    state,
    currentUser,
    entryRoute,
    todayDateKey,
    todayMonthKey,
    todaysMissions,
    todayMissionCompletions,
    hasCompletedDailyLogToday,
    needsMonthlyUtilityUpdate,
    dynamicMonthlyKg,
    netImpactKg,
    improvementPercent,
    markOnboardingCompleted,
    signInWithGoogle,
    signUpManual,
    signOut,
    saveBaselineResult,
    submitDailyQuickLog,
    submitMonthlyUtilityLog,
    completeMission,
  };

  return <CarbonContext.Provider value={value}>{children}</CarbonContext.Provider>;
}

export function useCarbonContext() {
  const context = useContext(CarbonContext);
  if (!context) {
    throw new Error("useCarbonContext must be used inside CarbonProvider.");
  }
  return context;
}
