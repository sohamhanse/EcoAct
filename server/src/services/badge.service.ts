export const BADGES = [
  { id: "first_step", label: "First Step", threshold: 1, unit: "missions" },
  { id: "eco_starter", label: "Eco Starter", threshold: 10, unit: "kg_co2" },
  { id: "green_warrior", label: "Green Warrior", threshold: 50, unit: "kg_co2" },
  { id: "climate_hero", label: "Climate Hero", threshold: 100, unit: "kg_co2" },
  { id: "week_streak", label: "7-Day Streak", threshold: 7, unit: "streak" },
  { id: "month_streak", label: "30-Day Streak", threshold: 30, unit: "streak" },
  { id: "community_builder", label: "Community Builder", threshold: 1, unit: "community_join" },
  { id: "puc_first", label: "Clean Wheels", threshold: 1, unit: "custom" },
  { id: "puc_5", label: "Compliance Champion", threshold: 5, unit: "custom" },
  { id: "puc_10", label: "Pollution Fighter", threshold: 10, unit: "custom" },
  { id: "puc_streak_3", label: "Triple Clean", threshold: 3, unit: "custom" },
  { id: "reporter_first", label: "First Report", threshold: 1, unit: "custom" },
  { id: "reporter_10", label: "Street Guardian", threshold: 10, unit: "custom" },
  { id: "reporter_50", label: "Pollution Watchdog", threshold: 50, unit: "custom" },
  { id: "reporter_100", label: "Clean Air Champion", threshold: 100, unit: "custom" },
] as const;

export function getNewlyEarnedBadges(
  prevBadges: string[],
  stats: { missionsCount: number; totalCo2Saved: number; currentStreak: number; hasCommunity: boolean },
): string[] {
  const earned: string[] = [];
  for (const b of BADGES) {
    if (prevBadges.includes(b.id)) continue;
    if (b.unit === "missions" && stats.missionsCount >= b.threshold) earned.push(b.id);
    if (b.unit === "kg_co2" && stats.totalCo2Saved >= b.threshold) earned.push(b.id);
    if (b.unit === "streak" && stats.currentStreak >= b.threshold) earned.push(b.id);
    if (b.unit === "community_join" && stats.hasCommunity && b.threshold >= 1) earned.push(b.id);
  }
  return earned;
}
