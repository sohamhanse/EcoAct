/**
 * EcoTrack India Emission Factors (Server)
 * Sources: CEA v18, ICCT India, FAO/FOLU, BEE
 */

export type IndianState =
  | "maharashtra" | "delhi" | "karnataka" | "tamil_nadu" | "gujarat"
  | "rajasthan" | "uttar_pradesh" | "west_bengal" | "telangana" | "andhra_pradesh"
  | "madhya_pradesh" | "kerala" | "punjab" | "haryana" | "bihar"
  | "odisha" | "jharkhand" | "chhattisgarh" | "assam" | "goa" | "other";

export const GRID_EMISSION_FACTORS: Record<IndianState, number> = {
  chhattisgarh: 1.12, jharkhand: 1.08, odisha: 1.05, uttar_pradesh: 1.02,
  bihar: 0.98, madhya_pradesh: 0.96, rajasthan: 0.91, west_bengal: 0.89,
  haryana: 0.88, delhi: 0.82, gujarat: 0.79, maharashtra: 0.76,
  telangana: 0.74, andhra_pradesh: 0.71, assam: 0.68, punjab: 0.65,
  tamil_nadu: 0.61, karnataka: 0.58, kerala: 0.42, goa: 0.55, other: 0.82,
};

export const INDIA_NATIONAL_AVERAGE_GRID = 0.82;

export const TRANSPORT_EMISSION_FACTORS = {
  petrol_car_small: 0.148, petrol_car_mid: 0.192, petrol_car_suv: 0.261,
  diesel_car: 0.171, cng_car: 0.098, electric_car: 0.065,
  two_wheeler_petrol: 0.063, two_wheeler_electric: 0.022,
  metro_delhi: 0.031, metro_bangalore: 0.038, metro_mumbai: 0.041,
  metro_hyderabad: 0.044, metro_chennai: 0.039,
  city_bus_diesel: 0.089, city_bus_electric: 0.031,
  auto_cng: 0.072, auto_petrol: 0.094, e_rickshaw: 0.028,
  indian_railways: 0.014, domestic_flight: 0.255, default_car: 0.192,
};

export type VehicleType =
  | "petrol_car" | "diesel_car" | "cng_car" | "electric_car"
  | "two_wheeler" | "e_scooter" | "none";

export type CityType = "delhi" | "mumbai" | "bangalore" | "hyderabad" | "chennai" | "other";

export type PublicTransportMode =
  | "metro" | "bus_diesel" | "bus_electric" | "auto_cng" | "auto_petrol"
  | "erickshaw" | "train" | "none";

export type DietTypeIndia =
  | "vegan_local" | "vegetarian_dairy" | "eggetarian"
  | "non_veg_low" | "non_veg_moderate" | "non_veg_high";

export type AcTonnage = "1_ton" | "1.5_ton" | "2_ton";

export type ElectricityRange = "low" | "medium" | "high" | "very_high";

export interface ICalculatorAnswers {
  vehicleType: VehicleType;
  engineSize?: "small" | "mid" | "suv";
  carKmPerWeek: number;
  twoWheelerKmPerWeek: number;
  publicTransportMode: PublicTransportMode;
  publicTransportKmPerWeek: number;
  flightsPerYear: number;
  city: CityType;
  state: IndianState;
  dietType: DietTypeIndia;
  acHoursPerDay: number;
  acTonnage: AcTonnage;
  electricityRange: ElectricityRange;
  onlinePurchasesPerMonth: number;
}

export function getCarEmissionFactor(
  vehicleType: VehicleType,
  engineSize?: "small" | "mid" | "suv"
): number {
  switch (vehicleType) {
    case "petrol_car":
      return engineSize === "small" ? 0.148 : engineSize === "suv" ? 0.261 : 0.192;
    case "diesel_car": return TRANSPORT_EMISSION_FACTORS.diesel_car;
    case "cng_car": return TRANSPORT_EMISSION_FACTORS.cng_car;
    case "electric_car": return TRANSPORT_EMISSION_FACTORS.electric_car;
    case "two_wheeler": return TRANSPORT_EMISSION_FACTORS.two_wheeler_petrol;
    case "e_scooter": return TRANSPORT_EMISSION_FACTORS.two_wheeler_electric;
    case "none": return 0;
    default: return TRANSPORT_EMISSION_FACTORS.default_car;
  }
}

