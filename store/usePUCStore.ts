import { create } from "zustand";
import type { ApiPUCDashboard, ApiPollutionMapData } from "@/src/types";

type PUCState = {
  dashboard: ApiPUCDashboard | null;
  mapData: ApiPollutionMapData | null;
  selectedVehicleId: string | null;
  setDashboard: (dashboard: ApiPUCDashboard | null) => void;
  setMapData: (mapData: ApiPollutionMapData | null) => void;
  setSelectedVehicleId: (vehicleId: string | null) => void;
};

export const usePUCStore = create<PUCState>((set) => ({
  dashboard: null,
  mapData: null,
  selectedVehicleId: null,
  setDashboard: (dashboard) => set({ dashboard }),
  setMapData: (mapData) => set({ mapData }),
  setSelectedVehicleId: (selectedVehicleId) => set({ selectedVehicleId }),
}));

