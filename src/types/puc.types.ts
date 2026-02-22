export type VehicleType = "two_wheeler" | "three_wheeler" | "four_wheeler" | "commercial";
export type FuelType = "petrol" | "diesel" | "cng" | "electric";

export interface ApiVehicle {
  _id: string;
  nickname: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  fuelType: FuelType;
  brand: string;
  model: string;
  yearOfManufacture: number | null;
  isActive: boolean;
}

export interface ApiPUCRecord {
  _id: string;
  testDate: string;
  expiryDate: string;
  pucCenterName: string;
  pucCenterCity: string;
  certificateNumber: string;
  readings: {
    co: number | null;
    hc: number | null;
    smokeOpacity: number | null;
    result: "pass" | "fail";
  };
  pointsAwarded: number;
  co2ImpactKg: number;
  isOnTime: boolean;
  createdAt: string;
}

export type PUCStatusType = "valid" | "expiring_soon" | "expired" | "no_record" | "exempt";
export type PUCUrgencyLevel = "safe" | "warning" | "critical" | "overdue";

export interface ApiVehiclePUCStatus {
  status: PUCStatusType;
  daysRemaining: number;
  expiryDate: string | null;
  urgencyLevel: PUCUrgencyLevel;
  validityDays: number | null;
  latestRecord: ApiPUCRecord | null;
}

export interface ApiVehicleWithStatus {
  vehicle: ApiVehicle;
  pucStatus: ApiVehiclePUCStatus;
}

export interface ApiPUCDashboard {
  vehicles: ApiVehicleWithStatus[];
  summary: {
    totalVehicles: number;
    compliantCount: number;
    expiringSoonCount: number;
    expiredCount: number;
    totalPointsEarned: number;
    totalCo2ImpactKg: number;
    overallComplianceRate: number;
  };
}

export interface ApiPUCStats {
  totalLogs: number;
  onTimeLogs: number;
  complianceRate: number;
  totalPointsEarned: number;
  totalCo2ImpactKg: number;
}

export type PollutionLevel = "mild" | "heavy" | "severe";
export type PollutionType = "black_smoke" | "white_smoke" | "strong_odor" | "visible_exhaust" | "multiple";
export type PollutionVehicleType =
  | "two_wheeler"
  | "three_wheeler"
  | "four_wheeler"
  | "commercial_truck"
  | "bus"
  | "unknown";

export interface ApiPollutionReport {
  _id: string;
  reporterName?: string;
  vehicleNumber: string;
  vehicleType: PollutionVehicleType;
  vehicleColor?: string;
  pollutionLevel: PollutionLevel;
  pollutionType: PollutionType;
  description: string;
  locationName: string;
  city: string;
  state: string;
  location: { lat: number; lng: number };
  status: "pending" | "verified" | "dismissed";
  verificationCount?: number;
  pointsAwarded: number;
  reportedAt: string;
}

export interface ApiPollutionHotspot {
  lat: number;
  lng: number;
  count: number;
  maxLevel: PollutionLevel;
  locationName: string;
}

export interface ApiPollutionMapData {
  reports: ApiPollutionReport[];
  hotspots: ApiPollutionHotspot[];
  cityStats: {
    totalReports: number;
    severeCount: number;
    topAreas: string[];
  };
}

export interface ApiPollutionLeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  reportsCount: number;
  points: number;
}

