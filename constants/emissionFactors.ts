export const EMISSION_FACTORS = {
  CAR_KM: 0.21,
  PUBLIC_TRANSPORT: {
    daily: 52,
    few_times_week: 150,
    rarely: 30,
    never: 0,
  },
  DIET: {
    vegan: 1000,
    vegetarian: 1500,
    non_vegetarian: 2500,
  },
  MEAT_FREQUENCY_MULTIPLIER: {
    daily: 1.4,
    few_times_week: 1.2,
    rarely: 1.0,
    never: 0.8,
  },
  ELECTRICITY_KWH: 0.82,
  AC_USAGE: 1.5,
  ELECTRICITY_RANGE: {
    low: 1200,
    medium: 2400,
    high: 4800,
    very_high: 7200,
  },
  ONLINE_PURCHASE: 6.5,
  FLIGHT_PER_TRIP: 250,
};

export type PublicTransportFrequency = "daily" | "few_times_week" | "rarely" | "never";
export type DietType = "vegan" | "vegetarian" | "non_vegetarian";
export type MeatFrequency = "daily" | "few_times_week" | "rarely" | "never";
export type ElectricityRange = "low" | "medium" | "high" | "very_high";

export interface CalculatorAnswers {
  carKmPerWeek: number;
  publicTransportFrequency: PublicTransportFrequency;
  dietType: DietType;
  meatFrequency: MeatFrequency;
  acUsageHours: number;
  electricityRange: ElectricityRange;
  onlinePurchasesPerMonth: number;
  flightsPerYear: number;
}

export interface FootprintBreakdown {
  transport: number;
  food: number;
  energy: number;
  shopping: number;
}

export function calculateFootprint(answers: CalculatorAnswers): { total: number; breakdown: FootprintBreakdown } {
  const transport =
    answers.carKmPerWeek * 52 * EMISSION_FACTORS.CAR_KM +
    EMISSION_FACTORS.PUBLIC_TRANSPORT[answers.publicTransportFrequency] +
    answers.flightsPerYear * EMISSION_FACTORS.FLIGHT_PER_TRIP;

  const food =
    EMISSION_FACTORS.DIET[answers.dietType] *
    EMISSION_FACTORS.MEAT_FREQUENCY_MULTIPLIER[answers.meatFrequency];

  const energy =
    EMISSION_FACTORS.ELECTRICITY_RANGE[answers.electricityRange] * EMISSION_FACTORS.ELECTRICITY_KWH +
    answers.acUsageHours * 365 * EMISSION_FACTORS.AC_USAGE;

  const shopping = answers.onlinePurchasesPerMonth * 12 * EMISSION_FACTORS.ONLINE_PURCHASE;

  return {
    total: Math.round(transport + food + energy + shopping),
    breakdown: {
      transport: Math.round(transport),
      food: Math.round(food),
      energy: Math.round(energy),
      shopping: Math.round(shopping),
    },
  };
}
