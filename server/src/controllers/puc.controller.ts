import type { Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Vehicle } from "../models/Vehicle.model.js";
import { PUCRecord } from "../models/PUCRecord.model.js";
import { error, success } from "../utils/response.utils.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { computeExpiryDate, getPUCStatus, logPUCCompletion } from "../services/puc.service.js";

const vehicleSchema = z.object({
  nickname: z.string().trim().min(1).max(80),
  vehicleNumber: z.string().trim().min(4).max(20),
  vehicleType: z.enum(["two_wheeler", "three_wheeler", "four_wheeler", "commercial"]),
  fuelType: z.enum(["petrol", "diesel", "cng", "electric"]),
  brand: z.string().trim().max(60).optional(),
  model: z.string().trim().max(60).optional(),
  yearOfManufacture: z.number().int().min(1980).max(2100).optional(),
});

const vehicleUpdateSchema = vehicleSchema.partial();

const logSchema = z.object({
  testDate: z.coerce.date(),
  pucCenterName: z.string().trim().max(120).optional(),
  pucCenterCity: z.string().trim().max(80).optional(),
  certificateNumber: z.string().trim().max(80).optional(),
  readings: z
    .object({
      co: z.number().nonnegative().max(100).optional(),
      hc: z.number().nonnegative().max(10000).optional(),
      smokeOpacity: z.number().nonnegative().max(100).optional(),
      result: z.enum(["pass", "fail"]).optional(),
    })
    .optional(),
});

function normalizeVehicleNumber(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase().trim();
}

function validityDaysFromRecord(testDate?: Date, expiryDate?: Date): number | null {
  if (!testDate || !expiryDate) return null;
  const diff = expiryDate.getTime() - testDate.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function serializeVehicle(vehicle: {
  _id: mongoose.Types.ObjectId;
  nickname: string;
  vehicleNumber: string;
  vehicleType: string;
  fuelType: string;
  brand?: string;
  model?: string;
  yearOfManufacture?: number | null;
  isActive: boolean;
}) {
  return {
    _id: String(vehicle._id),
    nickname: vehicle.nickname,
    vehicleNumber: vehicle.vehicleNumber,
    vehicleType: vehicle.vehicleType,
    fuelType: vehicle.fuelType,
    brand: vehicle.brand ?? "",
    model: vehicle.model ?? "",
    yearOfManufacture: vehicle.yearOfManufacture ?? null,
    isActive: vehicle.isActive,
  };
}

function serializeRecord(record: {
  _id: mongoose.Types.ObjectId;
  testDate: Date;
  expiryDate: Date;
  pucCenterName?: string;
  pucCenterCity?: string;
  certificateNumber?: string;
  readings?: {
    co?: number;
    hc?: number;
    smokeOpacity?: number;
    result?: string;
  };
  pointsAwarded: number;
  co2ImpactKg: number;
  isOnTime: boolean;
  createdAt: Date;
}) {
  return {
    _id: String(record._id),
    testDate: record.testDate.toISOString(),
    expiryDate: record.expiryDate.toISOString(),
    pucCenterName: record.pucCenterName ?? "",
    pucCenterCity: record.pucCenterCity ?? "",
    certificateNumber: record.certificateNumber ?? "",
    readings: {
      co: record.readings?.co ?? null,
      hc: record.readings?.hc ?? null,
      smokeOpacity: record.readings?.smokeOpacity ?? null,
      result: record.readings?.result ?? "pass",
    },
    pointsAwarded: record.pointsAwarded,
    co2ImpactKg: record.co2ImpactKg,
    isOnTime: record.isOnTime,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listVehicles(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }

  const vehicles = await Vehicle.find({ userId: req.user.userId, isActive: true })
    .sort({ createdAt: -1 })
    .lean();
  success(res, {
    vehicles: vehicles.map((vehicle) => serializeVehicle({
      ...vehicle,
      _id: vehicle._id as mongoose.Types.ObjectId,
    })),
  });
}

export async function createVehicle(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const parsed = vehicleSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    error(res, "Invalid vehicle payload", "BAD_REQUEST", 400);
    return;
  }

  const payload = parsed.data;
  const vehicle = await Vehicle.create({
    userId: req.user.userId,
    nickname: payload.nickname,
    vehicleNumber: normalizeVehicleNumber(payload.vehicleNumber),
    vehicleType: payload.vehicleType,
    fuelType: payload.fuelType,
    brand: payload.brand ?? "",
    model: payload.model ?? "",
    yearOfManufacture: payload.yearOfManufacture,
  });

  success(res, { vehicle: serializeVehicle({
    _id: vehicle._id as mongoose.Types.ObjectId,
    nickname: vehicle.nickname,
    vehicleNumber: vehicle.vehicleNumber,
    vehicleType: vehicle.vehicleType,
    fuelType: vehicle.fuelType,
    brand: vehicle.brand,
    model: vehicle.model,
    yearOfManufacture: vehicle.yearOfManufacture,
    isActive: vehicle.isActive,
  }) }, 201);
}

export async function updateVehicle(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    error(res, "Invalid vehicle id", "BAD_REQUEST", 400);
    return;
  }

  const parsed = vehicleUpdateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    error(res, "Invalid vehicle update payload", "BAD_REQUEST", 400);
    return;
  }
  const payload = parsed.data;
  const update: Record<string, unknown> = { ...payload };
  if (payload.vehicleNumber) {
    update.vehicleNumber = normalizeVehicleNumber(payload.vehicleNumber);
  }

  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), userId: req.user.userId, isActive: true },
    { $set: update },
    { new: true },
  ).lean();

  if (!vehicle) {
    error(res, "Vehicle not found", "NOT_FOUND", 404);
    return;
  }

  success(res, {
    vehicle: serializeVehicle({
      ...vehicle,
      _id: vehicle._id as mongoose.Types.ObjectId,
    }),
  });
}

