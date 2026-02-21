import type { Response } from "express";
import { User } from "../models/User.model.js";
import { success, error } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

const PAGE_SIZE = 20;

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
  const startOfWeek = new Date();
  startOfWeek.setHours(0, 0, 0, 0);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
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
