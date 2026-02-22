import { axiosInstance } from "./axiosInstance";
import type {
  ApiCommunity,
  ApiCommunityEvent,
  ApiCommunityQuiz,
  ApiCommunityQuizDetail,
  ApiQuizAttemptResult,
} from "@/src/types";

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

export async function getCommunityEvents(
  communityId: string,
  params?: { page?: number; limit?: number },
): Promise<{ events: ApiCommunityEvent[]; total: number; page: number; pageSize: number }> {
  const { data } = await axiosInstance.get(`/community/${communityId}/events`, { params });
  return data;
}

export async function getCommunityQuizzes(
  communityId: string,
  params?: { page?: number; limit?: number },
): Promise<{ quizzes: ApiCommunityQuiz[]; total: number; page: number; pageSize: number }> {
  const { data } = await axiosInstance.get(`/community/${communityId}/quizzes`, { params });
  return data;
}

export async function rsvpCommunityEvent(
  communityId: string,
  eventId: string,
  status: "registered" | "cancelled" = "registered",
): Promise<{ eventId: string; myStatus: "registered" | "attended" | "cancelled"; rsvps: number; attended: number }> {
  const { data } = await axiosInstance.post(`/community/${communityId}/events/${eventId}/rsvp`, { status });
  return data;
}

export async function getCommunityQuizById(
  communityId: string,
  quizId: string,
): Promise<ApiCommunityQuizDetail> {
  const { data } = await axiosInstance.get<{ quiz: ApiCommunityQuizDetail }>(
    `/community/${communityId}/quizzes/${quizId}`,
  );
  return data.quiz;
}

export async function submitCommunityQuizAttempt(
  communityId: string,
  quizId: string,
  payload: { answers: number[]; startedAt?: string },
): Promise<ApiQuizAttemptResult> {
  const { data } = await axiosInstance.post<ApiQuizAttemptResult>(
    `/community/${communityId}/quizzes/${quizId}/attempt`,
    payload,
  );
  return data;
}
