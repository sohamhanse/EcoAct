import { axiosInstance } from "./axiosInstance";
import type { CommunityChallengeResponse } from "@/src/types";

export async function getActiveChallenge(communityId: string | null): Promise<CommunityChallengeResponse | null> {
  if (!communityId) return null;
  const { data } = await axiosInstance.get<{ challenge: CommunityChallengeResponse | null }>(
    `/community/${communityId}/challenge/active`,
  );
  return data.challenge ?? null;
}

export async function getChallengeHistory(communityId: string): Promise<CommunityChallengeResponse[]> {
  const { data } = await axiosInstance.get<{ challenges: CommunityChallengeResponse[] }>(
    `/community/${communityId}/challenge/history`,
  );
  return data.challenges ?? [];
}
