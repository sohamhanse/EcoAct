import mongoose from "mongoose";
import { Vehicle } from "../models/Vehicle.model.js";
import { PUCRecord, type IPUCRecord } from "../models/PUCRecord.model.js";
import { User } from "../models/User.model.js";
import { createMissionComplete } from "./communityActivity.service.js";
import { awardBadge } from "./userBadge.service.js";
import { PUC_NOTIFICATIONS, sendPushNotification } from "./pushNotification.service.js";

export const PUC_VALIDITY_MONTHS: Record<string, number> = {
  petrol: 6,
  cng: 6,
  diesel: 3,
  electric: 0,
};

export const PUC_POINTS = {
  on_time: 150,
  late: 50,
  bonus_streak: 50,
};

export const PUC_CO2_IMPACT: Record<string, number> = {
  two_wheeler: 28,
  three_wheeler: 42,
  four_wheeler: 65,
  commercial: 120,
};

const REMINDER_THRESHOLDS = [30, 15, 7, 1];

export function computeExpiryDate(testDate: Date, fuelType: string, validityMonths?: number): Date {
  const months = validityMonths ?? PUC_VALIDITY_MONTHS[fuelType] ?? 6;
  const expiry = new Date(testDate);
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
}

function isInitialOneYearEligibility(yearOfManufacture?: number | null): boolean {
  if (!yearOfManufacture) return false;
  const currentYear = new Date().getFullYear();
  return currentYear - yearOfManufacture <= 1;
}

export function getPUCStatus(
  latestRecord: Pick<IPUCRecord, "expiryDate"> | null,
  fuelType?: string,
): {
  status: "valid" | "expiring_soon" | "expired" | "no_record" | "exempt";
  daysRemaining: number;
  expiryDate: Date | null;
  urgencyLevel: "safe" | "warning" | "critical" | "overdue";
} {
  if (fuelType === "electric") {
    return {
      status: "exempt",
      daysRemaining: 0,
      expiryDate: null,
      urgencyLevel: "safe",
    };
  }

  if (!latestRecord) {
    return {
      status: "no_record",
      daysRemaining: 0,
      expiryDate: null,
      urgencyLevel: "critical",
    };
  }

  const now = new Date();
  const expiry = new Date(latestRecord.expiryDate);
  const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: "expired", daysRemaining, expiryDate: expiry, urgencyLevel: "overdue" };
  }
  if (daysRemaining <= 15) {
    return { status: "expiring_soon", daysRemaining, expiryDate: expiry, urgencyLevel: "critical" };
  }
  if (daysRemaining <= 30) {
    return { status: "expiring_soon", daysRemaining, expiryDate: expiry, urgencyLevel: "warning" };
  }
  return { status: "valid", daysRemaining, expiryDate: expiry, urgencyLevel: "safe" };
}

