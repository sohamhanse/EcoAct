import { CommunityActivity } from "../models/CommunityActivity.model.js";
import { BADGES } from "./badge.service.js";
import type { Types } from "mongoose";

export type ActivityType =
  | "mission_complete"
  | "member_joined"
  | "badge_earned"
  | "challenge_completed"
  | "milestone";

export async function createMissionComplete(
  communityId: Types.ObjectId,
  userId: Types.ObjectId,
  metadata: { missionTitle: string; missionCo2Saved: number; missionCategory: string },
): Promise<void> {
  await CommunityActivity.create({
    communityId,
    userId,
    type: "mission_complete",
    metadata,
  });
}

export async function createMemberJoined(
  communityId: Types.ObjectId,
  userId: Types.ObjectId,
): Promise<void> {
  await CommunityActivity.create({
    communityId,
    userId,
    type: "member_joined",
    metadata: {},
  });
}

export async function createBadgeEarned(
  communityId: Types.ObjectId,
  userId: Types.ObjectId,
  badgeId: string,
): Promise<void> {
  const badge = BADGES.find((b) => b.id === badgeId);
  await CommunityActivity.create({
    communityId,
    userId,
    type: "badge_earned",
    metadata: { badgeName: badge?.label ?? badgeId },
  });
}

export async function createChallengeCompleted(
  communityId: Types.ObjectId,
  challengeTitle: string,
): Promise<void> {
  await CommunityActivity.create({
    communityId,
    userId: null,
    type: "challenge_completed",
    metadata: { missionTitle: challengeTitle },
  });
}

export async function createMilestone(
  communityId: Types.ObjectId,
  milestoneValue: number,
  milestoneUnit: string,
  options?: { userId?: Types.ObjectId; milestoneLabel?: string },
): Promise<void> {
  await CommunityActivity.create({
    communityId,
    userId: options?.userId ?? null,
    type: "milestone",
    metadata: {
      milestoneValue,
      milestoneUnit,
      milestoneLabel: options?.milestoneLabel,
    },
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function formatActivityText(
  activity: {
    type: ActivityType;
  metadata?: {
    missionTitle?: string;
    missionCo2Saved?: number;
    missionCategory?: string;
    badgeName?: string;
    milestoneValue?: number;
    milestoneUnit?: string;
    milestoneLabel?: string;
  };
  },
  userName: string,
): { text: string; subtext: string } {
  const meta = activity.metadata ?? {};
  switch (activity.type) {
    case "mission_complete":
      return {
        text: `${userName} completed ${meta.missionTitle ?? "a mission"}`,
        subtext: `Saved ${meta.missionCo2Saved ?? 0} kg CO₂  •  ${capitalize(meta.missionCategory ?? "")}`,
      };
    case "member_joined":
      return {
        text: `${userName} joined the community`,
        subtext: "Welcome to the team! 🌿",
      };
    case "badge_earned":
      return {
        text: `${userName} earned the ${meta.badgeName ?? "badge"} badge`,
        subtext: "🏅 Milestone unlocked",
      };
    case "challenge_completed":
      return {
        text: "Community goal reached! 🎉",
        subtext: "Everyone contributed to this win",
      };
    case "milestone":
      return meta.milestoneLabel && userName
        ? {
            text: `${userName} completed: ${meta.milestoneLabel}`,
            subtext: "Personal milestone hit 🌟",
          }
        : {
            text: `Community saved ${meta.milestoneValue ?? 0} kg CO₂ this week`,
            subtext: "Weekly milestone hit 🌍",
          };
    default:
      return { text: "Activity", subtext: "" };
  }
}
