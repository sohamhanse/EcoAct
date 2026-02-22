import type { Response, NextFunction } from "express";
import mongoose from "mongoose";
import type { AuthRequest } from "./auth.middleware.js";
import { User } from "../models/User.model.js";
import { error } from "../utils/response.utils.js";

export type CommunityAdminRequest = AuthRequest & {
  adminUser?: {
    _id: string;
    role: "admin";
    communityId: string;
    name: string;
    email: string;
  };
};

export async function communityAdminMiddleware(
  req: CommunityAdminRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const communityId = req.params.communityId;
  if (!communityId || !mongoose.Types.ObjectId.isValid(communityId)) {
    error(res, "Invalid community id", "BAD_REQUEST", 400);
    return;
  }

  const user = await User.findById(req.user.userId)
    .select("role communityId name email")
    .lean();
  if (!user) {
    error(res, "User not found", "NOT_FOUND", 404);
    return;
  }
  if (user.role !== "admin") {
    error(res, "Admin role required", "FORBIDDEN", 403);
    return;
  }
  if (!user.communityId || String(user.communityId) !== communityId) {
    error(res, "Access denied for this community", "FORBIDDEN", 403);
    return;
  }

  req.adminUser = {
    _id: String(user._id),
    role: "admin",
    communityId: String(user.communityId),
    name: user.name,
    email: user.email,
  };
  next();
}
