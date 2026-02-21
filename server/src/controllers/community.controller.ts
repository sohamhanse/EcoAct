import type { Response } from "express";
import mongoose from "mongoose";
import { Community } from "../models/Community.model.js";
import { User } from "../models/User.model.js";
import { success, error } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { ensureActiveChallenge } from "../services/challenge.service.js";
import { createMemberJoined } from "../services/communityActivity.service.js";

export async function list(req: AuthRequest, res: Response): Promise<void> {
  const type = req.query.type as string | undefined;
  const search = (req.query.search as string)?.trim();
  const filter: Record<string, unknown> = {};
  if (type) filter.type = type;
  if (search) filter.name = { $regex: search, $options: "i" };
  const communities = await Community.find(filter).sort({ totalCo2Saved: -1 }).limit(50).lean();
  success(res, { communities });
}

export async function getById(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id;
  const community = await Community.findById(id).lean();
  if (!community) {
    error(res, "Community not found", "NOT_FOUND", 404);
    return;
  }
  const topContributors = await User.find({ communityId: id })
    .select("name avatar totalPoints totalCo2Saved")
    .sort({ totalPoints: -1 })
    .limit(5)
    .lean();
  success(res, { community, topContributors });
}

export async function join(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const id = req.params.id;
  const community = await Community.findById(id);
  if (!community) {
    error(res, "Community not found", "NOT_FOUND", 404);
    return;
  }
  const user = await User.findById(req.user.userId);
  if (!user) {
    error(res, "User not found", "NOT_FOUND", 404);
    return;
  }
  if (user.communityId?.toString() === id) {
    error(res, "Already in this community", "ALREADY_JOINED", 400);
    return;
  }
  if (user.communityId) {
    await Community.findByIdAndUpdate(user.communityId, { $inc: { memberCount: -1 } });
  }
  await User.findByIdAndUpdate(req.user.userId, { communityId: id });
  await Community.findByIdAndUpdate(id, {
    $inc: {
      memberCount: 1,
      totalPoints: user.totalPoints,
      totalCo2Saved: user.totalCo2Saved,
    },
  });
  await ensureActiveChallenge(new mongoose.Types.ObjectId(id));
  await createMemberJoined(
    new mongoose.Types.ObjectId(id),
    user._id as mongoose.Types.ObjectId,
  );
  const updated = await Community.findById(id).lean();
  success(res, { community: updated });
}

export async function leave(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const user = await User.findById(req.user.userId);
  if (!user?.communityId) {
    error(res, "Not in a community", "BAD_REQUEST", 400);
    return;
  }
  await Community.findByIdAndUpdate(user.communityId, {
    $inc: { memberCount: -1, totalPoints: -user.totalPoints, totalCo2Saved: -user.totalCo2Saved },
  });
  await User.findByIdAndUpdate(req.user.userId, { communityId: null });
  success(res, { message: "Left community" });
}

export async function mine(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const user = await User.findById(req.user.userId).select("communityId").lean();
  if (!user?.communityId) {
    success(res, { community: null });
    return;
  }
  const community = await Community.findById(user.communityId).lean();
  const topContributors = await User.find({ communityId: user.communityId })
    .select("name avatar totalPoints totalCo2Saved")
    .sort({ totalPoints: -1 })
    .limit(5)
    .lean();
  success(res, { community, topContributors });
}
