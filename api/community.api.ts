import { axiosInstance } from "./axiosInstance";
import type { ApiCommunity } from "@/src/types";

export async function getCommunities(params?: {
  type?: "college" | "city" | "company";
  search?: string;
}): Promise<ApiCommunity[]> {
  const { data } = await axiosInstance.get<{ communities: ApiCommunity[] }>("/community", { params });
  return data.communities;
}

export async function getCommunity(id: string): Promise<{
  community: ApiCommunity;
  topContributors: Array<{ name: string; avatar: string; totalPoints: number; totalCo2Saved: number }>;
}> {
  const { data } = await axiosInstance.get(`/community/${id}`);
  return data;
}

export async function joinCommunity(id: string): Promise<{ community: ApiCommunity }> {
  const { data } = await axiosInstance.post(`/community/${id}/join`);
  return data;
}

export async function leaveCommunity(): Promise<void> {
  await axiosInstance.post("/community/leave", {});
}

export async function getMyCommunity(): Promise<{
  community: ApiCommunity | null;
  topContributors?: Array<{ name: string; avatar: string; totalPoints: number; totalCo2Saved: number }>;
}> {
  const { data } = await axiosInstance.get("/community/mine");
  return data;
}
