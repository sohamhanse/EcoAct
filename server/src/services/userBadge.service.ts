import mongoose from "mongoose";
import { User } from "../models/User.model.js";
import { CommunityActivity } from "../models/CommunityActivity.model.js";
import { BADGES } from "./badge.service.js";

export async function awardBadge(userId: string, badgeId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return false;
  const badgeMeta = BADGES.find((b) => b.id === badgeId);

  const updated = await User.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(userId),
      "badges.badgeId": { $ne: badgeId },
    },
    {
      $push: {
        badges: {
          badgeId,
          earnedAt: new Date(),
        },
      },
    },
    {
      new: true,
      select: "communityId",
    },
  ).lean();

  if (!updated) return false;

  if (updated.communityId) {
    await CommunityActivity.create({
      communityId: updated.communityId,
      userId: new mongoose.Types.ObjectId(userId),
      type: "badge_earned",
      metadata: { badgeName: badgeMeta?.label ?? badgeId },
    });
  }

  return true;
}

