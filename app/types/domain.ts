export type AuthProvider = "google" | "manual";

export type Account = {
  id: string;
  name: string;
  email: string;
  password?: string;
  provider: AuthProvider;
  createdAt: string;
};

export type PublicTransportFrequency = "never" | "1-2" | "3-5" | "daily";
export type GroceryTransportMode = "car" | "bike" | "public-transport" | "walk" | "bicycle";
export type DietType = "vegetarian" | "eggetarian" | "non-vegetarian";
export type MeatFrequency = "daily" | "3-4" | "1-2" | "rarely";
export type ElectricityBand = "<100" | "100-200" | "200-400" | "400+";
export type OnlinePurchaseBand = "0-2" | "3-5" | "6-10" | "10+";

export type BaselineQuestionnaire = {
  carKmPerWeek: number;
  publicTransportFrequency: PublicTransportFrequency;
  groceryTransportMode: GroceryTransportMode;
  dietType: DietType;
  meatFrequency: MeatFrequency;
  acHoursPerDay: number;
  electricityBand: ElectricityBand;
  onlinePurchaseBand: OnlinePurchaseBand;
};

export type EmissionCategory = "transport" | "food" | "energy" | "shopping";

export type BaselineResult = {
  annualTotalKg: number;
  monthlyEquivalentKg: number;
  annualTotalTons: number;
  breakdownKg: Record<EmissionCategory, number>;
  topEmissionSource: EmissionCategory;
  indiaAverageKg: number;
};

export type DailyFoodType = "veg" | "non-veg";

export type DailyQuickLog = {
  dateKey: string;
  carKm: number;
  foodType: DailyFoodType;
  acHours: number;
  dailyEmissionKg: number;
};

export type MonthlyUtilityLog = {
  monthKey: string;
  electricityKwh: number;
  lpgUsage: number;
  gasCylinderCount: number;
  utilityEmissionKg: number;
};

export type MissionDifficulty = "easy" | "medium" | "hard";

export type Mission = {
  id: string;
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  category: EmissionCategory;
  co2SavedKg: number;
};

export type BadgeId =
  | "bronze-10kg"
  | "silver-50kg"
  | "gold-100kg"
  | "climate-warrior-500kg"
  | "streak-30";

export type AppState = {
  onboardingCompleted: boolean;
  accounts: Account[];
  currentUserId: string | null;
  baselineQuestionnaire: BaselineQuestionnaire | null;
  baselineResult: BaselineResult | null;
  totalSavedKg: number;
  points: number;
  streak: number;
  lastMissionCompletionDate: string | null;
  badges: BadgeId[];
  dailyLogsByDate: Record<string, DailyQuickLog>;
  monthlyUtilitiesByMonth: Record<string, MonthlyUtilityLog>;
  missionsByDate: Record<string, Mission[]>;
  missionCompletionsByDate: Record<string, string[]>;
  allMissionsBonusDates: string[];
};
