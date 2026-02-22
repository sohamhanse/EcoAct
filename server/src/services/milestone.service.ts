import { RecurringMilestone } from "../models/RecurringMilestone.model.js";
import { User } from "../models/User.model.js";
import { MILESTONE_TEMPLATES } from "../constants/milestones.js";
import { createMilestone } from "./communityActivity.service.js";
import type { Types } from "mongoose";

function getWeekKey(d: Date): string {
  const start = new Date(d);
  start.setDate(start.getDate() - start.getDay());
  const y = start.getFullYear();
  const w = Math.ceil((start.getTime() - new Date(y, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${y}-W${String(w).padStart(2, "0")}`;
}

function getMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getWeekStart(d: Date): Date {
  const start = new Date(d);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function getWeekEnd(d: Date): Date {
  const end = getWeekStart(d);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getMonthStart(d: Date): Date {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  return start;
}

function getMonthEnd(d: Date): Date {
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return end;
}

async function getUserDifficulty(userId: string): Promise<"easy" | "medium" | "hard"> {
  const completed = await RecurringMilestone.countDocuments({
    userId: new (await import("mongoose")).Types.ObjectId(userId),
    status: "completed",
  });
  if (completed < 4) return "easy";
  if (completed < 12) return "medium";
  return "hard";
}

export async function ensureMilestonesForCurrentPeriod(userId: string): Promise<void> {
  const weekKey = getWeekKey(new Date());
  const monthKey = getMonthKey(new Date());
  const difficulty = await getUserDifficulty(userId);

  const weeklyCo2 = MILESTONE_TEMPLATES.find(
    (t) => t.period === "weekly" && t.type === "weekly_co2" && t.difficulty === difficulty
  );
  const weeklyMissions = MILESTONE_TEMPLATES.find((t) => t.id === "weekly_missions_5");
  const monthlyCo2 = MILESTONE_TEMPLATES.find(
    (t) => t.period === "monthly" && t.type === "monthly_co2" && t.difficulty === difficulty
  );
  const monthlyMissions = MILESTONE_TEMPLATES.find((t) => t.id === "monthly_missions_20");

  const toCreate = [
    { template: weeklyCo2, periodKey: weekKey, period: "weekly" as const },
    { template: weeklyMissions, periodKey: weekKey, period: "weekly" as const },
    { template: monthlyCo2, periodKey: monthKey, period: "monthly" as const },
    { template: monthlyMissions, periodKey: monthKey, period: "monthly" as const },
  ].filter((x) => x.template);

  const uid = new (await import("mongoose")).Types.ObjectId(userId);

  for (const { template, periodKey, period } of toCreate) {
    if (!template) continue;
    const periodStart = period === "weekly" ? getWeekStart(new Date()) : getMonthStart(new Date());
    const periodEnd = period === "weekly" ? getWeekEnd(new Date()) : getMonthEnd(new Date());

    await RecurringMilestone.findOneAndUpdate(
      { userId: uid, type: template.type, periodKey },
      {
        $setOnInsert: {
          userId: uid,
          type: template.type,
          period,
          periodKey,
          goal: {
            targetValue: template.targetValue,
            unit: template.unit,
            label: template.label,
          },
          reward: {
            bonusPoints: template.bonusPoints,
            badgeId: template.badgeId,
          },
          periodStart,
          periodEnd,
        },
      },
      { upsert: true, new: true }
    );
  }
}

export async function updateRecurringMilestones(
  userId: string,
  co2Saved: number
): Promise<void> {
  const user = await User.findById(userId);
  if (!user) return;

  await ensureMilestonesForCurrentPeriod(userId);

  const activeMilestones = await RecurringMilestone.find({
    userId: new (await import("mongoose")).Types.ObjectId(userId),
    status: "active",
  });

  const now = new Date();
  const uid = userId as unknown as Types.ObjectId;

  for (const milestone of activeMilestones) {
    let increment = 0;

    switch (milestone.type) {
      case "weekly_co2":
      case "monthly_co2":
        increment = co2Saved;
        break;
      case "weekly_missions":
      case "monthly_missions":
        increment = 1;
        break;
      case "monthly_streak":
        continue;
      default:
        continue;
    }

    milestone.progress.currentValue += increment;
    milestone.progress.percentComplete = Math.min(
      100,
      Math.round((milestone.progress.currentValue / milestone.goal.targetValue) * 100)
    );

    if (
      milestone.progress.currentValue >= milestone.goal.targetValue &&
      milestone.status === "active"
    ) {
      milestone.status = "completed";
      milestone.completedAt = now;

      const update: Record<string, unknown> = {
        $inc: { totalPoints: milestone.reward.bonusPoints },
      };
      if (milestone.reward.badgeId) {
        const existingBadges = user.badges.map((b) => b.badgeId);
        if (!existingBadges.includes(milestone.reward.badgeId)) {
          (update as { $push?: unknown }).$push = {
            badges: { badgeId: milestone.reward.badgeId, earnedAt: now },
          };
        }
      }
      await User.findByIdAndUpdate(userId, update);

      if (user.communityId) {
        await createMilestone(
          user.communityId,
          milestone.goal.targetValue,
          milestone.goal.unit,
          { userId: user._id as Types.ObjectId, milestoneLabel: milestone.goal.label }
        );
      }
    }

    await milestone.save();
  }
}

export async function expireRecurringMilestones(): Promise<void> {
  await RecurringMilestone.updateMany(
    { status: "active", periodEnd: { $lt: new Date() } },
    { $set: { status: "failed" } }
  );
}
