export const CARBON_PRICE_INR_PER_KG = 1.5;

export interface OffsetProvider {
  id: string;
  name: string;
  standard: string;
  pricePerKgInr: number;
  projectTypes: string[];
  description: string;
  indiaFocused: boolean;
  url: string;
  logoPlaceholder: string;
  verificationBadge: string;
}

export const OFFSET_PROVIDERS: OffsetProvider[] = [
  {
    id: "gold_standard",
    name: "Gold Standard",
    standard: "Gold Standard",
    pricePerKgInr: 1.8,
    projectTypes: ["reforestation", "solar", "clean_water"],
    description: "The world's most rigorous carbon offset standard, supporting UN SDGs.",
    indiaFocused: false,
    url: "https://www.goldstandard.org/impact-quantification/get-certified-0",
    logoPlaceholder: "star",
    verificationBadge: "Gold Standard Certified",
  },
  {
    id: "verra",
    name: "Verra (VCS)",
    standard: "Verra VCS",
    pricePerKgInr: 1.2,
    projectTypes: ["reforestation", "agriculture", "methane_capture"],
    description: "Verified Carbon Standard — the world's largest voluntary carbon program.",
    indiaFocused: false,
    url: "https://verra.org/programs/verified-carbon-standard/",
    logoPlaceholder: "shield-checkmark",
    verificationBadge: "Verra VCS Certified",
  },
  {
    id: "climate_partner",
    name: "ClimatePartner India",
    standard: "Gold Standard",
    pricePerKgInr: 1.6,
    projectTypes: ["solar", "biogas", "cookstoves"],
    description: "India-focused offset projects including biogas and improved cookstoves.",
    indiaFocused: true,
    url: "https://www.climatepartner.com",
    logoPlaceholder: "leaf",
    verificationBadge: "India Climate Action",
  },
  {
    id: "sankalptaru",
    name: "Sankalptaru",
    standard: "Plan Vivo",
    pricePerKgInr: 0.9,
    projectTypes: ["reforestation"],
    description: "Plant trees across India — track your tree's growth with GPS coordinates.",
    indiaFocused: true,
    url: "https://sankalptaru.org",
    logoPlaceholder: "tree",
    verificationBadge: "India Reforestation",
  },
];

export function calculateOffsetCost(co2Kg: number): {
  minCostInr: number;
  maxCostInr: number;
  avgCostInr: number;
  treesEquivalent: number;
  yearsToNeutral: number;
} {
  const prices = OFFSET_PROVIDERS.map((p) => p.pricePerKgInr);
  return {
    minCostInr: Math.round(co2Kg * Math.min(...prices)),
    maxCostInr: Math.round(co2Kg * Math.max(...prices)),
    avgCostInr: Math.round(co2Kg * CARBON_PRICE_INR_PER_KG),
    treesEquivalent: Math.round(co2Kg / 21),
    yearsToNeutral: parseFloat((co2Kg / 1700).toFixed(1)),
  };
}
