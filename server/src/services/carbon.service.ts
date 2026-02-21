import type { IFootprintAnswers, IFootprintBreakdown } from "../models/FootprintLog.model.js";

const EMISSION_FACTORS = {
  CAR_KM: 0.21,
  PUBLIC_TRANSPORT: { daily: 52, few_times_week: 150, rarely: 30, never: 0 },
  DIET: { vegan: 1000, vegetarian: 1500, non_vegetarian: 2500 },
  MEAT_FREQUENCY_MULTIPLIER: { daily: 1.4, few_times_week: 1.2, rarely: 1.0, never: 0.8 },
  ELECTRICITY_KWH: 0.82,
  AC_USAGE: 1.5,
  ELECTRICITY_RANGE: { low: 1200, medium: 2400, high: 4800, very_high: 7200 },
  ONLINE_PURCHASE: 6.5,
  FLIGHT_PER_TRIP: 250,
};

export function calculateFootprint(answers: IFootprintAnswers): { totalCo2: number; breakdown: IFootprintBreakdown } {
  const transport =
    answers.carKmPerWeek * 52 * EMISSION_FACTORS.CAR_KM +
    EMISSION_FACTORS.PUBLIC_TRANSPORT[answers.publicTransportFrequency];

  const food =
    EMISSION_FACTORS.DIET[answers.dietType] *
    EMISSION_FACTORS.MEAT_FREQUENCY_MULTIPLIER[answers.meatFrequency];

  const energy =
    EMISSION_FACTORS.ELECTRICITY_RANGE[answers.electricityRange] * EMISSION_FACTORS.ELECTRICITY_KWH +
    answers.acUsageHours * 365 * EMISSION_FACTORS.AC_USAGE;

  const shopping = answers.onlinePurchasesPerMonth * 12 * EMISSION_FACTORS.ONLINE_PURCHASE;

  const transportCo2 = Math.round(transport);
  const foodCo2 = Math.round(food);
  const energyCo2 = Math.round(energy);
  const shoppingCo2 = Math.round(shopping);
  const flightsCo2 = Math.round(answers.flightsPerYear * EMISSION_FACTORS.FLIGHT_PER_TRIP);
  const totalTransport = transportCo2 + flightsCo2;

  return {
    totalCo2: Math.round(transport + food + energy + shopping + answers.flightsPerYear * EMISSION_FACTORS.FLIGHT_PER_TRIP),
    breakdown: {
      transport: totalTransport,
      food: foodCo2,
      energy: energyCo2,
      shopping: shoppingCo2,
    },
  };
}
