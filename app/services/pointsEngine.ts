import type { MissionDifficulty } from "../types/domain";

const multiplierMap: Record<MissionDifficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
};

export function calculateMissionPoints(input: {
  co2SavedKg: number;
  difficulty: MissionDifficulty;
}): number {
  const basePoints = 10;
  const bonusFromImpact = Math.round(input.co2SavedKg * multiplierMap[input.difficulty]);
  return basePoints + bonusFromImpact;
}

export function getAllMissionsCompletedBonus(): number {
  return 25;
}

export function getSevenDayStreakBonus(): number {
  return 50;
}
