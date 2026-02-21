import { axiosInstance } from "./axiosInstance";
import type { ApiMission } from "@/src/types";

export async function getMissions(params?: { category?: string; difficulty?: string }): Promise<ApiMission[]> {
  const { data } = await axiosInstance.get<{ missions: ApiMission[] }>("/missions", { params });
  return data.missions;
}

export async function getRecommendedMissions(): Promise<ApiMission[]> {
  const { data } = await axiosInstance.get<{ missions: ApiMission[] }>("/missions/recommended");
  return data.missions;
}

export async function completeMission(missionId: string): Promise<{
  pointsAwarded: number;
  co2SavedAwarded: number;
  streakMultiplier: number;
  newTotalPoints: number;
  newTotalCo2Saved: number;
  currentStreak: number;
  newlyEarnedBadges: string[];
}> {
  const { data } = await axiosInstance.post(`/missions/${missionId}/complete`);
  return data;
}

export async function getCompletedMissions(): Promise<
  Array<{ missionId: ApiMission; completedAt: string; pointsAwarded: number; co2SavedAwarded: number }>
> {
  const { data } = await axiosInstance.get<{ completed: Array<{ missionId: ApiMission; completedAt: string; pointsAwarded: number; co2SavedAwarded: number }> }>("/missions/completed");
  return data.completed ?? [];
}

export async function getMissionStats(): Promise<{
  missionsCount: number;
  totalCo2Saved: number;
  totalPoints: number;
}> {
  const { data } = await axiosInstance.get("/missions/stats");
  return data;
}
