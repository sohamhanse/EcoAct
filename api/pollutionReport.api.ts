import { axiosInstance } from "./axiosInstance";
import type {
  ApiPollutionLeaderboardRow,
  ApiPollutionMapData,
  ApiPollutionReport,
  PollutionLevel,
  PollutionType,
  PollutionVehicleType,
} from "@/src/types";

export async function submitPollutionReport(payload: {
  vehicleNumber?: string;
  vehicleType: PollutionVehicleType;
  vehicleColor?: string;
  pollutionLevel: PollutionLevel;
  pollutionType: PollutionType;
  description?: string;
  latitude: number;
  longitude: number;
  locationName?: string;
  city: string;
  state: string;
}): Promise<{
  report: ApiPollutionReport & { potentialImpactKg: number };
}> {
  const { data } = await axiosInstance.post<{
    report: ApiPollutionReport & { potentialImpactKg: number };
  }>("/puc/reports", payload);
  return data;
}

export async function getPollutionMapData(params: {
  lat: number;
  lng: number;
  radius?: number;
  hours?: number;
}): Promise<ApiPollutionMapData> {
  const { data } = await axiosInstance.get<ApiPollutionMapData>("/puc/reports/map", { params });
  return data;
}

export async function getMyPollutionReports(): Promise<{ reports: ApiPollutionReport[] }> {
  const { data } = await axiosInstance.get<{ reports: ApiPollutionReport[] }>("/puc/reports/my");
  return data;
}

export async function getPollutionCityStats(
  city: string,
  params?: { hours?: number },
): Promise<{
  city: string;
  totalReports: number;
  severeCount: number;
  heavyCount: number;
  mildCount: number;
  topAreas: string[];
}> {
  const { data } = await axiosInstance.get<{
    city: string;
    totalReports: number;
    severeCount: number;
    heavyCount: number;
    mildCount: number;
    topAreas: string[];
  }>(`/puc/reports/city/${encodeURIComponent(city)}`, { params });
  return data;
}

export async function getPollutionReportById(reportId: string): Promise<{ report: ApiPollutionReport }> {
  const { data } = await axiosInstance.get<{ report: ApiPollutionReport }>(`/puc/reports/${reportId}`);
  return data;
}

export async function getPollutionLeaderboard(params?: {
  days?: number;
}): Promise<{ leaderboard: ApiPollutionLeaderboardRow[]; days: number }> {
  const { data } = await axiosInstance.get<{ leaderboard: ApiPollutionLeaderboardRow[]; days: number }>(
    "/puc/reports/leaderboard",
    { params },
  );
  return data;
}

