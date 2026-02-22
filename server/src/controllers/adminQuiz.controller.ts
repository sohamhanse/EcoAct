import type { Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { CommunityQuiz } from "../models/CommunityQuiz.model.js";
import { QuizAttempt } from "../models/QuizAttempt.model.js";
import type { CommunityAdminRequest } from "../middleware/communityAdmin.middleware.js";
import { success, error } from "../utils/response.utils.js";

const quizStatusSchema = z.enum(["draft", "published", "archived"]);

const questionSchema = z
  .object({
    prompt: z.string().trim().min(5).max(500),
    options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
    correctOptionIndex: z.number().int().min(0),
    explanation: z.string().trim().max(1000).optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.correctOptionIndex >= value.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correctOptionIndex must be within options range",
        path: ["correctOptionIndex"],
      });
    }
  });

const createQuizSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000).default(""),
  status: quizStatusSchema.optional().default("draft"),
  startAt: z.string().datetime().nullable().optional().default(null),
  endAt: z.string().datetime().nullable().optional().default(null),
  timeLimitMinutes: z.number().int().positive().nullable().optional().default(null),
  passingScore: z.number().min(1).max(100).optional().default(60),
  questions: z.array(questionSchema).min(1).max(100),
});

const updateQuizSchema = createQuizSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().trim().optional(),
  status: quizStatusSchema.optional(),
  sortBy: z.enum(["createdAt", "publishedAt", "title"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export async function list(req: CommunityAdminRequest, res: Response): Promise<void> {
  const communityId = req.params.communityId;
  if (!mongoose.Types.ObjectId.isValid(communityId)) {
    error(res, "Invalid community id", "BAD_REQUEST", 400);
    return;
  }
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    error(res, "Invalid query params", "BAD_REQUEST", 400);
    return;
  }
  const q = parsed.data;
  const skip = (q.page - 1) * q.limit;
  const filter: Record<string, unknown> = {
    communityId: new mongoose.Types.ObjectId(communityId),
  };
  if (q.status) filter.status = q.status;
  if (q.search) filter.title = { $regex: q.search, $options: "i" };

  const sortOrder = q.order === "asc" ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [q.sortBy]: sortOrder };
  const [items, total] = await Promise.all([
    CommunityQuiz.find(filter).sort(sort).skip(skip).limit(q.limit).lean(),
    CommunityQuiz.countDocuments(filter),
  ]);
  const quizIds = items.map((qz) => qz._id as mongoose.Types.ObjectId);
  const attemptRows = quizIds.length
    ? await QuizAttempt.aggregate([
        { $match: { quizId: { $in: quizIds } } },
        { $group: { _id: "$quizId", attempts: { $sum: 1 }, avgScore: { $avg: "$scorePercent" } } },
      ])
    : [];
  const attemptMap = new Map(
    attemptRows.map((r) => [String(r._id), { attempts: r.attempts ?? 0, avgScore: Math.round(r.avgScore ?? 0) }]),
  );

  success(res, {
    items: items.map((item) => ({
      ...item,
      _id: String(item._id),
      communityId: String(item.communityId),
      createdBy: String(item.createdBy),
      updatedBy: String(item.updatedBy),
      questionCount: item.questions.length,
      stats: attemptMap.get(String(item._id)) ?? { attempts: 0, avgScore: 0 },
    })),
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      pages: Math.ceil(total / q.limit),
    },
  });
}

export async function create(req: CommunityAdminRequest, res: Response): Promise<void> {
  const communityId = req.params.communityId;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !req.adminUser) {
    error(res, "Invalid request", "BAD_REQUEST", 400);
    return;
  }
  const parsed = createQuizSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    error(res, "Invalid quiz payload", "BAD_REQUEST", 400);
    return;
  }
  const payload = parsed.data;
  const startAt = payload.startAt ? new Date(payload.startAt) : null;
  const endAt = payload.endAt ? new Date(payload.endAt) : null;
  if (startAt && endAt && startAt >= endAt) {
    error(res, "endAt must be after startAt", "BAD_REQUEST", 400);
    return;
  }
  const now = new Date();
  const quiz = await CommunityQuiz.create({
    communityId,
    title: payload.title,
    description: payload.description,
    status: payload.status,
    startAt,
    endAt,
    timeLimitMinutes: payload.timeLimitMinutes,
    passingScore: payload.passingScore,
    questions: payload.questions,
    createdBy: req.adminUser._id,
    updatedBy: req.adminUser._id,
    publishedAt: payload.status === "published" ? now : null,
  });
  success(
    res,
    {
      item: {
        ...quiz.toObject(),
        _id: String(quiz._id),
        communityId: String(quiz.communityId),
        createdBy: String(quiz.createdBy),
        updatedBy: String(quiz.updatedBy),
      },
    },
    201,
  );
}

export async function getById(req: CommunityAdminRequest, res: Response): Promise<void> {
  const { communityId, quizId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(quizId)) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const quiz = await CommunityQuiz.findOne({ _id: quizId, communityId }).lean();
  if (!quiz) {
    error(res, "Quiz not found", "NOT_FOUND", 404);
    return;
  }
  success(res, {
    item: {
      ...quiz,
      _id: String(quiz._id),
      communityId: String(quiz.communityId),
      createdBy: String(quiz.createdBy),
      updatedBy: String(quiz.updatedBy),
    },
  });
}

