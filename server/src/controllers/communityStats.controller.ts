import type { Response } from "express";
import mongoose from "mongoose";
import { Community } from "../models/Community.model.js";
import { UserMission } from "../models/UserMission.model.js";
import { success, error } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

function getStartOfWeek(d: Date): Date {
  const start = new Date(d);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[d.getUTCDay()];
}

export async function getStats(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    error(res, "Invalid community id", "BAD_REQUEST", 400);
    return;
  }
  const communityId = new mongoose.Types.ObjectId(id);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const startOfWeek = getStartOfWeek(now);

  const community = await Community.findById(communityId).lean();
  if (!community) {
    error(res, "Community not found", "NOT_FOUND", 404);
    return;
  }

  const [thisMonthStats, lastMonthStats, weeklyTrend, topContributors] = await Promise.all([
    UserMission.aggregate([
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      {
        $match: {
          "user.communityId": communityId,
          completedAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalCo2: { $sum: "$co2SavedAwarded" },
          missionCount: { $sum: 1 },
        },
      },
    ]),
    UserMission.aggregate([
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      {
        $match: {
          "user.communityId": communityId,
          completedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      { $group: { _id: null, totalCo2: { $sum: "$co2SavedAwarded" } } },
    ]),
    UserMission.aggregate([
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      {
        $match: {
          "user.communityId": communityId,
          completedAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          co2Saved: { $sum: "$co2SavedAwarded" },
          missionCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    UserMission.aggregate([
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      {
        $match: {
          "user.communityId": communityId,
          completedAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: "$userId",
          name: { $first: "$user.name" },
          avatar: { $first: "$user.avatar" },
          co2Saved: { $sum: "$co2SavedAwarded" },
          missionCount: { $sum: 1 },
        },
      },
      { $sort: { co2Saved: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const thisMonthCo2 = thisMonthStats[0]?.totalCo2 ?? 0;
  const lastMonthCo2 = lastMonthStats[0]?.totalCo2 ?? 0;
  const monthOverMonthChange =
    lastMonthCo2 > 0
      ? Math.round(((thisMonthCo2 - lastMonthCo2) / lastMonthCo2) * 100)
      : 0;

  success(res, {
    community: {
      name: community.name,
      type: community.type,
      memberCount: community.memberCount,
    },
    stats: {
      totalCo2SavedAllTime: community.totalCo2Saved,
      thisMonthCo2: Math.round(thisMonthCo2),
      lastMonthCo2: Math.round(lastMonthCo2),
      monthOverMonthChange,
      thisMonthMissions: thisMonthStats[0]?.missionCount ?? 0,
      avgCo2PerMember: Math.round(thisMonthCo2 / (community.memberCount || 1)),
    },
    weeklyTrend: weeklyTrend.map((d: { _id: string; co2Saved: number; missionCount: number }) => ({
      date: d._id,
      dayLabel: formatDayLabel(d._id),
      co2Saved: Math.round(d.co2Saved),
      missionCount: d.missionCount,
    })),
    topContributors: topContributors.map(
      (
        c: {
          _id: mongoose.Types.ObjectId;
          name: string;
          avatar: string;
          co2Saved: number;
          missionCount: number;
        },
        i: number,
      ) => ({
        rank: i + 1,
        userId: String(c._id),
        name: c.name,
        avatar: c.avatar ?? "",
        co2Saved: Math.round(c.co2Saved),
        missionCount: c.missionCount,
      }),
    ),
  });
}
