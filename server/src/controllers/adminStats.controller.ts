import type { Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Community } from "../models/Community.model.js";
import { UserMission } from "../models/UserMission.model.js";
import { CommunityEvent } from "../models/CommunityEvent.model.js";
import { EventParticipation } from "../models/EventParticipation.model.js";
import { CommunityQuiz } from "../models/CommunityQuiz.model.js";
import { QuizAttempt } from "../models/QuizAttempt.model.js";
import type { CommunityAdminRequest } from "../middleware/communityAdmin.middleware.js";
import { success, error } from "../utils/response.utils.js";

const statsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  granularity: z.enum(["daily", "weekly", "monthly"]).optional(),
});

type Granularity = "daily" | "weekly" | "monthly";

function resolveDateRange(query: unknown): {
  from: Date;
  to: Date;
  granularity: Granularity;
} | null {
  const parsed = statsQuerySchema.safeParse(query);
  if (!parsed.success) return null;
  const now = new Date();
  const to = parsed.data.to ? new Date(parsed.data.to) : now;
  const from = parsed.data.from
    ? new Date(parsed.data.from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  const granularity = parsed.data.granularity ?? "daily";
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return null;
  return { from, to, granularity };
}

function getBucketFormat(granularity: Granularity): string {
  if (granularity === "monthly") return "%Y-%m";
  if (granularity === "weekly") return "%G-W%V";
  return "%Y-%m-%d";
}

export async function overview(req: CommunityAdminRequest, res: Response): Promise<void> {
  const communityId = req.params.communityId;
  if (!mongoose.Types.ObjectId.isValid(communityId)) {
    error(res, "Invalid community id", "BAD_REQUEST", 400);
    return;
  }
  const range = resolveDateRange(req.query);
  if (!range) {
    error(res, "Invalid date range", "BAD_REQUEST", 400);
    return;
  }
  const communityObjectId = new mongoose.Types.ObjectId(communityId);
  const community = await Community.findById(communityObjectId).lean();
  if (!community) {
    error(res, "Community not found", "NOT_FOUND", 404);
    return;
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [missionAgg, active7, active30, eventCount, rsvps, quizCount, attemptAgg] = await Promise.all([
    UserMission.aggregate([
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $match: { "user.communityId": communityObjectId, completedAt: { $gte: range.from, $lte: range.to } } },
      {
        $group: {
          _id: null,
          missionsCompleted: { $sum: 1 },
          co2Saved: { $sum: "$co2SavedAwarded" },
          pointsAwarded: { $sum: "$pointsAwarded" },
        },
      },
    ]),
    UserMission.aggregate([
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $match: { "user.communityId": communityObjectId, completedAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: "$userId" } },
      { $count: "count" },
    ]),
    UserMission.aggregate([
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $match: { "user.communityId": communityObjectId, completedAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$userId" } },
      { $count: "count" },
    ]),
    CommunityEvent.countDocuments({
      communityId: communityObjectId,
      startAt: { $gte: range.from, $lte: range.to },
    }),
    EventParticipation.countDocuments({
      communityId: communityObjectId,
      registeredAt: { $gte: range.from, $lte: range.to },
      status: { $in: ["registered", "attended"] },
    }),
    CommunityQuiz.countDocuments({
      communityId: communityObjectId,
      createdAt: { $gte: range.from, $lte: range.to },
    }),
    QuizAttempt.aggregate([
      { $match: { communityId: communityObjectId, completedAt: { $gte: range.from, $lte: range.to } } },
      {
        $group: {
          _id: null,
          attempts: { $sum: 1 },
          avgScore: { $avg: "$scorePercent" },
        },
      },
    ]),
  ]);

  success(res, {
    community: {
      _id: String(community._id),
      name: community.name,
      type: community.type,
    },
    dateRange: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    },
    kpis: {
      totalMembers: community.memberCount,
      activeMembers7d: active7[0]?.count ?? 0,
      activeMembers30d: active30[0]?.count ?? 0,
      totalCo2Saved: community.totalCo2Saved,
      totalPoints: community.totalPoints,
      missionsCompleted: missionAgg[0]?.missionsCompleted ?? 0,
      co2SavedInRange: Math.round(missionAgg[0]?.co2Saved ?? 0),
      pointsInRange: Math.round(missionAgg[0]?.pointsAwarded ?? 0),
      eventsInRange: eventCount,
      eventRsvpsInRange: rsvps,
      quizzesInRange: quizCount,
      quizAttemptsInRange: attemptAgg[0]?.attempts ?? 0,
      quizAverageScoreInRange: Math.round(attemptAgg[0]?.avgScore ?? 0),
    },
  });
}

