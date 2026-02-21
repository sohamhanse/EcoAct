export const BADGES = [
  { id: "first_step", label: "First Step", threshold: 1, unit: "missions" },
  { id: "eco_starter", label: "Eco Starter", threshold: 10, unit: "kg_co2" },
  { id: "green_warrior", label: "Green Warrior", threshold: 50, unit: "kg_co2" },
  { id: "climate_hero", label: "Climate Hero", threshold: 100, unit: "kg_co2" },
  { id: "week_streak", label: "7-Day Streak", threshold: 7, unit: "streak" },
  { id: "month_streak", label: "30-Day Streak", threshold: 30, unit: "streak" },
  { id: "community_builder", label: "Community Builder", threshold: 1, unit: "community_join" },
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
