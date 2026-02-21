import { emissionFactors } from "./emissionFactors";
import type { CarbonAssessmentInput, CarbonAssessmentResult } from "@/types/app";

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;
const MEALS_PER_WEEK = 21;

function clamp(value: number, min = 0, max = Number.POSITIVE_INFINITY): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateAnnualCarbon(input: CarbonAssessmentInput): CarbonAssessmentResult {
  const carKmPerWeek = clamp(input.carKmPerWeek);
  const busKmPerWeek = clamp(input.busKmPerWeek);
  const shortHaulFlightsPerYear = clamp(input.shortHaulFlightsPerYear);
  const meatMealsPerWeek = clamp(input.meatMealsPerWeek, 0, MEALS_PER_WEEK);
  const electricityKwhPerMonth = clamp(input.electricityKwhPerMonth);
  const renewableEnergySharePercent = clamp(input.renewableEnergySharePercent, 0, 100);
  const onlineOrdersPerMonth = clamp(input.onlineOrdersPerMonth);

  const transport =
    carKmPerWeek * WEEKS_PER_YEAR * emissionFactors.carKgPerKm +
    busKmPerWeek * WEEKS_PER_YEAR * emissionFactors.busKgPerKm +
    shortHaulFlightsPerYear * emissionFactors.shortHaulFlightKg;

  const plantMealsPerWeek = MEALS_PER_WEEK - meatMealsPerWeek;
  const food =
    (meatMealsPerWeek * emissionFactors.meatMealKg +
      plantMealsPerWeek * emissionFactors.plantMealKg) *
    WEEKS_PER_YEAR;

  const renewableMultiplier = 1 - renewableEnergySharePercent / 100;
  const homeEnergy =
    electricityKwhPerMonth *
    MONTHS_PER_YEAR *
    emissionFactors.electricityKgPerKwh *
    renewableMultiplier;

  const shopping = onlineOrdersPerMonth * MONTHS_PER_YEAR * emissionFactors.deliveryKgPerOrder;

  const total = transport + food + homeEnergy + shopping;

  return {
    totalKgPerYear: roundToSingleDecimal(total),
    breakdown: {
      transport: roundToSingleDecimal(transport),
      food: roundToSingleDecimal(food),
      homeEnergy: roundToSingleDecimal(homeEnergy),
      shopping: roundToSingleDecimal(shopping),
    },
  };
}
