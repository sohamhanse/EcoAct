import type { Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { CommunityEvent } from "../models/CommunityEvent.model.js";
import { EventParticipation } from "../models/EventParticipation.model.js";
import { CommunityQuiz } from "../models/CommunityQuiz.model.js";
import { QuizAttempt } from "../models/QuizAttempt.model.js";
import { User } from "../models/User.model.js";
import { success, error } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

function parsePage(raw: unknown): number {
  const n = parseInt(String(raw ?? 1), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseLimit(raw: unknown, max = 20, fallback = 10): number {
  const n = parseInt(String(raw ?? fallback), 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, n);
}

const eventRsvpSchema = z.object({
  status: z.enum(["registered", "cancelled"]).optional().default("registered"),
});

const quizAttemptSchema = z.object({
  answers: z.array(z.number().int().min(0)),
  startedAt: z.string().datetime().optional(),
});

async function ensureCommunityMember(userId: string, communityId: string): Promise<boolean> {
  const user = await User.findById(userId).select("communityId").lean();
  return !!user?.communityId && String(user.communityId) === communityId;
}

export async function listPublishedEvents(req: AuthRequest, res: Response): Promise<void> {
  const communityId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(communityId)) {
    error(res, "Invalid community id", "BAD_REQUEST", 400);
    return;
  }

  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit, 20, 10);
  const skip = (page - 1) * limit;
  const cid = new mongoose.Types.ObjectId(communityId);

  const [events, total] = await Promise.all([
    CommunityEvent.find({ communityId: cid, status: "published" })
      .sort({ startAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CommunityEvent.countDocuments({ communityId: cid, status: "published" }),
  ]);

  const eventIds = events.map((e) => e._id as mongoose.Types.ObjectId);
  const participationRows = eventIds.length
    ? await EventParticipation.aggregate([
        { $match: { eventId: { $in: eventIds } } },
        {
          $group: {
            _id: "$eventId",
            rsvps: {
              $sum: {
                $cond: [{ $in: ["$status", ["registered", "attended"]] }, 1, 0],
              },
            },
            attended: {
              $sum: {
                $cond: [{ $eq: ["$status", "attended"] }, 1, 0],
              },
            },
          },
        },
      ])
    : [];
  const participationMap = new Map(
    participationRows.map((r) => [
      String(r._id),
      { rsvps: r.rsvps ?? 0, attended: r.attended ?? 0 },
    ]),
  );

  success(res, {
    events: events.map((e) => ({
      _id: String(e._id),
      title: e.title,
      description: e.description,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt.toISOString(),
      location: e.location ?? "",
      coverImageUrl: e.coverImageUrl ?? "",
      maxParticipants: e.maxParticipants ?? null,
      rsvps: participationMap.get(String(e._id))?.rsvps ?? 0,
      attended: participationMap.get(String(e._id))?.attended ?? 0,
    })),
    total,
    page,
    pageSize: limit,
  });
}

export async function listPublishedQuizzes(req: AuthRequest, res: Response): Promise<void> {
  const communityId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(communityId)) {
    error(res, "Invalid community id", "BAD_REQUEST", 400);
    return;
  }

  const page = parsePage(req.query.page);
  const limit = parseLimit(req.query.limit, 20, 10);
  const skip = (page - 1) * limit;
  const cid = new mongoose.Types.ObjectId(communityId);

  const [quizzes, total] = await Promise.all([
    CommunityQuiz.find({ communityId: cid, status: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CommunityQuiz.countDocuments({ communityId: cid, status: "published" }),
  ]);

  const quizIds = quizzes.map((q) => q._id as mongoose.Types.ObjectId);
  const attemptsRows = quizIds.length
    ? await QuizAttempt.aggregate([
        { $match: { quizId: { $in: quizIds } } },
        {
          $group: {
            _id: "$quizId",
            attempts: { $sum: 1 },
            avgScore: { $avg: "$scorePercent" },
          },
        },
      ])
    : [];
  const attemptsMap = new Map(
    attemptsRows.map((r) => [
      String(r._id),
      {
        attempts: r.attempts ?? 0,
        avgScore: Math.round(r.avgScore ?? 0),
      },
    ]),
  );

  success(res, {
    quizzes: quizzes.map((q) => ({
      _id: String(q._id),
      title: q.title,
      description: q.description,
      startAt: q.startAt ? q.startAt.toISOString() : null,
      endAt: q.endAt ? q.endAt.toISOString() : null,
      timeLimitMinutes: q.timeLimitMinutes ?? null,
      passingScore: q.passingScore,
      questionCount: q.questions.length,
      attempts: attemptsMap.get(String(q._id))?.attempts ?? 0,
      avgScore: attemptsMap.get(String(q._id))?.avgScore ?? 0,
    })),
    total,
    page,
    pageSize: limit,
  });
}

export async function rsvpEvent(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const communityId = req.params.id;
  const eventId = req.params.eventId;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(eventId)) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const isMember = await ensureCommunityMember(req.user.userId, communityId);
  if (!isMember) {
    error(res, "Join this community to RSVP", "FORBIDDEN", 403);
    return;
  }

  const event = await CommunityEvent.findOne({
    _id: new mongoose.Types.ObjectId(eventId),
    communityId: new mongoose.Types.ObjectId(communityId),
    status: "published",
  }).lean();
  if (!event) {
    error(res, "Published event not found", "NOT_FOUND", 404);
    return;
  }

  const parsed = eventRsvpSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    error(res, "Invalid RSVP payload", "BAD_REQUEST", 400);
    return;
  }
  const nextStatus = parsed.data.status;

  const existing = await EventParticipation.findOne({
    eventId: new mongoose.Types.ObjectId(eventId),
    userId: new mongoose.Types.ObjectId(req.user.userId),
  });

  if (nextStatus === "registered") {
    const registeredCount = await EventParticipation.countDocuments({
      eventId: new mongoose.Types.ObjectId(eventId),
      status: { $in: ["registered", "attended"] },
    });
    const existingRegistered = existing && ["registered", "attended"].includes(existing.status);
    if (event.maxParticipants && registeredCount >= event.maxParticipants && !existingRegistered) {
      error(res, "Event is full", "EVENT_FULL", 400);
      return;
    }
  }

  const now = new Date();
  const updateDoc: Record<string, unknown> = {
    status: nextStatus,
  };
  if (nextStatus === "registered") {
    updateDoc.registeredAt = existing?.registeredAt ?? now;
  }
  if (nextStatus === "cancelled") {
    updateDoc.attendedAt = null;
  }
  const participation = await EventParticipation.findOneAndUpdate(
    {
      eventId: new mongoose.Types.ObjectId(eventId),
      userId: new mongoose.Types.ObjectId(req.user.userId),
    },
    {
      $set: updateDoc,
      $setOnInsert: {
        communityId: new mongoose.Types.ObjectId(communityId),
      },
    },
    { upsert: true, new: true },
  ).lean();

  const [rsvps, attended] = await Promise.all([
    EventParticipation.countDocuments({
      eventId: new mongoose.Types.ObjectId(eventId),
      status: { $in: ["registered", "attended"] },
    }),
    EventParticipation.countDocuments({
      eventId: new mongoose.Types.ObjectId(eventId),
      status: "attended",
    }),
  ]);

  success(res, {
    eventId,
    myStatus: participation?.status ?? "cancelled",
    rsvps,
    attended,
  });
}

export async function getPublishedQuizById(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const communityId = req.params.id;
  const quizId = req.params.quizId;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(quizId)) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const isMember = await ensureCommunityMember(req.user.userId, communityId);
  if (!isMember) {
    error(res, "Join this community to access quizzes", "FORBIDDEN", 403);
    return;
  }

  const quiz = await CommunityQuiz.findOne({
    _id: new mongoose.Types.ObjectId(quizId),
    communityId: new mongoose.Types.ObjectId(communityId),
    status: "published",
  }).lean();
  if (!quiz) {
    error(res, "Published quiz not found", "NOT_FOUND", 404);
    return;
  }

  const now = new Date();
  const notStarted = !!quiz.startAt && quiz.startAt > now;
  const ended = !!quiz.endAt && quiz.endAt < now;
  const isActive = !notStarted && !ended;

  const lastAttempt = await QuizAttempt.findOne({
    quizId: new mongoose.Types.ObjectId(quizId),
    userId: new mongoose.Types.ObjectId(req.user.userId),
  })
    .sort({ completedAt: -1 })
    .select("scorePercent passed completedAt")
    .lean();

  success(res, {
    quiz: {
      _id: String(quiz._id),
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimitMinutes: quiz.timeLimitMinutes ?? null,
      startAt: quiz.startAt ? quiz.startAt.toISOString() : null,
      endAt: quiz.endAt ? quiz.endAt.toISOString() : null,
      isActive,
      questions: quiz.questions.map((q, idx) => ({
        index: idx,
        prompt: q.prompt,
        options: q.options,
      })),
      lastAttempt: lastAttempt
        ? {
            scorePercent: lastAttempt.scorePercent,
            passed: lastAttempt.passed,
            completedAt: lastAttempt.completedAt.toISOString(),
          }
        : null,
    },
  });
}

export async function submitQuizAttempt(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const communityId = req.params.id;
  const quizId = req.params.quizId;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(quizId)) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const isMember = await ensureCommunityMember(req.user.userId, communityId);
  if (!isMember) {
    error(res, "Join this community to submit quiz attempts", "FORBIDDEN", 403);
    return;
  }

  const parsed = quizAttemptSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    error(res, "Invalid quiz attempt payload", "BAD_REQUEST", 400);
    return;
  }
  const payload = parsed.data;

  const quiz = await CommunityQuiz.findOne({
    _id: new mongoose.Types.ObjectId(quizId),
    communityId: new mongoose.Types.ObjectId(communityId),
    status: "published",
  }).lean();
  if (!quiz) {
    error(res, "Published quiz not found", "NOT_FOUND", 404);
    return;
  }

  const now = new Date();
  if (quiz.startAt && quiz.startAt > now) {
    error(res, "Quiz has not started yet", "QUIZ_NOT_STARTED", 400);
    return;
  }
  if (quiz.endAt && quiz.endAt < now) {
    error(res, "Quiz has ended", "QUIZ_ENDED", 400);
    return;
  }
  if (payload.answers.length !== quiz.questions.length) {
    error(res, "Answers count must match question count", "BAD_REQUEST", 400);
    return;
  }

  for (let i = 0; i < quiz.questions.length; i += 1) {
    const answer = payload.answers[i];
    const optionCount = quiz.questions[i]?.options.length ?? 0;
    if (answer < 0 || answer >= optionCount) {
      error(res, `Invalid answer at question ${i + 1}`, "BAD_REQUEST", 400);
      return;
    }
  }

  let correctCount = 0;
  const questionResults = quiz.questions.map((q, index) => {
    const selectedIndex = payload.answers[index];
    const isCorrect = selectedIndex === q.correctOptionIndex;
    if (isCorrect) correctCount += 1;
    return {
      questionIndex: index,
      selectedIndex,
      correctIndex: q.correctOptionIndex,
      isCorrect,
      explanation: q.explanation ?? "",
    };
  });

  const totalQuestions = quiz.questions.length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const passed = scorePercent >= quiz.passingScore;
  const startedAt = payload.startedAt ? new Date(payload.startedAt) : now;
  const durationSeconds = Math.max(
    0,
    Math.round((now.getTime() - startedAt.getTime()) / 1000),
  );

  const attempt = await QuizAttempt.create({
    communityId,
    quizId,
    userId: req.user.userId,
    answers: payload.answers,
    scorePercent,
    correctCount,
    totalQuestions,
    passed,
    startedAt,
    completedAt: now,
    durationSeconds,
  });

  success(
    res,
    {
      attempt: {
        _id: String(attempt._id),
        quizId,
        scorePercent,
        correctCount,
        totalQuestions,
        passed,
        completedAt: now.toISOString(),
      },
      questionResults,
    },
    201,
  );
}