export async function update(req: CommunityAdminRequest, res: Response): Promise<void> {
  const { communityId, quizId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(quizId) || !req.adminUser) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const parsed = updateQuizSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    error(res, "Invalid quiz payload", "BAD_REQUEST", 400);
    return;
  }
  const payload = parsed.data;
  const updateDoc: Record<string, unknown> = { updatedBy: req.adminUser._id };
  if (payload.title !== undefined) updateDoc.title = payload.title;
  if (payload.description !== undefined) updateDoc.description = payload.description;
  if (payload.status !== undefined) {
    updateDoc.status = payload.status;
    if (payload.status === "published") updateDoc.publishedAt = new Date();
  }
  if (payload.startAt !== undefined) updateDoc.startAt = payload.startAt ? new Date(payload.startAt) : null;
  if (payload.endAt !== undefined) updateDoc.endAt = payload.endAt ? new Date(payload.endAt) : null;
  if (payload.timeLimitMinutes !== undefined) updateDoc.timeLimitMinutes = payload.timeLimitMinutes;
  if (payload.passingScore !== undefined) updateDoc.passingScore = payload.passingScore;
  if (payload.questions !== undefined) updateDoc.questions = payload.questions;

  const updated = await CommunityQuiz.findOneAndUpdate(
    { _id: quizId, communityId },
    updateDoc,
    { new: true },
  ).lean();
  if (!updated) {
    error(res, "Quiz not found", "NOT_FOUND", 404);
    return;
  }
  success(res, {
    item: {
      ...updated,
      _id: String(updated._id),
      communityId: String(updated.communityId),
      createdBy: String(updated.createdBy),
      updatedBy: String(updated.updatedBy),
    },
  });
}

export async function publish(req: CommunityAdminRequest, res: Response): Promise<void> {
  const { communityId, quizId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(quizId) || !req.adminUser) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const updated = await CommunityQuiz.findOneAndUpdate(
    { _id: quizId, communityId },
    { status: "published", publishedAt: new Date(), updatedBy: req.adminUser._id },
    { new: true },
  ).lean();
  if (!updated) {
    error(res, "Quiz not found", "NOT_FOUND", 404);
    return;
  }
  success(res, { item: { ...updated, _id: String(updated._id) } });
}

export async function archive(req: CommunityAdminRequest, res: Response): Promise<void> {
  const { communityId, quizId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(quizId) || !req.adminUser) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const updated = await CommunityQuiz.findOneAndUpdate(
    { _id: quizId, communityId },
    { status: "archived", updatedBy: req.adminUser._id },
    { new: true },
  ).lean();
  if (!updated) {
    error(res, "Quiz not found", "NOT_FOUND", 404);
    return;
  }
  success(res, { item: { ...updated, _id: String(updated._id) } });
}

export async function remove(req: CommunityAdminRequest, res: Response): Promise<void> {
  const { communityId, quizId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(quizId)) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const deleted = await CommunityQuiz.findOneAndDelete({ _id: quizId, communityId }).lean();
  if (!deleted) {
    error(res, "Quiz not found", "NOT_FOUND", 404);
    return;
  }
  await QuizAttempt.deleteMany({ quizId: new mongoose.Types.ObjectId(quizId) });
  success(res, { message: "Quiz deleted" });
}

export async function analytics(req: CommunityAdminRequest, res: Response): Promise<void> {
  const { communityId, quizId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(quizId)) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const quiz = await CommunityQuiz.findOne({ _id: quizId, communityId }).lean();
  if (!quiz) {
    error(res, "Quiz not found", "NOT_FOUND", 404);
    return;
  }

  const attempts = await QuizAttempt.find({ quizId: new mongoose.Types.ObjectId(quizId) })
    .select("userId answers scorePercent passed completedAt")
    .sort({ completedAt: -1 })
    .lean();

  const totalAttempts = attempts.length;
  const completedAttempts = attempts.length;
  const avgScore =
    totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.scorePercent ?? 0), 0) / totalAttempts)
      : 0;
  const passCount = attempts.filter((a) => a.passed).length;
  const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

  const questionMetrics = quiz.questions.map((q, idx) => {
    let answered = 0;
    let correct = 0;
    for (const attempt of attempts) {
      if (!Array.isArray(attempt.answers) || attempt.answers[idx] === undefined) continue;
      answered += 1;
      if (attempt.answers[idx] === q.correctOptionIndex) correct += 1;
    }
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    return {
      index: idx,
      prompt: q.prompt,
      answered,
      correct,
      accuracy,
    };
  });

  const sortedByAccuracy = [...questionMetrics].sort((a, b) => b.accuracy - a.accuracy);
  const topQuestions = sortedByAccuracy.slice(0, 3);
  const bottomQuestions = [...sortedByAccuracy].reverse().slice(0, 3);

  const leaderboard = await QuizAttempt.aggregate([
    { $match: { quizId: new mongoose.Types.ObjectId(quizId) } },
    { $sort: { scorePercent: -1, completedAt: 1 } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: { $toString: "$userId" },
        name: "$user.name",
        scorePercent: "$scorePercent",
        completedAt: "$completedAt",
      },
    },
    { $limit: 10 },
  ]);

  success(res, {
    quiz: {
      _id: String(quiz._id),
      title: quiz.title,
      status: quiz.status,
      questionCount: quiz.questions.length,
      passingScore: quiz.passingScore,
    },
    summary: {
      attempts: totalAttempts,
      completionRate: totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0,
      averageScore: avgScore,
      passRate,
    },
    topQuestions,
    bottomQuestions,
    leaderboard,
  });
}
