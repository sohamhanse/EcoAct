export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}

export function calculatePoints(basePoints: number, userStreak: number): number {
  const multiplier = getStreakMultiplier(userStreak);
  return Math.round(basePoints * multiplier);
}
