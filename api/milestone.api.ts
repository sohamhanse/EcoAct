import { axiosInstance } from "./axiosInstance";

export interface ActiveMilestone {
  _id: string;
  type: string;
  period: "weekly" | "monthly";
  label: string;
  description: string;
  icon: string;
  difficulty: string;
  progress: {
    currentValue: number;
    targetValue: number;
    percentComplete: number;
    unit: string;
  };
  reward: {
    bonusPoints: number;
    badgeId: string | null;
  };
  daysRemaining: number;
  status: string;
  periodLabel: string;
}

export interface MilestoneHistoryItem {
  _id: string;
  type: string;
  period: string;
  goal: { targetValue: number; unit: string; label: string };
  progress: { currentValue: number; percentComplete: number };
  status: "completed" | "failed";
  reward: { bonusPoints: number; badgeId: string | null };
  completedAt: string | null;
  periodEnd: string;
}

export async function getActiveMilestones(): Promise<{ milestones: ActiveMilestone[] }> {
  const { data } = await axiosInstance.get<{ milestones: ActiveMilestone[] }>("/milestones/active");
  return data;
}

export async function getMilestoneHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<{
  milestones: MilestoneHistoryItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const { data } = await axiosInstance.get<{
    milestones: MilestoneHistoryItem[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>("/milestones/history", { params });
  return data;
}

export async function getMilestoneSummary(): Promise<{
  completedLast4Weeks: number;
  failedLast4Weeks: number;
  completionRatePercent: number;
}> {
  const { data } = await axiosInstance.get<{
    completedLast4Weeks: number;
    failedLast4Weeks: number;
    completionRatePercent: number;
  }>("/milestones/summary");
  return data;
}
