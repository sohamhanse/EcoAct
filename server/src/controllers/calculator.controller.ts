import type { Response } from "express";
import { FootprintLog } from "../models/FootprintLog.model.js";
import { User } from "../models/User.model.js";
import { calculateFootprint } from "../services/carbon.service.js";
import { success, error } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import type { ICalculatorAnswers } from "../constants/emissionFactors.js";

export async function submit(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const answers = req.body as ICalculatorAnswers;
  const { totalCo2, breakdown, gridFactorUsed, comparedToIndiaAvg } = calculateFootprint(answers);
  const log = await FootprintLog.create({
    userId: req.user.userId,
    answers,
    totalCo2,
    breakdown,
    gridFactorUsed,
    comparedToIndiaAvg,
  });
  await User.findByIdAndUpdate(req.user.userId, {
    footprintBaseline: totalCo2,
  });
  success(res, {
    footprint: { totalCo2, breakdown, loggedAt: log.loggedAt },
    logId: log._id,
  });
}

export async function history(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const logs = await FootprintLog.find({ userId: req.user.userId })
    .sort({ loggedAt: -1 })
    .limit(20)
    .lean();
  success(res, { logs });
}

export async function latest(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const log = await FootprintLog.findOne({ userId: req.user.userId }).sort({ loggedAt: -1 }).lean();
  success(res, { log: log ?? null });
}
