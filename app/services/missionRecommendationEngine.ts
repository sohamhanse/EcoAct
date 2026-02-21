import type { DailyQuickLog, EmissionCategory, Mission } from "../types/domain";

type GenerateMissionInput = {
  topEmissionSource: EmissionCategory;
  latestDailyLog?: DailyQuickLog;
  previouslyCompletedMissionIds: string[];
};

const missionCatalog: Mission[] = [
  {
    id: "easy-plastic",
    title: "Skip single-use plastic today",
    description: "Carry a reusable bottle and bag for daily errands.",
    difficulty: "easy",
    category: "shopping",
    co2SavedKg: 0.3,
  },
  {
    id: "easy-veg-snack",
    title: "Choose one vegetarian meal",
    description: "Replace one meat-based meal with a vegetarian option.",
    difficulty: "easy",
    category: "food",
    co2SavedKg: 0.8,
  },
  {
    id: "easy-bike-short-trip",
    title: "Walk or bike for a short trip",
    description: "Avoid one short motorized trip under 3 km.",
    difficulty: "easy",
    category: "transport",
    co2SavedKg: 0.7,
  },
  {
    id: "medium-public-transport",
    title: "Use public transport today",
    description: "Replace private vehicle commute with bus or metro.",
    difficulty: "medium",
    category: "transport",
    co2SavedKg: 1.3,
  },
  {
    id: "medium-meat-free-day",
    title: "Go vegetarian for one full day",
    description: "Follow vegetarian meals for the entire day.",
    difficulty: "medium",
    category: "food",
    co2SavedKg: 2.1,
  },
  {
    id: "medium-reduce-ac",
    title: "Reduce AC usage by 2 hours",
    description: "Use fan or ventilation for two hours instead of AC.",
    difficulty: "medium",
    category: "energy",
    co2SavedKg: 1.9,
  },
  {
    id: "hard-no-car-day",
    title: "No car day challenge",
    description: "Avoid all private car usage for an entire day.",
    difficulty: "hard",
    category: "transport",
    co2SavedKg: 3.5,
  },
  {
    id: "hard-home-energy-reset",
    title: "Home energy reset",
    description: "Run an evening with AC limits and low standby consumption.",
    difficulty: "hard",
    category: "energy",
    co2SavedKg: 3.1,
  },
  {
    id: "hard-zero-meat-day",
    title: "Zero meat day plus meal prep",
    description: "Plan and execute a complete meat-free day with prep.",
    difficulty: "hard",
    category: "food",
    co2SavedKg: 3.0,
  },
];

function pickMission(
  pool: Mission[],
  fallback: Mission[],
  history: string[],
  preferredCategory?: EmissionCategory,
): Mission {
  const filtered = pool.filter((mission) => (preferredCategory ? mission.category === preferredCategory : true));
  const withoutRecent = filtered.filter((mission) => !history.includes(mission.id));

  if (withoutRecent[0]) {
    return withoutRecent[0];
  }

  if (filtered[0]) {
    return filtered[0];
  }

  return fallback[0];
}

export function generateDailyMissions(input: GenerateMissionInput): Mission[] {
  const easyPool = missionCatalog.filter((mission) => mission.difficulty === "easy");
  const mediumPool = missionCatalog.filter((mission) => mission.difficulty === "medium");
  const hardPool = missionCatalog.filter((mission) => mission.difficulty === "hard");

  const preferredFromLog: EmissionCategory | undefined =
    input.latestDailyLog?.carKm && input.latestDailyLog.carKm > 15
      ? "transport"
      : input.latestDailyLog?.foodType === "non-veg"
        ? "food"
        : input.latestDailyLog?.acHours && input.latestDailyLog.acHours > 4
          ? "energy"
          : undefined;

  const preferredCategory = preferredFromLog ?? input.topEmissionSource;

  const easy = pickMission(easyPool, easyPool, input.previouslyCompletedMissionIds, preferredCategory);
  const medium = pickMission(mediumPool, mediumPool, input.previouslyCompletedMissionIds, preferredCategory);
  const hard = pickMission(hardPool, hardPool, input.previouslyCompletedMissionIds, preferredCategory);

  return [easy, medium, hard];
}