export async function deleteVehicle(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    error(res, "Invalid vehicle id", "BAD_REQUEST", 400);
    return;
  }

  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), userId: req.user.userId, isActive: true },
    { $set: { isActive: false } },
    { new: true },
  ).lean();

  if (!vehicle) {
    error(res, "Vehicle not found", "NOT_FOUND", 404);
    return;
  }

  success(res, { message: "Vehicle removed" });
}

export async function vehicleStatus(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    error(res, "Invalid vehicle id", "BAD_REQUEST", 400);
    return;
  }

  const vehicle = await Vehicle.findOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: req.user.userId,
    isActive: true,
  }).lean();
  if (!vehicle) {
    error(res, "Vehicle not found", "NOT_FOUND", 404);
    return;
  }

  const latestRecord = await PUCRecord.findOne({
    vehicleId: vehicle._id,
    userId: req.user.userId,
  })
    .sort({ testDate: -1 })
    .lean();

  const statusInfo = getPUCStatus(
    latestRecord
      ? {
          expiryDate: latestRecord.expiryDate,
        }
      : null,
    vehicle.fuelType,
  );

  success(res, {
    vehicle: serializeVehicle({
      ...vehicle,
      _id: vehicle._id as mongoose.Types.ObjectId,
    }),
    pucStatus: {
      ...statusInfo,
      expiryDate: statusInfo.expiryDate ? statusInfo.expiryDate.toISOString() : null,
      validityDays: latestRecord
        ? validityDaysFromRecord(latestRecord.testDate, latestRecord.expiryDate)
        : null,
      latestRecord: latestRecord
        ? serializeRecord({
            ...latestRecord,
            _id: latestRecord._id as mongoose.Types.ObjectId,
          })
        : null,
    },
  });
}

export async function vehicleHistory(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    error(res, "Invalid vehicle id", "BAD_REQUEST", 400);
    return;
  }

  const vehicle = await Vehicle.findOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: req.user.userId,
    isActive: true,
  }).lean();
  if (!vehicle) {
    error(res, "Vehicle not found", "NOT_FOUND", 404);
    return;
  }

  const records = await PUCRecord.find({
    vehicleId: vehicle._id,
    userId: req.user.userId,
  })
    .sort({ testDate: -1 })
    .lean();

  success(res, {
    vehicle: serializeVehicle({
      ...vehicle,
      _id: vehicle._id as mongoose.Types.ObjectId,
    }),
    history: records.map((record) =>
      serializeRecord({
        ...record,
        _id: record._id as mongoose.Types.ObjectId,
      })),
  });
}

export async function logPUC(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    error(res, "Invalid vehicle id", "BAD_REQUEST", 400);
    return;
  }
  const parsed = logSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    error(res, "Invalid PUC log payload", "BAD_REQUEST", 400);
    return;
  }

  try {
    const record = await logPUCCompletion(req.user.userId, id, parsed.data);
    success(res, {
      record: serializeRecord({
        _id: record._id as mongoose.Types.ObjectId,
        testDate: record.testDate,
        expiryDate: record.expiryDate,
        pucCenterName: record.pucCenterName,
        pucCenterCity: record.pucCenterCity,
        certificateNumber: record.certificateNumber,
        readings: record.readings,
        pointsAwarded: record.pointsAwarded,
        co2ImpactKg: record.co2ImpactKg,
        isOnTime: record.isOnTime,
        createdAt: record.createdAt,
      }),
      reward: {
        pointsAwarded: record.pointsAwarded,
        co2ImpactKg: record.co2ImpactKg,
        isOnTime: record.isOnTime,
      },
    }, 201);
  } catch (e) {
    const code = e instanceof Error ? e.message : "UNKNOWN";
    if (code === "VEHICLE_NOT_FOUND") {
      error(res, "Vehicle not found", "NOT_FOUND", 404);
      return;
    }
    if (code === "EV_EXEMPT") {
      error(res, "Electric vehicles are PUC-exempt", "EV_EXEMPT", 400);
      return;
    }
    error(res, "Failed to log PUC", "PUC_LOG_FAILED", 500);
  }
}

