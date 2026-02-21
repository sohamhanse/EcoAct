import type { Response } from "express";
import mongoose from "mongoose";
import { CommunityActivity } from "../models/CommunityActivity.model.js";
import { User } from "../models/User.model.js";
import { success, error } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { formatActivityText } from "../services/communityActivity.service.js";

const CATEGORY_COLORS: Record<string, string> = {
  transport: "#6366F1",
  food: "#F59E0B",
  energy: "#EF4444",
  shopping: "#EC4899",
  water: "#3B82F6",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour ago`;
  if (seconds < 172800) return "Yesterday";
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export async function getFeed(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id;
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    error(res, "Invalid community id", "BAD_REQUEST", 400);
    return;
  }
  const communityId = new mongoose.Types.ObjectId(id);

  const [activities, totalCount] = await Promise.all([
    CommunityActivity.find({ communityId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CommunityActivity.countDocuments({ communityId }),
  ]);

  const userIds = [...new Set(activities.map((a) => a.userId).filter(Boolean))] as mongoose.Types.ObjectId[];
  const users = await User.find({ _id: { $in: userIds } })
    .select("name avatar")
    .lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const items = activities.map((a) => {
    const user = a.userId ? userMap.get(String(a.userId)) : null;
    const userName = user?.name ?? "Someone";
    const { text, subtext } = formatActivityText(a, userName);
    const icon =
      a.type === "mission_complete"
        ? a.metadata?.missionCategory ?? "leaf"
        : a.type === "member_joined"
          ? "person-add"
          : a.type === "badge_earned"
            ? "trophy"
            : a.type === "challenge_completed"
              ? "flag"
              : "trending-up";
    const iconColor =
      a.type === "mission_complete"
        ? CATEGORY_COLORS[a.metadata?.missionCategory ?? ""] ?? "#1A6B3C"
        : "#1A6B3C";

    return {
      _id: String(a._id),
      type: a.type,
      user: user ? { name: user.name, avatar: user.avatar ?? "" } : null,
      text,
      subtext,
      icon,
      iconColor,
      timeAgo: timeAgo(new Date(a.createdAt)),
      createdAt: a.createdAt.toISOString(),
    };
  });

  success(res, {
    activities: items,
    hasMore: skip + items.length < totalCount,
    totalCount,
  });
}
