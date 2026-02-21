import type { Request, Response, NextFunction } from "express";
import { error } from "../utils/response.utils.js";

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err);
  error(res, err.message ?? "Internal server error", "INTERNAL_ERROR", 500);
}
