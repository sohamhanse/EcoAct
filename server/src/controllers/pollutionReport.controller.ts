import type { Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { PollutionReport } from "../models/PollutionReport.model.js";
import { User } from "../models/User.model.js";
import { error, success } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import {
  POLLUTION_IMPACT_KG,
  getMapData,
  submitPollutionReport,
} from "../services/pollutionReport.service.js";

const reportSchema = z.object({
  vehicleNumber: z.string().trim().max(20).optional(),
  vehicleType: z.enum([
    "two_wheeler",
    "three_wheeler",
    "four_wheeler",
    "commercial_truck",
    "bus",
    "unknown",
  ]),
  vehicleColor: z.string().trim().max(30).optional(),
  pollutionLevel: z.enum(["mild", "heavy", "severe"]),
  pollutionType: z.enum(["black_smoke", "white_smoke", "strong_odor", "visible_exhaust", "multiple"]),
  description: z.string().trim().max(300).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationName: z.string().trim().max(120).optional(),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
});

function parseNumber(value: unknown, fallback: number): number {
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}

export async function createReport(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const parsed = reportSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    error(res, "Invalid report payload", "BAD_REQUEST", 400);
    return;
  }

  try {
    const report = await submitPollutionReport(req.user.userId, parsed.data);
    success(res, {
      report: {
        _id: String(report._id),
        vehicleNumber: report.vehicleNumber ?? "",
        vehicleType: report.vehicleType,
        pollutionLevel: report.pollutionLevel,
        pollutionType: report.pollutionType,
        description: report.description ?? "",
        locationName: report.locationName ?? "",
        city: report.city,
        state: report.state,
        latitude: report.location.coordinates[1],
        longitude: report.location.coordinates[0],
        pointsAwarded: report.pointsAwarded,
        potentialImpactKg: POLLUTION_IMPACT_KG[report.pollutionLevel],
        status: report.status,
        reportedAt: report.reportedAt.toISOString(),
      },
    }, 201);
  } catch (e) {
    const code = e instanceof Error ? e.message : "UNKNOWN";
    if (code === "DAILY_REPORT_LIMIT_REACHED") {
      error(res, "Daily report limit reached (10/day)", "DAILY_REPORT_LIMIT_REACHED", 429);
      return;
    }
    error(res, "Failed to submit report", "REPORT_SUBMIT_FAILED", 500);
  }
}

export async function map(req: AuthRequest, res: Response): Promise<void> {
  const lat = parseNumber(req.query.lat, 19.076);
  const lng = parseNumber(req.query.lng, 72.877);
  const radius = parseNumber(req.query.radius, 10);
  const hours = parseNumber(req.query.hours, 24);

  const data = await getMapData(lat, lng, radius, hours);
  success(res, data);
}

export async function myReports(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const reports = await PollutionReport.find({ reporterId: req.user.userId })
    .sort({ reportedAt: -1 })
    .limit(100)
    .lean();

  success(res, {
    reports: reports.map((report) => ({
      _id: String(report._id),
      vehicleNumber: report.vehicleNumber ?? "",
      vehicleType: report.vehicleType,
      vehicleColor: report.vehicleColor ?? "",
      pollutionLevel: report.pollutionLevel,
      pollutionType: report.pollutionType,
      description: report.description ?? "",
      city: report.city,
      state: report.state,
      locationName: report.locationName ?? "",
      location: {
        lat: report.location.coordinates[1],
        lng: report.location.coordinates[0],
      },
      status: report.status,
      verificationCount: report.verificationCount,
      pointsAwarded: report.pointsAwarded,
      reportedAt: report.reportedAt.toISOString(),
    })),
  });
}

export async function cityStats(req: AuthRequest, res: Response): Promise<void> {
  const city = String(req.params.city ?? "").trim();
  if (!city) {
    error(res, "City is required", "BAD_REQUEST", 400);
    return;
  }

  const since = req.query.hours
    ? new Date(Date.now() - Math.max(1, parseNumber(req.query.hours, 24)) * 60 * 60 * 1000)
    : null;
  const filter: Record<string, unknown> = {
    city: { $regex: `^${city}$`, $options: "i" },
  };
  if (since) filter.reportedAt = { $gte: since };

  const [total, severe, heavy, hotspots] = await Promise.all([
    PollutionReport.countDocuments(filter),
    PollutionReport.countDocuments({ ...filter, pollutionLevel: "severe" }),
    PollutionReport.countDocuments({ ...filter, pollutionLevel: "heavy" }),
    PollutionReport.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$locationName",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ]);

  success(res, {
    city,
    totalReports: total,
    severeCount: severe,
    heavyCount: heavy,
    mildCount: Math.max(0, total - severe - heavy),
    topAreas: hotspots
      .map((h) => h._id)
      .filter((h): h is string => !!h),
  });
}

export async function detail(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    error(res, "Invalid report id", "BAD_REQUEST", 400);
    return;
  }
  const report = await PollutionReport.findById(id).populate("reporterId", "name avatar").lean();
  if (!report) {
    error(res, "Report not found", "NOT_FOUND", 404);
    return;
  }

  success(res, {
    report: {
      _id: String(report._id),
      reporter: {
        name: (report.reporterId as unknown as { name?: string })?.name ?? "Anonymous",
        avatar: (report.reporterId as unknown as { avatar?: string })?.avatar ?? "",
      },
      vehicleNumber: report.vehicleNumber ?? "",
      vehicleType: report.vehicleType,
      vehicleColor: report.vehicleColor ?? "",
      pollutionLevel: report.pollutionLevel,
      pollutionType: report.pollutionType,
      description: report.description ?? "",
      locationName: report.locationName ?? "",
      city: report.city,
      state: report.state,
      location: {
        lat: report.location.coordinates[1],
        lng: report.location.coordinates[0],
      },
      status: report.status,
      verificationCount: report.verificationCount,
      pointsAwarded: report.pointsAwarded,
      reportedAt: report.reportedAt.toISOString(),
    },
  });
}

export async function leaderboard(req: AuthRequest, res: Response): Promise<void> {
  const days = Math.max(1, Math.min(30, parseNumber(req.query.days, 7)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await PollutionReport.aggregate([
    { $match: { reportedAt: { $gte: since } } },
    {
      $group: {
        _id: "$reporterId",
        reportsCount: { $sum: 1 },
        points: { $sum: "$pointsAwarded" },
      },
    },
    { $sort: { reportsCount: -1, points: -1 } },
    { $limit: 20 },
  ]);

  const userIds = rows.map((row) => row._id);
  const users = await User.find({ _id: { $in: userIds } }).select("name avatar").lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  success(res, {
    leaderboard: rows.map((row, index) => {
      const user = userMap.get(String(row._id));
      return {
        rank: index + 1,
        userId: String(row._id),
        name: user?.name ?? "Anonymous",
        avatar: user?.avatar ?? "",
        reportsCount: row.reportsCount ?? 0,
        points: row.points ?? 0,
      };
    }),
    days,
  });
}
