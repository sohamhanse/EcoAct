import type { Response } from "express";
import mongoose from "mongoose";
import { CommunityChallenge } from "../models/CommunityChallenge.model.js";
import { success, error } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { ensureActiveChallenge } from "../services/challenge.service.js";

function toChallengeResponse(challenge: {
  _id: unknown;
  title: string;
  description: string;
  goalCo2Kg: number;
  currentCo2Kg: number;
  startDate: Date;
  endDate: Date;
  status: string;
  completedAt: Date | null;
  participantCount: number;
}) {
  const now = new Date();
  const end = new Date(challenge.endDate);
  const msRemaining = end.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.floor(msRemaining / (24 * 60 * 60 * 1000)));
  const hoursRemaining = Math.max(0, Math.floor((msRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)));
  const progressPercent =
    challenge.goalCo2Kg > 0
      ? Math.min(100, Math.round((challenge.currentCo2Kg / challenge.goalCo2Kg) * 100))
      : 0;

  return {
    _id: String(challenge._id),
    title: challenge.title,
    description: challenge.description,
    goalCo2Kg: challenge.goalCo2Kg,
    currentCo2Kg: challenge.currentCo2Kg,
    progressPercent,
    daysRemaining,
    hoursRemaining,
    status: challenge.status,
    participantCount: challenge.participantCount,
    startDate: challenge.startDate.toISOString(),
    endDate: challenge.endDate.toISOString(),
    completedAt: challenge.completedAt?.toISOString() ?? null,
  };
}

export async function getActive(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    error(res, "Invalid community id", "BAD_REQUEST", 400);
    return;
  }
  const communityId = new mongoose.Types.ObjectId(id);
  await ensureActiveChallenge(communityId);

  const now = new Date();
  const challenge = await CommunityChallenge.findOne({
    communityId,
    status: "active",
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).lean();

  if (!challenge) {
    const completed = await CommunityChallenge.findOne({
      communityId,
      status: "completed",
    })
      .sort({ completedAt: -1 })
      .lean();
    if (completed) {
      success(res, { challenge: toChallengeResponse(completed) });
      return;
    }
    success(res, { challenge: null });
    return;
  }

  success(res, { challenge: toChallengeResponse(challenge) });
}

export async function getHistory(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    error(res, "Invalid community id", "BAD_REQUEST", 400);
    return;
  }
  const list = await CommunityChallenge.find({ communityId: id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  success(res, {
    challenges: list.map((c) => toChallengeResponse(c)),
  });
}

export async function create(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    error(res, "Invalid community id", "BAD_REQUEST", 400);
    return;
  }
  const body = req.body as { title?: string; description?: string; goalCo2Kg?: number; durationDays?: number };
  const title = body.title ?? "Community Challenge";
  const description = body.description ?? "";
  const goalCo2Kg = Number(body.goalCo2Kg) || 500;
  const durationDays = Number(body.durationDays) || 7;
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  const challenge = await CommunityChallenge.create({
    communityId: id,
    title,
    description,
    goalCo2Kg,
    currentCo2Kg: 0,
    startDate,
    endDate,
    status: "active",
    participantCount: 0,
  });

  success(res, { challenge: toChallengeResponse(challenge) }, 201);
}