export function getMetroFactor(city: CityType): number {
  const factors: Record<CityType, number> = {
    delhi: 0.031, bangalore: 0.038, mumbai: 0.041,
    hyderabad: 0.044, chennai: 0.039, other: 0.04,
  };
  return factors[city];
}

export const FOOD_EMISSION_FACTORS = {
  DIET_ANNUAL: {
    vegan_local: 800, vegetarian_dairy: 1400, eggetarian: 1650,
    non_veg_low: 1900, non_veg_moderate: 2400, non_veg_high: 3200,
  },
};

export const APPLIANCE_FACTORS = {
  ac_1_ton_per_hour: 1.1, ac_15_ton_per_hour: 1.4, ac_2_ton_per_hour: 1.8,
  ac_default_per_hour: 1.4,
  ELECTRICITY_ANNUAL_KWH: { low: 900, medium: 1800, high: 3600, very_high: 6000 },
};

export interface FootprintResult {
  totalCo2: number;
  breakdown: { transport: number; food: number; energy: number; shopping: number };
  gridFactorUsed: number;
  comparedToIndiaAvg: number;
}

export function calculateFootprint(answers: ICalculatorAnswers): FootprintResult {
  const carFactor = getCarEmissionFactor(answers.vehicleType, answers.engineSize);
  const carAnnual = answers.carKmPerWeek * 52 * carFactor;
  const twoWheelerAnnual =
    answers.twoWheelerKmPerWeek * 52 * TRANSPORT_EMISSION_FACTORS.two_wheeler_petrol;

  const ptFactors: Record<PublicTransportMode, number> = {
    metro: getMetroFactor(answers.city),
    bus_diesel: TRANSPORT_EMISSION_FACTORS.city_bus_diesel,
    bus_electric: TRANSPORT_EMISSION_FACTORS.city_bus_electric,
    auto_cng: TRANSPORT_EMISSION_FACTORS.auto_cng,
    auto_petrol: TRANSPORT_EMISSION_FACTORS.auto_petrol,
    erickshaw: TRANSPORT_EMISSION_FACTORS.e_rickshaw,
    train: TRANSPORT_EMISSION_FACTORS.indian_railways,
    none: 0,
  };
  const publicTransportAnnual =
    answers.publicTransportKmPerWeek * 52 * ptFactors[answers.publicTransportMode];
  const flightAnnual =
    answers.flightsPerYear * 1500 * TRANSPORT_EMISSION_FACTORS.domestic_flight;
  const transport = carAnnual + twoWheelerAnnual + publicTransportAnnual + flightAnnual;

  const food = FOOD_EMISSION_FACTORS.DIET_ANNUAL[answers.dietType];

  const gridFactor =
    GRID_EMISSION_FACTORS[answers.state] ?? INDIA_NATIONAL_AVERAGE_GRID;
  const acFactors: Record<AcTonnage, number> = {
    "1_ton": APPLIANCE_FACTORS.ac_1_ton_per_hour,
    "1.5_ton": APPLIANCE_FACTORS.ac_15_ton_per_hour,
    "2_ton": APPLIANCE_FACTORS.ac_2_ton_per_hour,
  };
  const acKwhPerYear =
    answers.acHoursPerDay *
    365 *
    (acFactors[answers.acTonnage] ?? APPLIANCE_FACTORS.ac_default_per_hour);
  const baseElectricityKwh =
    APPLIANCE_FACTORS.ELECTRICITY_ANNUAL_KWH[answers.electricityRange];
  const energy = (baseElectricityKwh + acKwhPerYear) * gridFactor;

  const shopping = answers.onlinePurchasesPerMonth * 12 * 6.5;
  const total = transport + food + energy + shopping;
  const INDIA_AVERAGE_FOOTPRINT = 1700;

  return {
    totalCo2: Math.round(total),
    breakdown: {
      transport: Math.round(transport),
      food: Math.round(food),
      energy: Math.round(energy),
      shopping: Math.round(shopping),
    },
    gridFactorUsed: gridFactor,
    comparedToIndiaAvg: Math.round(
      ((total - INDIA_AVERAGE_FOOTPRINT) / INDIA_AVERAGE_FOOTPRINT) * 100
    ),
  };
}
