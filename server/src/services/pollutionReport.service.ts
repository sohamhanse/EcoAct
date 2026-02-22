import mongoose from "mongoose";
import { PollutionReport, type IPollutionReport } from "../models/PollutionReport.model.js";
import { User } from "../models/User.model.js";
import { createMissionComplete } from "./communityActivity.service.js";
import { awardBadge } from "./userBadge.service.js";
import { PUC_NOTIFICATIONS, sendPushNotification } from "./pushNotification.service.js";

export const REPORT_POINTS = {
  mild: 20,
  heavy: 35,
  severe: 50,
} as const;

export const POLLUTION_IMPACT_KG: Record<string, number> = {
  mild: 120,
  heavy: 450,
  severe: 900,
};

function normalizeVehicleNumber(vehicleNumber?: string): string {
  return String(vehicleNumber ?? "").replace(/\s+/g, "").toUpperCase().trim();
}

export async function submitPollutionReport(
  reporterId: string,
  data: {
    vehicleNumber?: string;
    vehicleType: string;
    vehicleColor?: string;
    pollutionLevel: "mild" | "heavy" | "severe";
    pollutionType: "black_smoke" | "white_smoke" | "strong_odor" | "visible_exhaust" | "multiple";
    description?: string;
    latitude: number;
    longitude: number;
    locationName?: string;
    city: string;
    state: string;
  },
): Promise<IPollutionReport> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await PollutionReport.countDocuments({
    reporterId,
    reportedAt: { $gte: today },
  });
  if (todayCount >= 10) throw new Error("DAILY_REPORT_LIMIT_REACHED");

  const pointsAwarded = REPORT_POINTS[data.pollutionLevel];

  const report = await PollutionReport.create({
    reporterId,
    vehicleNumber: normalizeVehicleNumber(data.vehicleNumber),
    vehicleType: data.vehicleType,
    vehicleColor: data.vehicleColor,
    pollutionLevel: data.pollutionLevel,
    pollutionType: data.pollutionType,
    description: data.description,
    location: {
      type: "Point",
      coordinates: [data.longitude, data.latitude],
    },
    locationName: data.locationName,
    city: data.city.trim(),
    state: data.state.trim(),
    pointsAwarded,
  });

  await User.findByIdAndUpdate(reporterId, {
    $inc: { totalPoints: pointsAwarded },
  });

  const user = await User.findById(reporterId).select("_id communityId").lean();
  if (user?.communityId) {
    await createMissionComplete(
      user.communityId,
      new mongoose.Types.ObjectId(reporterId),
      {
        missionTitle: `Reported a ${data.pollutionLevel} polluter`,
        missionCo2Saved: 0,
        missionCategory: "transport",
      },
    );
  }

  await checkAndCreateHotspotAlert(data.latitude, data.longitude, data.city);
  await checkReporterBadges(reporterId);

  return report;
}

async function checkAndCreateHotspotAlert(
  lat: number,
  lng: number,
  city: string,
): Promise<void> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const nearbyCount = await PollutionReport.countDocuments({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: 500,
      },
    },
    reportedAt: { $gte: yesterday },
  });

  if (nearbyCount < 5) return;

  const nearbyUsers = await User.find({
    communityId: { $ne: null },
  })
    .select("_id")
    .limit(50)
    .lean();

  const locationName = city || "your area";
  const payload = PUC_NOTIFICATIONS.hotspot_alert(locationName, nearbyCount);
  await Promise.all(
    nearbyUsers.map((u) =>
      sendPushNotification(String(u._id), payload.title, payload.body, payload.data),
    ),
  );
}

async function checkReporterBadges(userId: string): Promise<void> {
  const totalReports = await PollutionReport.countDocuments({ reporterId: userId });

  if (totalReports >= 1) await awardBadge(userId, "reporter_first");
  if (totalReports >= 10) await awardBadge(userId, "reporter_10");
  if (totalReports >= 50) await awardBadge(userId, "reporter_50");
  if (totalReports >= 100) await awardBadge(userId, "reporter_100");
}

export async function getMapData(
  lat: number,
  lng: number,
  radiusKm = 10,
  hours = 24,
): Promise<{
  reports: Array<{
    _id: string;
    reporterName: string;
    vehicleNumber: string;
    vehicleType: string;
    pollutionLevel: "mild" | "heavy" | "severe";
    pollutionType: string;
    description: string;
    location: { lat: number; lng: number };
    locationName: string;
    city: string;
    state: string;
    status: string;
    reportedAt: string;
    pointsAwarded: number;
  }>;
  hotspots: Array<{
    lat: number;
    lng: number;
    count: number;
    maxLevel: "mild" | "heavy" | "severe";
    locationName: string;
  }>;
  cityStats: { totalReports: number; severeCount: number; topAreas: string[] };
}> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const reports = await PollutionReport.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000,
      },
    },
    reportedAt: { $gte: since },
  })
    .populate("reporterId", "name")
    .sort({ reportedAt: -1 })
    .limit(200)
    .lean();

  const clusters: Record<string, {
    lat: number;
    lng: number;
    count: number;
    levels: Array<"mild" | "heavy" | "severe">;
    locationName: string;
  }> = {};

  for (const report of reports) {
    const reportLat = report.location.coordinates[1];
    const reportLng = report.location.coordinates[0];
    const gridLat = Math.round(reportLat * 100) / 100;
    const gridLng = Math.round(reportLng * 100) / 100;
    const key = `${gridLat},${gridLng}`;

    if (!clusters[key]) {
      clusters[key] = {
        lat: gridLat,
        lng: gridLng,
        count: 0,
        levels: [],
        locationName: report.locationName ?? "",
      };
    }
    clusters[key].count += 1;
    clusters[key].levels.push(report.pollutionLevel);
  }

  const hotspots = Object.values(clusters).map((cluster) => {
    const maxLevel: "mild" | "heavy" | "severe" = cluster.levels.includes("severe")
      ? "severe"
      : cluster.levels.includes("heavy")
        ? "heavy"
        : "mild";
    return {
      lat: cluster.lat,
      lng: cluster.lng,
      count: cluster.count,
      locationName: cluster.locationName,
      maxLevel,
    };
  });

  return {
    reports: reports.map((report) => ({
      _id: String(report._id),
      reporterName: (report.reporterId as unknown as { name?: string })?.name ?? "Anonymous",
      vehicleNumber: report.vehicleNumber ?? "",
      vehicleType: report.vehicleType,
      pollutionLevel: report.pollutionLevel,
      pollutionType: report.pollutionType,
      description: report.description ?? "",
      location: {
        lat: report.location.coordinates[1],
        lng: report.location.coordinates[0],
      },
      locationName: report.locationName ?? "",
      city: report.city,
      state: report.state,
      status: report.status,
      reportedAt: report.reportedAt.toISOString(),
      pointsAwarded: report.pointsAwarded,
    })),
    hotspots,
    cityStats: {
      totalReports: reports.length,
      severeCount: reports.filter((r) => r.pollutionLevel === "severe").length,
      topAreas: [
        ...new Set(
          reports
            .map((r) => r.locationName)
            .filter((v): v is string => !!v),
        ),
      ].slice(0, 5),
    },
  };
}
