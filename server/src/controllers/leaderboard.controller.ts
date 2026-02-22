import type { Response } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.model.js";
import { success, error } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

const PAGE_SIZE = 20;

function getStartOfWeek(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

/**
 * Returns the current user's rank (1-based) and total count for global, community (if in one), and weekly.
 * Requires auth.
 */
export async function me(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const userId = new mongoose.Types.ObjectId(req.user.userId);
  const user = await User.findById(userId).select("totalPoints communityId").lean();
  if (!user) {
    error(res, "User not found", "NOT_FOUND", 404);
    return;
  }

  const [globalRank, communityRank, weeklyRank] = await Promise.all([
    User.countDocuments({ totalPoints: { $gt: user.totalPoints } }).then((n) => n + 1),
    user.communityId
      ? User.countDocuments({ communityId: user.communityId, totalPoints: { $gt: user.totalPoints } }).then((n) => n + 1)
      : Promise.resolve(null),
    (async () => {
      const UserMission = (await import("../models/UserMission.model.js")).UserMission;
      const startOfWeek = getStartOfWeek();
      const myWeekly = await UserMission.aggregate([
        { $match: { userId, completedAt: { $gte: startOfWeek } } },
        { $group: { _id: null, points: { $sum: "$pointsAwarded" } } },
      ]);
      const myPoints = myWeekly[0]?.points ?? 0;
      const betterCount = await UserMission.aggregate([
        { $match: { completedAt: { $gte: startOfWeek } } },
        { $group: { _id: "$userId", points: { $sum: "$pointsAwarded" } } },
        { $match: { points: { $gt: myPoints } } },
        { $count: "n" },
      ]);
      return (betterCount[0]?.n ?? 0) + 1;
    })(),
  ]);

  const [totalGlobal, totalCommunity, totalWeekly] = await Promise.all([
    User.countDocuments(),
    user.communityId ? User.countDocuments({ communityId: user.communityId }) : Promise.resolve(null),
    (async () => {
      const UserMission = (await import("../models/UserMission.model.js")).UserMission;
      return UserMission.distinct("userId", { completedAt: { $gte: getStartOfWeek() } }).then((ids) => ids.length);
    })(),
  ]);

  success(res, {
    globalRank,
    totalGlobal,
    communityRank: communityRank ?? null,
    totalCommunity: totalCommunity ?? null,
    weeklyRank,
    totalWeekly,
  });
}

export async function global(req: AuthRequest, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const [users, total] = await Promise.all([
    User.find()
      .select("name avatar totalPoints totalCo2Saved")
      .sort({ totalPoints: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    User.countDocuments(),
  ]);
  const ranks = users.map((u, i) => ({ rank: skip + i + 1, ...u }));
  success(res, { leaderboard: ranks, total, page, pageSize: PAGE_SIZE });
}

export async function community(req: AuthRequest, res: Response): Promise<void> {
  const communityId = req.params.communityId;
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const [users, total] = await Promise.all([
    User.find({ communityId })
      .select("name avatar totalPoints totalCo2Saved")
      .sort({ totalPoints: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    User.countDocuments({ communityId }),
  ]);
  const ranks = users.map((u, i) => ({ rank: skip + i + 1, ...u }));
  success(res, { leaderboard: ranks, total, page, pageSize: PAGE_SIZE });
}

export async function weekly(req: AuthRequest, res: Response): Promise<void> {
  const startOfWeek = getStartOfWeek();
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const UserMission = (await import("../models/UserMission.model.js")).UserMission;
  const aggregated = await UserMission.aggregate([
    { $match: { completedAt: { $gte: startOfWeek } } },
    { $group: { _id: "$userId", points: { $sum: "$pointsAwarded" }, co2: { $sum: "$co2SavedAwarded" } } },
    { $sort: { points: -1 } },
    { $skip: skip },
    { $limit: PAGE_SIZE },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $project: { rank: { $literal: 0 }, points: 1, co2: 1, name: "$user.name", avatar: "$user.avatar" } },
  ]);
  const total = await UserMission.distinct("userId", { completedAt: { $gte: startOfWeek } }).then((ids) => ids.length);
  const leaderboard = aggregated.map((r, i) => ({
    rank: skip + i + 1,
    _id: r._id,
    name: r.name,
    avatar: r.avatar,
    totalPoints: r.points,
    totalCo2Saved: r.co2,
  }));
  success(res, { leaderboard, total, page, pageSize: PAGE_SIZE });
}
