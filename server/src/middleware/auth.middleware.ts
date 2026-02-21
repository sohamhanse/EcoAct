import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type TokenPayload } from "../utils/jwt.utils.js";
import { error } from "../utils/response.utils.js";

export type AuthRequest = Request & { user?: TokenPayload };

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    error(res, "Missing or invalid authorization header", "UNAUTHORIZED", 401);
    return;
  }
  const token = authHeader.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    error(res, "Invalid or expired token", "UNAUTHORIZED", 401);
  }
}