export async function logPUCCompletion(
  userId: string,
  vehicleId: string,
  data: {
    testDate: Date;
    pucCenterName?: string;
    pucCenterCity?: string;
    certificateNumber?: string;
    readings?: { co?: number; hc?: number; smokeOpacity?: number; result?: "pass" | "fail" };
  },
): Promise<IPUCRecord> {
  const vehicle = await Vehicle.findOne({ _id: vehicleId, userId, isActive: true });
  if (!vehicle) throw new Error("VEHICLE_NOT_FOUND");
  if (vehicle.fuelType === "electric") throw new Error("EV_EXEMPT");

  const previousRecord = await PUCRecord.findOne({ vehicleId, userId }).sort({ testDate: -1 });
  const initialOneYear = !previousRecord && isInitialOneYearEligibility(vehicle.yearOfManufacture);
  const validityMonths = initialOneYear ? 12 : undefined;
  const expiryDate = computeExpiryDate(data.testDate, vehicle.fuelType, validityMonths);

  const isOnTime = !previousRecord || data.testDate <= new Date(previousRecord.expiryDate);
  const recentRecords = await PUCRecord.find({ vehicleId, userId })
    .sort({ testDate: -1 })
    .limit(2);
  const hasStreak = isOnTime && recentRecords.length >= 2 && recentRecords.every((r) => r.isOnTime);

  const basePoints = isOnTime ? PUC_POINTS.on_time : PUC_POINTS.late;
  const bonusPoints = hasStreak ? PUC_POINTS.bonus_streak : 0;
  const pointsAwarded = basePoints + bonusPoints;
  const co2ImpactKg = PUC_CO2_IMPACT[vehicle.vehicleType] ?? 40;

  const record = await PUCRecord.create({
    vehicleId,
    userId,
    testDate: data.testDate,
    expiryDate,
    pucCenterName: data.pucCenterName,
    pucCenterCity: data.pucCenterCity,
    certificateNumber: data.certificateNumber,
    readings: {
      co: data.readings?.co,
      hc: data.readings?.hc,
      smokeOpacity: data.readings?.smokeOpacity,
      result: data.readings?.result ?? "pass",
    },
    pointsAwarded,
    co2ImpactKg,
    isOnTime,
  });

  await User.findByIdAndUpdate(userId, {
    $inc: {
      totalPoints: pointsAwarded,
      totalCo2Saved: co2ImpactKg,
    },
  });

  await checkAndAwardPUCBadges(userId, String(vehicle._id));

  const user = await User.findById(userId).select("communityId").lean();
  if (user?.communityId) {
    await createMissionComplete(
      user.communityId,
      new mongoose.Types.ObjectId(userId),
      {
        missionTitle: `Got PUC done for ${vehicle.nickname}`,
        missionCo2Saved: co2ImpactKg,
        missionCategory: "transport",
      },
    );
  }

  return record;
}

export async function checkAndAwardPUCBadges(userId: string, vehicleId: string): Promise<void> {
  const onTimeCount = await PUCRecord.countDocuments({ userId, isOnTime: true });

  if (onTimeCount >= 1) await awardBadge(userId, "puc_first");
  if (onTimeCount >= 5) await awardBadge(userId, "puc_5");
  if (onTimeCount >= 10) await awardBadge(userId, "puc_10");

  const streakRecords = await PUCRecord.find({ userId, vehicleId })
    .sort({ testDate: -1 })
    .limit(3)
    .select("isOnTime")
    .lean();
  const hasThreeOnTimeStreak =
    streakRecords.length >= 3 &&
    streakRecords.every((record) => record.isOnTime);
  if (hasThreeOnTimeStreak) {
    await awardBadge(userId, "puc_streak_3");
  }
}

function dayRangeFromToday(daysFromNow: number): { dayStart: Date; dayEnd: Date } {
  const target = new Date();
  target.setDate(target.getDate() + daysFromNow);
  const dayStart = new Date(target);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(target);
  dayEnd.setHours(23, 59, 59, 999);
  return { dayStart, dayEnd };
}

export async function sendPUCExpiryReminders(): Promise<void> {
  for (const days of REMINDER_THRESHOLDS) {
    const { dayStart, dayEnd } = dayRangeFromToday(days);
    const records = await PUCRecord.find({
      expiryDate: { $gte: dayStart, $lte: dayEnd },
      reminderSentDays: { $ne: days },
    })
      .populate("vehicleId", "nickname isActive")
      .select("vehicleId userId reminderSentDays");

    for (const record of records) {
      const vehicleDoc = record.vehicleId as unknown as { nickname?: string; isActive?: boolean } | null;
      if (!vehicleDoc?.isActive) continue;
      const vehicleName = vehicleDoc.nickname ?? "Your vehicle";

      const notificationFactory =
        days === 30
          ? PUC_NOTIFICATIONS.expiry_30
          : days === 15
            ? PUC_NOTIFICATIONS.expiry_15
            : days === 7
              ? PUC_NOTIFICATIONS.expiry_7
              : PUC_NOTIFICATIONS.expiry_1;

      const payload = notificationFactory(vehicleName);
      const sent = await sendPushNotification(
        String(record.userId),
        payload.title,
        payload.body,
        payload.data,
      );
      if (!sent) continue;

      await PUCRecord.findByIdAndUpdate(record._id, {
        $addToSet: { reminderSentDays: days },
        $set: { reminderSent: true },
      });
    }
  }
}

