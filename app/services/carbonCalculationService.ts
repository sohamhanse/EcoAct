import type {
  BaselineQuestionnaire,
  BaselineResult,
  DailyQuickLog,
  ElectricityBand,
  EmissionCategory,
  OnlinePurchaseBand,
  PublicTransportFrequency,
} from "../types/domain";

const INDIA_AVERAGE_KG_PER_YEAR = 2000;
const AC_HOURLY_KWH_ESTIMATE = 1.2;
const KG_PER_KWH_ELECTRICITY = 0.82;
const KG_PER_KM_CAR = 0.21;
const KG_PER_TRIP_PUBLIC_TRANSPORT = 0.105;
const KG_PER_ORDER_SHOPPING = 0.5;

const publicTransportTripsMap: Record<PublicTransportFrequency, number> = {
  never: 0,
  "1-2": 2,
  "3-5": 4,
  daily: 10,
};

const electricityBandMap: Record<ElectricityBand, number> = {
  "<100": 90,
  "100-200": 150,
  "200-400": 300,
  "400+": 500,
};

const shoppingBandMap: Record<OnlinePurchaseBand, number> = {
  "0-2": 2,
  "3-5": 4,
  "6-10": 8,
  "10+": 12,
};

const foodBaseTonsMap = {
  vegetarian: 1.5,
  eggetarian: 1.8,
  "non-vegetarian": 2.2,
} as const;

const meatFrequencyAdjustmentTonsMap = {
  daily: 1.2,
  "3-4": 0.8,
  "1-2": 0.4,
  rarely: 0.1,
} as const;

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function maxCategoryEntry(record: Record<EmissionCategory, number>): EmissionCategory {
  return (Object.keys(record) as EmissionCategory[]).sort((a, b) => record[b] - record[a])[0];
}

export function calculateBaselineResult(questionnaire: BaselineQuestionnaire): BaselineResult {
  const annualCarKg = questionnaire.carKmPerWeek * KG_PER_KM_CAR * 52;

  const weeklyPublicTrips = publicTransportTripsMap[questionnaire.publicTransportFrequency];
  const annualPublicTransportKg = weeklyPublicTrips * KG_PER_TRIP_PUBLIC_TRANSPORT * 52;

  const annualGroceryTransportKg =
    questionnaire.groceryTransportMode === "car"
      ? 12 * KG_PER_KM_CAR * 52
      : questionnaire.groceryTransportMode === "public-transport"
        ? 12 * KG_PER_TRIP_PUBLIC_TRANSPORT * 52
        : 0;

  const annualTransportKg = annualCarKg + annualPublicTransportKg + annualGroceryTransportKg;

  const baseFoodKg = foodBaseTonsMap[questionnaire.dietType] * 1000;
  const meatAdjustmentKg = meatFrequencyAdjustmentTonsMap[questionnaire.meatFrequency] * 1000;
  const annualFoodKg = baseFoodKg + meatAdjustmentKg;

  const monthlyElectricityKwh = electricityBandMap[questionnaire.electricityBand];
  const annualElectricityKg = monthlyElectricityKwh * 12 * KG_PER_KWH_ELECTRICITY;
  const annualAcKg = questionnaire.acHoursPerDay * 365 * AC_HOURLY_KWH_ESTIMATE * KG_PER_KWH_ELECTRICITY;
  const annualEnergyKg = annualElectricityKg + annualAcKg;

  const monthlyOrders = shoppingBandMap[questionnaire.onlinePurchaseBand];
  const annualShoppingKg = monthlyOrders * 12 * KG_PER_ORDER_SHOPPING;

  const breakdownKg: Record<EmissionCategory, number> = {
    transport: roundToTwo(annualTransportKg),
    food: roundToTwo(annualFoodKg),
    energy: roundToTwo(annualEnergyKg),
    shopping: roundToTwo(annualShoppingKg),
  };

  const annualTotalKg = roundToTwo(
    breakdownKg.transport + breakdownKg.food + breakdownKg.energy + breakdownKg.shopping,
  );
  const monthlyEquivalentKg = roundToTwo(annualTotalKg / 12);

  return {
    annualTotalKg,
    monthlyEquivalentKg,
    annualTotalTons: roundToTwo(annualTotalKg / 1000),
    breakdownKg,
    topEmissionSource: maxCategoryEntry(breakdownKg),
    indiaAverageKg: INDIA_AVERAGE_KG_PER_YEAR,
  };
}

export function calculateDailyQuickLogEmission(input: {
  carKm: number;
  foodType: DailyQuickLog["foodType"];
  acHours: number;
}): number {
  const carKg = input.carKm * KG_PER_KM_CAR;
  const foodKg = input.foodType === "non-veg" ? 7 : 2;
  const acKg = input.acHours * AC_HOURLY_KWH_ESTIMATE * KG_PER_KWH_ELECTRICITY;

  return roundToTwo(carKg + foodKg + acKg);
}

export function calculateMonthlyUtilityEmission(input: {
  electricityKwh: number;
  lpgUsage: number;
  gasCylinderCount: number;
}): number {
  const electricityKg = input.electricityKwh * KG_PER_KWH_ELECTRICITY;

  // LPG usage is treated as m3 equivalent for MVP estimation.
  const lpgKg = input.lpgUsage * 2.04;

  // One domestic cylinder approximated as 14.2 units of LPG.
  const cylinderKg = input.gasCylinderCount * 14.2 * 2.04;

  return roundToTwo(electricityKg + lpgKg + cylinderKg);
}

export function calculateNetImpact(params: {
  baselineAnnualKg: number;
  totalSavedKg: number;
}): { netImpactKg: number; improvementPercent: number } {
  const netImpactKg = Math.max(roundToTwo(params.baselineAnnualKg - params.totalSavedKg), 0);
  const improvementPercent =
    params.baselineAnnualKg > 0 ? roundToTwo((params.totalSavedKg / params.baselineAnnualKg) * 100) : 0;

  return {
    netImpactKg,
    improvementPercent,
  };
}
