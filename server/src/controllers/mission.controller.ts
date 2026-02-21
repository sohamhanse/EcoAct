import type { Response } from "express";
import mongoose from "mongoose";
import { Mission } from "../models/Mission.model.js";
import { UserMission } from "../models/UserMission.model.js";
import { User } from "../models/User.model.js";
import { Community } from "../models/Community.model.js";
import { calculatePoints, getStreakMultiplier } from "../services/points.service.js";
import { updateStreak } from "../services/streak.service.js";
import { getNewlyEarnedBadges } from "../services/badge.service.js";
import { contributeToCommunityChallenge } from "../services/challenge.service.js";
import { createMissionComplete, createBadgeEarned } from "../services/communityActivity.service.js";
import { success, error } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const category = req.query.category as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;
  const filter: Record<string, unknown> = { isActive: true };
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  const missions = await Mission.find(filter).sort({ category: 1, basePoints: 1 }).lean();
  success(res, { missions });
}

export async function recommended(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const FootprintLog = mongoose.model("FootprintLog");

  const latestLog = await FootprintLog.findOne({ userId: req.user.userId })
    .sort({ loggedAt: -1 })
    .lean();

  let topCategory = "transport";
  if (latestLog?.breakdown) {
    const b = latestLog.breakdown as { transport: number; food: number; energy: number; shopping: number };
    const entries = Object.entries(b) as [string, number][];
    const max = entries.reduce((a, [k, v]) => (v > a[1] ? [k, v] : a), ["transport", 0]);
    topCategory = max[0];
  }
  const missions = await Mission.find({ isActive: true, category: topCategory })
    .limit(5)
    .lean();
  success(res, { missions });
}

export async function complete(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const missionId = req.params.id;
  const mission = await Mission.findById(missionId);
  if (!mission) {
    error(res, "Mission not found", "NOT_FOUND", 404);
    return;
  }
  const existing = await UserMission.findOne({ userId: req.user.userId, missionId });
  if (existing) {
    error(res, "Mission already completed", "ALREADY_COMPLETED", 400);
    return;
  }
  const user = await User.findById(req.user.userId);
  if (!user) {
    error(res, "User not found", "NOT_FOUND", 404);
    return;
  }
  const today = new Date();
  const { currentStreak, longestStreak } = updateStreak(
    user.lastActiveDate,
    user.currentStreak,
    user.longestStreak,
    today,
  );
  const multiplier = getStreakMultiplier(currentStreak);
  const pointsAwarded = calculatePoints(mission.basePoints, currentStreak);
  await UserMission.create({
    userId: req.user.userId,
    missionId: mission._id,
    pointsAwarded,
    co2SavedAwarded: mission.co2Saved,
    streakMultiplier: multiplier,
  });
  const prevBadges = user.badges.map((b) => b.badgeId);
  const missionsCount = await UserMission.countDocuments({ userId: req.user.userId });
  const newCo2 = user.totalCo2Saved + mission.co2Saved;
  const newPoints = user.totalPoints + pointsAwarded;
  const newlyEarned = getNewlyEarnedBadges(prevBadges, {
    missionsCount,
    totalCo2Saved: newCo2,
    currentStreak: currentStreak,
    hasCommunity: !!user.communityId,
  });
  const badgeEntries = [
    ...user.badges,
    ...newlyEarned.map((badgeId) => ({ badgeId, earnedAt: today })),
  ];
  await User.findByIdAndUpdate(req.user.userId, {
    totalPoints: newPoints,
    totalCo2Saved: newCo2,
    currentStreak: currentStreak,
    longestStreak: longestStreak,
    lastActiveDate: today,
    badges: badgeEntries,
  });
  if (user.communityId) {
    await Community.findByIdAndUpdate(user.communityId, {
      $inc: { totalCo2Saved: mission.co2Saved, totalPoints: pointsAwarded },
    });
    await contributeToCommunityChallenge(req.user!.userId, mission.co2Saved);
    await createMissionComplete(user.communityId, user._id as mongoose.Types.ObjectId, {
      missionTitle: mission.title,
      missionCo2Saved: mission.co2Saved,
      missionCategory: mission.category,
    });
    for (const badgeId of newlyEarned) {
      await createBadgeEarned(user.communityId, user._id as mongoose.Types.ObjectId, badgeId);
    }
  }
  success(res, {
    pointsAwarded,
    co2SavedAwarded: mission.co2Saved,
    streakMultiplier: multiplier,
    newTotalPoints: newPoints,
    newTotalCo2Saved: newCo2,
    currentStreak: currentStreak,
    newlyEarnedBadges: newlyEarned,
  });
}

export async function completed(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const list = await UserMission.find({ userId: req.user.userId })
    .populate("missionId", "title description category co2Saved basePoints difficulty icon")
    .sort({ completedAt: -1 })
    .lean();
  success(res, { completed: list });
}

export async function stats(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const uid = new mongoose.Types.ObjectId(req.user.userId);
  const [missionsCount, aggCo2, aggPoints] = await Promise.all([
    UserMission.countDocuments({ userId: req.user.userId }),
    UserMission.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: null, sum: { $sum: "$co2SavedAwarded" } } },
    ]),
    UserMission.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: null, sum: { $sum: "$pointsAwarded" } } },
    ]),
  ]);
  const totalCo2 = aggCo2[0]?.sum ?? 0;
  const totalPoints = aggPoints[0]?.sum ?? 0;
  success(res, { missionsCount, totalCo2Saved: totalCo2, totalPoints });
}
