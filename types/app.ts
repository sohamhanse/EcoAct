export type AuthProvider = "email" | "google";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
  createdAt: string;
};

export type CarbonCategory = "transport" | "food" | "homeEnergy" | "shopping";

export type CarbonBreakdown = Record<CarbonCategory, number>;

export type CarbonAssessmentInput = {
  carKmPerWeek: number;
  busKmPerWeek: number;
  shortHaulFlightsPerYear: number;
  meatMealsPerWeek: number;
  electricityKwhPerMonth: number;
  renewableEnergySharePercent: number;
  onlineOrdersPerMonth: number;
};

export type CarbonAssessmentResult = {
  totalKgPerYear: number;
  breakdown: CarbonBreakdown;
};

export type Mission = {
  id: string;
  title: string;
  description: string;
  co2SavedKg: number;
  points: number;
  category: CarbonCategory;
};

export type BadgeId = "first-action" | "streak-7" | "points-100" | "saved-25";

export type Badge = {
  id: BadgeId;
  title: string;
  description: string;
};