export async function dashboard(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const userId = req.user.userId;

  const vehicles = await Vehicle.find({ userId, isActive: true }).sort({ createdAt: -1 }).lean();
  const vehicleIds = vehicles.map((vehicle) => vehicle._id as mongoose.Types.ObjectId);

  const records = vehicleIds.length
    ? await PUCRecord.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            vehicleId: { $in: vehicleIds },
          },
        },
        { $sort: { testDate: -1 } },
        {
          $group: {
            _id: "$vehicleId",
            latestRecord: { $first: "$$ROOT" },
          },
        },
      ])
    : [];
  const latestMap = new Map<string, {
    testDate: Date;
    expiryDate: Date;
    pucCenterName?: string;
    pucCenterCity?: string;
    certificateNumber?: string;
    readings?: {
      co?: number;
      hc?: number;
      smokeOpacity?: number;
      result?: string;
    };
    pointsAwarded: number;
    co2ImpactKg: number;
    isOnTime: boolean;
    createdAt: Date;
    _id: mongoose.Types.ObjectId;
  }>();
  for (const row of records) {
    latestMap.set(String(row._id), row.latestRecord);
  }

  const dashboardVehicles = vehicles.map((vehicle) => {
    const latestRecord = latestMap.get(String(vehicle._id)) ?? null;
    const statusInfo = getPUCStatus(
      latestRecord
        ? {
            expiryDate: latestRecord.expiryDate,
          }
        : null,
      vehicle.fuelType,
    );
    return {
      vehicle: serializeVehicle({
        ...vehicle,
        _id: vehicle._id as mongoose.Types.ObjectId,
      }),
      pucStatus: {
        ...statusInfo,
        expiryDate: statusInfo.expiryDate ? statusInfo.expiryDate.toISOString() : null,
        validityDays: latestRecord
          ? validityDaysFromRecord(latestRecord.testDate, latestRecord.expiryDate)
          : null,
        latestRecord: latestRecord
          ? serializeRecord({
              ...latestRecord,
              _id: latestRecord._id,
            })
          : null,
      },
    };
  });

  const [pointsAgg, co2Agg] = await Promise.all([
    PUCRecord.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, sum: { $sum: "$pointsAwarded" } } },
    ]),
    PUCRecord.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, sum: { $sum: "$co2ImpactKg" } } },
    ]),
  ]);

  const compliantCount = dashboardVehicles.filter((item) =>
    item.pucStatus.status === "valid" || item.pucStatus.status === "exempt",
  ).length;
  const expiringSoonCount = dashboardVehicles.filter((item) => item.pucStatus.status === "expiring_soon").length;
  const expiredCount = dashboardVehicles.filter((item) => item.pucStatus.status === "expired").length;
  const totalVehicles = dashboardVehicles.length;
  const overallComplianceRate = totalVehicles > 0
    ? Math.round((compliantCount / totalVehicles) * 100)
    : 0;

  success(res, {
    vehicles: dashboardVehicles,
    summary: {
      totalVehicles,
      compliantCount,
      expiringSoonCount,
      expiredCount,
      totalPointsEarned: pointsAgg[0]?.sum ?? 0,
      totalCo2ImpactKg: co2Agg[0]?.sum ?? 0,
      overallComplianceRate,
    },
  });
}

export async function stats(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user?.userId) {
    error(res, "Not authenticated", "UNAUTHORIZED", 401);
    return;
  }
  const uid = new mongoose.Types.ObjectId(req.user.userId);

  const [totalLogs, onTimeLogs, pointsAgg, co2Agg] = await Promise.all([
    PUCRecord.countDocuments({ userId: uid }),
    PUCRecord.countDocuments({ userId: uid, isOnTime: true }),
    PUCRecord.aggregate([{ $match: { userId: uid } }, { $group: { _id: null, sum: { $sum: "$pointsAwarded" } } }]),
    PUCRecord.aggregate([{ $match: { userId: uid } }, { $group: { _id: null, sum: { $sum: "$co2ImpactKg" } } }]),
  ]);

  const complianceRate = totalLogs > 0 ? Math.round((onTimeLogs / totalLogs) * 100) : 0;
  success(res, {
    totalLogs,
    onTimeLogs,
    complianceRate,
    totalPointsEarned: pointsAgg[0]?.sum ?? 0,
    totalCo2ImpactKg: co2Agg[0]?.sum ?? 0,
  });
}

export async function validityPreview(req: AuthRequest, res: Response): Promise<void> {
  const fuelType = String(req.query.fuelType ?? "");
  const testDate = req.query.testDate ? new Date(String(req.query.testDate)) : new Date();
  if (!["petrol", "diesel", "cng", "electric"].includes(fuelType)) {
    error(res, "Invalid fuelType", "BAD_REQUEST", 400);
    return;
  }
  if (fuelType === "electric") {
    success(res, { validityMonths: 0, expiryDate: null, exempt: true });
    return;
  }
  const expiryDate = computeExpiryDate(testDate, fuelType);
  success(res, {
    validityMonths: fuelType === "diesel" ? 3 : 6,
    expiryDate: expiryDate.toISOString(),
    exempt: false,
  });
}

