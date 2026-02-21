import { OAuth2Client } from "google-auth-library";
import type { Response } from "express";
import { User } from "../models/User.model.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, type TokenPayload } from "../utils/jwt.utils.js";
import { success, error } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleAuth(req: AuthRequest, res: Response): Promise<void> {
  const { idToken } = req.body as { idToken?: string };
  if (!idToken) {
    error(res, "idToken is required", "BAD_REQUEST", 400);
    return;
  }
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      error(res, "Invalid Google token", "UNAUTHORIZED", 401);
      return;
    }
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        googleId: payload.sub!,
        name: payload.name ?? payload.email,
        email: payload.email,
        avatar: payload.picture ?? "",
      });
    }
    const payloadToken: TokenPayload = { userId: user._id.toString() };
    const accessToken = signAccessToken(payloadToken);
    const refreshToken = signRefreshToken(payloadToken);
    const u = user.toObject();
    success(res, {
      accessToken,
      refreshToken,
      user: {
        _id: u._id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        totalPoints: u.totalPoints,
        totalCo2Saved: u.totalCo2Saved,
        footprintBaseline: u.footprintBaseline,
        currentStreak: u.currentStreak,
        longestStreak: u.longestStreak,
        badges: u.badges,
        communityId: u.communityId,
        role: u.role,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    error(res, "Google sign-in failed", "AUTH_FAILED", 401);
  }
}

export async function refresh(req: AuthRequest, res: Response): Promise<void> {
  const { refreshToken: token } = req.body as { refreshToken?: string };
  if (!token) {
    error(res, "refreshToken is required", "BAD_REQUEST", 400);
    return;
  }
  try {
    const payload = verifyRefreshToken(token);
    const accessToken = signAccessToken({ userId: payload.userId });
    success(res, { accessToken });
  } catch {
    error(res, "Invalid or expired refresh token", "UNAUTHORIZED", 401);
  }
}

export async function logout(_req: AuthRequest, res: Response): Promise<void> {
  success(res, { message: "Logged out" });
}

/**
 * Demo login: create or find user by email, return JWT + user.
 * Allowed when NODE_ENV !== "production" or ALLOW_DEMO_AUTH=true (for demo deployments).
 * Frontend sends: POST /api/auth/demo with body { name?, email? }.
 */
export async function demoAuth(req: AuthRequest, res: Response): Promise<void> {
  const allowDemo =
    process.env.ALLOW_DEMO_AUTH === "true" || process.env.ALLOW_DEMO_AUTH === "1" || process.env.NODE_ENV !== "production";
  if (!allowDemo) {
    error(res, "Demo auth disabled in production", "FORBIDDEN", 403);
    return;
  }
  const body = (req.body || {}) as { name?: string; email?: string };
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Demo User";
  const rawEmail = typeof body.email === "string" && body.email.trim() ? body.email.trim() : `demo-${Date.now()}@ecotrack.app`;
  const email = rawEmail.toLowerCase();

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      googleId: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      email,
      avatar: "",
    });
  }

  const payloadToken: TokenPayload = { userId: user._id.toString() };
  const accessToken = signAccessToken(payloadToken);
  const refreshToken = signRefreshToken(payloadToken);
  const u = user.toObject() as Record<string, unknown>;

  success(res, {
    accessToken,
    refreshToken,
    user: {
      _id: String(u._id),
      name: u.name,
      email: u.email,
      avatar: u.avatar ?? "",
      totalPoints: Number(u.totalPoints ?? 0),
      totalCo2Saved: Number(u.totalCo2Saved ?? 0),
      footprintBaseline: Number(u.footprintBaseline ?? 0),
      currentStreak: Number(u.currentStreak ?? 0),
      longestStreak: Number(u.longestStreak ?? 0),
      badges: Array.isArray(u.badges) ? u.badges : [],
      communityId: u.communityId != null ? String(u.communityId) : null,
      role: (u.role as string) || "user",
    },
  });
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const user = await User.findById(req.user.userId)
    .select("-__v")
    .lean();
  if (!user) {
    error(res, "User not found", "NOT_FOUND", 404);
    return;
  }
  success(res, { user });
}
