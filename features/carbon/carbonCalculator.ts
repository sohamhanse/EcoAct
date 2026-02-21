import { emissionFactors } from "./emissionFactors";

type CarbonInput = {
  weeklyCarKm: number;
  meatDaysPerWeek: number;
  electricityKwhPerMonth: number;
  onlineOrdersPerMonth: number;
};

export function calculateAnnualCarbon(input: CarbonInput) {
  const car =
    input.weeklyCarKm * 52 * emissionFactors.carPerKm;

  const food =
    (input.meatDaysPerWeek * emissionFactors.meatPerDay +
      (7 - input.meatDaysPerWeek) * emissionFactors.vegPerDay) * 52;

  const electricity =
    input.electricityKwhPerMonth * 12 * emissionFactors.electricityPerKwh;

  const shopping =
    input.onlineOrdersPerMonth * 12 * emissionFactors.onlineOrder;

  const total = car + food + electricity + shopping;

  return {
    total: Math.round(total),
    breakdown: {
      car: Math.round(car),
      food: Math.round(food),
      electricity: Math.round(electricity),
      shopping: Math.round(shopping),
    },
  };
}