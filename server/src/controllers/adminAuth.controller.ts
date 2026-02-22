import type { Response } from "express";
import { z } from "zod";
import { Community } from "../models/Community.model.js";
import { User } from "../models/User.model.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { signAccessToken, signRefreshToken, type TokenPayload } from "../utils/jwt.utils.js";
import { success, error } from "../utils/response.utils.js";

const loginSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().trim().min(2).max(80).optional(),
  communityId: z.string().optional(),
});

function demoAllowed(): boolean {
  return (
    process.env.ALLOW_DEMO_AUTH === "true" ||
    process.env.ALLOW_DEMO_AUTH === "1" ||
    process.env.NODE_ENV !== "production"
  );
}

export async function demoLogin(req: AuthRequest, res: Response): Promise<void> {
  if (!demoAllowed()) {
    error(res, "Admin demo auth disabled in production", "FORBIDDEN", 403);
    return;
  }
  const parsed = loginSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    error(res, "Invalid request payload", "BAD_REQUEST", 400);
    return;
  }
  const body = parsed.data;

  let user = body.email
    ? await User.findOne({ email: body.email.toLowerCase() })
    : await User.findOne({ role: "admin" }).sort({ createdAt: 1 });

  if (!user) {
    const community =
      (body.communityId && (await Community.findById(body.communityId))) ||
      (await Community.findOne().sort({ createdAt: 1 }));
    if (!community) {
      error(res, "No community found. Seed communities first.", "BAD_REQUEST", 400);
      return;
    }
    user = await User.create({
      googleId: `demo-admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: body.name?.trim() || "Community Admin",
      email: body.email?.toLowerCase() || `admin-${Date.now()}@ecoact.app`,
      avatar: "",
      role: "admin",
      communityId: community._id,
    });
  } else if (user.role !== "admin") {
    error(res, "User exists but is not an admin", "FORBIDDEN", 403);
    return;
  }

  const payloadToken: TokenPayload = { userId: user._id.toString() };
  const accessToken = signAccessToken(payloadToken);
  const refreshToken = signRefreshToken(payloadToken);

  const community = user.communityId
    ? await Community.findById(user.communityId).select("name type").lean()
    : null;

  success(res, {
    accessToken,
    refreshToken,
    user: {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      communityId: user.communityId ? String(user.communityId) : null,
      community: community
        ? {
            _id: String(community._id),
            name: community.name,
            type: community.type,
          }
        : null,
    },
  });
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const user = await User.findById(req.user.userId)
    .select("name email avatar role communityId createdAt")
    .lean();
  if (!user) {
    error(res, "User not found", "NOT_FOUND", 404);
    return;
  }
  if (user.role !== "admin") {
    error(res, "Admin role required", "FORBIDDEN", 403);
    return;
  }

  const community = user.communityId
    ? await Community.findById(user.communityId).select("name type").lean()
    : null;
  success(res, {
    user: {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      communityId: user.communityId ? String(user.communityId) : null,
      createdAt: user.createdAt,
      community: community
        ? {
            _id: String(community._id),
            name: community.name,
            type: community.type,
          }
        : null,
    },
  });
}
