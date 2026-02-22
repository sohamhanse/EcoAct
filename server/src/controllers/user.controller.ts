import type { Response } from "express";
import { z } from "zod";
import { User } from "../models/User.model.js";
import { UserMission } from "../models/UserMission.model.js";
import { FootprintLog } from "../models/FootprintLog.model.js";
import { BADGES } from "../services/badge.service.js";
import { success, error } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

const settingsSchema = z.object({
  expoPushToken: z.string().trim().min(1).max(255).nullable().optional(),
});

export async function profile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const user = await User.findById(req.user.userId).select("-__v").lean();
  if (!user) {
    error(res, "User not found", "NOT_FOUND", 404);
    return;
  }
  success(res, { user });
}

export async function badges(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const user = await User.findById(req.user.userId).select("badges").lean();
  const earnedIds = new Set((user?.badges ?? []).map((b) => b.badgeId));
  const allBadges = BADGES.map((b) => ({ ...b, earned: earnedIds.has(b.id) }));
  success(res, { badges: allBadges });
}

export async function streakCalendar(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const completions = await UserMission.find({
    userId: req.user.userId,
    completedAt: { $gte: thirtyDaysAgo },
  })
    .select("completedAt")
    .lean();
  const byDate = new Set<string>();
  for (const c of completions) {
    const d = new Date(c.completedAt);
    byDate.add(d.toISOString().slice(0, 10));
  }
  const calendar: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    calendar.push({ date: dateStr, count: byDate.has(dateStr) ? 1 : 0 });
  }
  success(res, { calendar });
}

export async function settings(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const parsed = settingsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    error(res, "Invalid settings payload", "BAD_REQUEST", 400);
    return;
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.expoPushToken !== undefined) {
    update.expoPushToken = parsed.data.expoPushToken;
  }

  if (Object.keys(update).length > 0) {
    await User.findByIdAndUpdate(req.user.userId, { $set: update });
  }

  success(res, { message: "Settings updated" });
}
