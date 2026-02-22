import type { Response } from "express";
import { RecurringMilestone } from "../models/RecurringMilestone.model.js";
import { MILESTONE_TEMPLATES } from "../constants/milestones.js";
import { success, error } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

const ICON_BY_TYPE: Record<string, string> = {
  weekly_co2: "leaf",
  weekly_missions: "checkbox",
  monthly_co2: "earth",
  monthly_missions: "checkmark-done",
  monthly_streak: "flame",
};

function daysRemaining(periodEnd: Date): number {
  const now = new Date();
  const end = new Date(periodEnd);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function periodLabel(period: string, periodStart: Date): string {
  if (period === "weekly") return "This week";
  const d = new Date(periodStart);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export async function getActive(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const milestones = await RecurringMilestone.find({
    userId: req.user.userId,
    status: "active",
  })
    .sort({ period: 1, type: 1 })
    .lean();

  const formatted = milestones.map((m) => ({
    _id: m._id,
    type: m.type,
    period: m.period,
    label: m.goal.label,
    description: m.goal.label,
    icon: ICON_BY_TYPE[m.type] ?? "leaf",
    difficulty: "medium",
    progress: {
      currentValue: m.progress.currentValue,
      targetValue: m.goal.targetValue,
      percentComplete: m.progress.percentComplete,
      unit: m.goal.unit,
    },
    reward: {
      bonusPoints: m.reward.bonusPoints,
      badgeId: m.reward.badgeId,
    },
    daysRemaining: daysRemaining(m.periodEnd),
    status: "active",
    periodLabel: periodLabel(m.period, m.periodStart),
  }));

  success(res, { milestones: formatted });
}

export async function getHistory(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const page = Math.max(1, parseInt(String(req.query.page ?? 1), 10));
  const limit = Math.min(20, Math.max(5, parseInt(String(req.query.limit ?? 10), 10)));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    RecurringMilestone.find({ userId: req.user.userId, status: { $in: ["completed", "failed"] } })
      .sort({ periodEnd: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    RecurringMilestone.countDocuments({
      userId: req.user.userId,
      status: { $in: ["completed", "failed"] },
    }),
  ]);

  success(res, {
    milestones: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function getSummary(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const completed = await RecurringMilestone.countDocuments({
    userId: req.user.userId,
    status: "completed",
    completedAt: { $gte: fourWeeksAgo },
  });
  const failed = await RecurringMilestone.countDocuments({
    userId: req.user.userId,
    status: "failed",
    periodEnd: { $gte: fourWeeksAgo },
  });
  const total = completed + failed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  success(res, {
    completedLast4Weeks: completed,
    failedLast4Weeks: failed,
    completionRatePercent: rate,
  });
}
