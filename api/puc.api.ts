import { axiosInstance } from "./axiosInstance";
import type {
  ApiPUCDashboard,
  ApiPUCRecord,
  ApiPUCStats,
  ApiVehicle,
  ApiVehiclePUCStatus,
} from "@/src/types";

export async function getPUCVehicles(): Promise<ApiVehicle[]> {
  const { data } = await axiosInstance.get<{ vehicles: ApiVehicle[] }>("/puc/vehicles");
  return data.vehicles;
}

export async function createVehicle(payload: {
  nickname: string;
  vehicleNumber: string;
  vehicleType: "two_wheeler" | "three_wheeler" | "four_wheeler" | "commercial";
  fuelType: "petrol" | "diesel" | "cng" | "electric";
  brand?: string;
  model?: string;
  yearOfManufacture?: number;
}): Promise<ApiVehicle> {
  const { data } = await axiosInstance.post<{ vehicle: ApiVehicle }>("/puc/vehicles", payload);
  return data.vehicle;
}

export async function updateVehicle(
  vehicleId: string,
  payload: Partial<{
    nickname: string;
    vehicleNumber: string;
    vehicleType: "two_wheeler" | "three_wheeler" | "four_wheeler" | "commercial";
    fuelType: "petrol" | "diesel" | "cng" | "electric";
    brand: string;
    model: string;
    yearOfManufacture: number;
  }>,
): Promise<ApiVehicle> {
  const { data } = await axiosInstance.patch<{ vehicle: ApiVehicle }>(`/puc/vehicles/${vehicleId}`, payload);
  return data.vehicle;
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  await axiosInstance.delete(`/puc/vehicles/${vehicleId}`);
}

export async function getVehicleStatus(vehicleId: string): Promise<{
  vehicle: ApiVehicle;
  pucStatus: ApiVehiclePUCStatus;
}> {
  const { data } = await axiosInstance.get<{ vehicle: ApiVehicle; pucStatus: ApiVehiclePUCStatus }>(
    `/puc/vehicles/${vehicleId}/status`,
  );
  return data;
}

export async function getVehicleHistory(vehicleId: string): Promise<{
  vehicle: ApiVehicle;
  history: ApiPUCRecord[];
}> {
  const { data } = await axiosInstance.get<{ vehicle: ApiVehicle; history: ApiPUCRecord[] }>(
    `/puc/vehicles/${vehicleId}/history`,
  );
  return data;
}

export async function logVehiclePUC(
  vehicleId: string,
  payload: {
    testDate: string;
    pucCenterName?: string;
    pucCenterCity?: string;
    certificateNumber?: string;
    readings?: {
      co?: number;
      hc?: number;
      smokeOpacity?: number;
      result?: "pass" | "fail";
    };
  },
): Promise<{
  record: ApiPUCRecord;
  reward: { pointsAwarded: number; co2ImpactKg: number; isOnTime: boolean };
}> {
  const { data } = await axiosInstance.post<{
    record: ApiPUCRecord;
    reward: { pointsAwarded: number; co2ImpactKg: number; isOnTime: boolean };
  }>(`/puc/vehicles/${vehicleId}/log`, payload);
  return data;
}

export async function getPUCDashboard(): Promise<ApiPUCDashboard> {
  const { data } = await axiosInstance.get<ApiPUCDashboard>("/puc/dashboard");
  return data;
}

export async function getPUCStats(): Promise<ApiPUCStats> {
  const { data } = await axiosInstance.get<ApiPUCStats>("/puc/stats");
  return data;
}

export async function getPUCValidityPreview(params: {
  fuelType: "petrol" | "diesel" | "cng" | "electric";
  testDate?: string;
}): Promise<{ validityMonths: number; expiryDate: string | null; exempt: boolean }> {
  const { data } = await axiosInstance.get<{
    validityMonths: number;
    expiryDate: string | null;
    exempt: boolean;
  }>("/puc/validity-preview", { params });
  return data;
}

