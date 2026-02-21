import { axiosInstance } from "./axiosInstance";
import type { CommunityStatsResponse } from "@/src/types";

export async function getCommunityStats(communityId: string | null): Promise<CommunityStatsResponse | null> {
  if (!communityId) return null;
  const { data } = await axiosInstance.get<CommunityStatsResponse>(`/community/${communityId}/stats`);
  return data;
}
