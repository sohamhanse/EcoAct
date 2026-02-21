import type { BadgeId } from "../types/domain";

export function calculateBadges(params: {
  totalSavedKg: number;
  streak: number;
}): BadgeId[] {
  const badges: BadgeId[] = [];

  if (params.totalSavedKg >= 10) {
    badges.push("bronze-10kg");
  }
  if (params.totalSavedKg >= 50) {
    badges.push("silver-50kg");
  }
  if (params.totalSavedKg >= 100) {
    badges.push("gold-100kg");
  }
  if (params.totalSavedKg >= 500) {
    badges.push("climate-warrior-500kg");
  }
  if (params.streak >= 30) {
    badges.push("streak-30");
  }

  return badges;
}

export const badgeLabels: Record<BadgeId, string> = {
  "bronze-10kg": "Bronze (10kg saved)",
  "silver-50kg": "Silver (50kg saved)",
  "gold-100kg": "Gold (100kg saved)",
  "climate-warrior-500kg": "Climate Warrior (500kg saved)",
  "streak-30": "30-Day Streak",
};