export async function timeseries(req: CommunityAdminRequest, res: Response): Promise<void> {
  const communityId = req.params.communityId;
  if (!mongoose.Types.ObjectId.isValid(communityId)) {
    error(res, "Invalid community id", "BAD_REQUEST", 400);
    return;
  }
  const range = resolveDateRange(req.query);
  if (!range) {
    error(res, "Invalid date range", "BAD_REQUEST", 400);
    return;
  }
  const communityObjectId = new mongoose.Types.ObjectId(communityId);
  const bucketFormat = getBucketFormat(range.granularity);

  const [missionSeries, eventSeries, quizSeries] = await Promise.all([
    UserMission.aggregate([
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $match: { "user.communityId": communityObjectId, completedAt: { $gte: range.from, $lte: range.to } } },
      {
        $group: {
          _id: { $dateToString: { format: bucketFormat, date: "$completedAt" } },
          missionsCompleted: { $sum: 1 },
          co2Saved: { $sum: "$co2SavedAwarded" },
          users: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          _id: 1,
          missionsCompleted: 1,
          co2Saved: 1,
          activeUsers: { $size: "$users" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    EventParticipation.aggregate([
      {
        $match: {
          communityId: communityObjectId,
          registeredAt: { $gte: range.from, $lte: range.to },
          status: { $in: ["registered", "attended"] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: bucketFormat, date: "$registeredAt" } },
          eventRsvps: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    QuizAttempt.aggregate([
      { $match: { communityId: communityObjectId, completedAt: { $gte: range.from, $lte: range.to } } },
      {
        $group: {
          _id: { $dateToString: { format: bucketFormat, date: "$completedAt" } },
          quizAttempts: { $sum: 1 },
          avgQuizScore: { $avg: "$scorePercent" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const map = new Map<
    string,
    {
      bucket: string;
      co2Saved: number;
      missionsCompleted: number;
      activeUsers: number;
      eventRsvps: number;
      quizAttempts: number;
      avgQuizScore: number;
    }
  >();

  const ensure = (bucket: string) => {
    if (!map.has(bucket)) {
      map.set(bucket, {
        bucket,
        co2Saved: 0,
        missionsCompleted: 0,
        activeUsers: 0,
        eventRsvps: 0,
        quizAttempts: 0,
        avgQuizScore: 0,
      });
    }
    return map.get(bucket)!;
  };

  for (const row of missionSeries) {
    const item = ensure(String(row._id));
    item.co2Saved = Math.round(row.co2Saved ?? 0);
    item.missionsCompleted = row.missionsCompleted ?? 0;
    item.activeUsers = row.activeUsers ?? 0;
  }
  for (const row of eventSeries) {
    const item = ensure(String(row._id));
    item.eventRsvps = row.eventRsvps ?? 0;
  }
  for (const row of quizSeries) {
    const item = ensure(String(row._id));
    item.quizAttempts = row.quizAttempts ?? 0;
    item.avgQuizScore = Math.round(row.avgQuizScore ?? 0);
  }

  const series = [...map.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
  success(res, {
    granularity: range.granularity,
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    series,
  });
}
