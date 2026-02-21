import type { Response } from "express";

export function success<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ success: true, ...data });
}

export function error(res: Response, message: string, code: string, status = 400): Response {
  return res.status(status).json({ success: false, message, code });
}
