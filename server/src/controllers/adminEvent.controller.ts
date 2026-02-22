import type { Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { CommunityEvent } from "../models/CommunityEvent.model.js";
import { EventParticipation } from "../models/EventParticipation.model.js";
import type { CommunityAdminRequest } from "../middleware/communityAdmin.middleware.js";
import { success, error } from "../utils/response.utils.js";

const eventStatusSchema = z.enum(["draft", "published", "archived"]);

const createEventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000).default(""),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().trim().max(300).optional().default(""),
  coverImageUrl: z.string().url().optional().or(z.literal("")).default(""),
  status: eventStatusSchema.optional().default("draft"),
  maxParticipants: z.number().int().positive().nullable().optional().default(null),
});

const updateEventSchema = createEventSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().trim().optional(),
  status: eventStatusSchema.optional(),
  sortBy: z.enum(["createdAt", "startAt", "title"]).optional().default("startAt"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

async function getEventStatsMap(eventIds: mongoose.Types.ObjectId[]) {
  if (!eventIds.length) return new Map<string, { rsvps: number; attended: number; cancelled: number }>();
  const rows = await EventParticipation.aggregate([
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
        cancelled: {
          $sum: {
            $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
          },
        },
      },
    },
  ]);
  return new Map(
    rows.map((r) => [
      String(r._id),
      { rsvps: r.rsvps ?? 0, attended: r.attended ?? 0, cancelled: r.cancelled ?? 0 },
    ]),
  );
}

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
    CommunityEvent.find(filter).sort(sort).skip(skip).limit(q.limit).lean(),
    CommunityEvent.countDocuments(filter),
  ]);
  const eventIds = items.map((e) => e._id as mongoose.Types.ObjectId);
  const statsMap = await getEventStatsMap(eventIds);

  success(res, {
    items: items.map((e) => ({
      ...e,
      _id: String(e._id),
      communityId: String(e.communityId),
      createdBy: String(e.createdBy),
      updatedBy: String(e.updatedBy),
      stats: statsMap.get(String(e._id)) ?? { rsvps: 0, attended: 0, cancelled: 0 },
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
  const parsed = createEventSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    error(res, "Invalid event payload", "BAD_REQUEST", 400);
    return;
  }
  const payload = parsed.data;
  const startAt = new Date(payload.startAt);
  const endAt = new Date(payload.endAt);
  if (startAt >= endAt) {
    error(res, "endAt must be after startAt", "BAD_REQUEST", 400);
    return;
  }

  const now = new Date();
  const event = await CommunityEvent.create({
    communityId,
    title: payload.title,
    description: payload.description,
    startAt,
    endAt,
    location: payload.location,
    coverImageUrl: payload.coverImageUrl,
    status: payload.status,
    maxParticipants: payload.maxParticipants,
    createdBy: req.adminUser._id,
    updatedBy: req.adminUser._id,
    publishedAt: payload.status === "published" ? now : null,
  });
  success(
    res,
    {
      item: {
        ...event.toObject(),
        _id: String(event._id),
        communityId: String(event.communityId),
        createdBy: String(event.createdBy),
        updatedBy: String(event.updatedBy),
      },
    },
    201,
  );
}

export async function getById(req: CommunityAdminRequest, res: Response): Promise<void> {
  const { communityId, eventId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(eventId)) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const event = await CommunityEvent.findOne({ _id: eventId, communityId }).lean();
  if (!event) {
    error(res, "Event not found", "NOT_FOUND", 404);
    return;
  }
  const stats = await EventParticipation.aggregate([
    { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: null,
        rsvps: {
          $sum: { $cond: [{ $in: ["$status", ["registered", "attended"]] }, 1, 0] },
        },
        attended: {
          $sum: { $cond: [{ $eq: ["$status", "attended"] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
        },
      },
    },
  ]);
  success(res, {
    item: {
      ...event,
      _id: String(event._id),
      communityId: String(event.communityId),
      createdBy: String(event.createdBy),
      updatedBy: String(event.updatedBy),
      stats: stats[0] ?? { rsvps: 0, attended: 0, cancelled: 0 },
    },
  });
}

export async function update(req: CommunityAdminRequest, res: Response): Promise<void> {
  const { communityId, eventId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(eventId) || !req.adminUser) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const parsed = updateEventSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    error(res, "Invalid event payload", "BAD_REQUEST", 400);
    return;
  }
  const payload = parsed.data;
  const update: Record<string, unknown> = { updatedBy: req.adminUser._id };
  if (payload.title !== undefined) update.title = payload.title;
  if (payload.description !== undefined) update.description = payload.description;
  if (payload.startAt !== undefined) update.startAt = new Date(payload.startAt);
  if (payload.endAt !== undefined) update.endAt = new Date(payload.endAt);
  if (payload.location !== undefined) update.location = payload.location;
  if (payload.coverImageUrl !== undefined) update.coverImageUrl = payload.coverImageUrl;
  if (payload.maxParticipants !== undefined) update.maxParticipants = payload.maxParticipants;
  if (payload.status !== undefined) {
    update.status = payload.status;
    if (payload.status === "published") update.publishedAt = new Date();
  }

  const updated = await CommunityEvent.findOneAndUpdate({ _id: eventId, communityId }, update, { new: true }).lean();
  if (!updated) {
    error(res, "Event not found", "NOT_FOUND", 404);
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
  const { communityId, eventId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(eventId) || !req.adminUser) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const updated = await CommunityEvent.findOneAndUpdate(
    { _id: eventId, communityId },
    { status: "published", publishedAt: new Date(), updatedBy: req.adminUser._id },
    { new: true },
  ).lean();
  if (!updated) {
    error(res, "Event not found", "NOT_FOUND", 404);
    return;
  }
  success(res, { item: { ...updated, _id: String(updated._id) } });
}

export async function archive(req: CommunityAdminRequest, res: Response): Promise<void> {
  const { communityId, eventId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(eventId) || !req.adminUser) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const updated = await CommunityEvent.findOneAndUpdate(
    { _id: eventId, communityId },
    { status: "archived", updatedBy: req.adminUser._id },
    { new: true },
  ).lean();
  if (!updated) {
    error(res, "Event not found", "NOT_FOUND", 404);
    return;
  }
  success(res, { item: { ...updated, _id: String(updated._id) } });
}

export async function remove(req: CommunityAdminRequest, res: Response): Promise<void> {
  const { communityId, eventId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(communityId) || !mongoose.Types.ObjectId.isValid(eventId)) {
    error(res, "Invalid id", "BAD_REQUEST", 400);
    return;
  }
  const deleted = await CommunityEvent.findOneAndDelete({ _id: eventId, communityId }).lean();
  if (!deleted) {
    error(res, "Event not found", "NOT_FOUND", 404);
    return;
  }
  await EventParticipation.deleteMany({ eventId: new mongoose.Types.ObjectId(eventId) });
  success(res, { message: "Event deleted" });
}
