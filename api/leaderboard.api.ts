import { axiosInstance } from "./axiosInstance";
import type { LeaderboardEntry } from "@/src/types";

export async function getGlobalLeaderboard(page = 1): Promise<{
  leaderboard: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const { data } = await axiosInstance.get("/leaderboard/global", { params: { page } });
  return data;
}

export async function getCommunityLeaderboard(
  communityId: string,
  page = 1,
): Promise<{
  leaderboard: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const { data } = await axiosInstance.get(`/leaderboard/community/${communityId}`, { params: { page } });
  return data;
}

export async function getWeeklyLeaderboard(page = 1): Promise<{
  leaderboard: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const { data } = await axiosInstance.get("/leaderboard/weekly", { params: { page } });
  return data;
}
