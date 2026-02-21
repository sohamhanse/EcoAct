import { axiosInstance } from "./axiosInstance";
import type { ActivityFeedItem } from "@/src/types";

export async function getCommunityFeed(
  communityId: string,
  page = 1,
  limit = 20,
): Promise<{ activities: ActivityFeedItem[]; hasMore: boolean; totalCount: number }> {
  const { data } = await axiosInstance.get<{
    activities: ActivityFeedItem[];
    hasMore: boolean;
    totalCount: number;
  }>(`/community/${communityId}/feed`, { params: { page, limit } });
  return data;
}
