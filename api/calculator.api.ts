import { axiosInstance } from "./axiosInstance";
import type { FootprintBreakdown } from "@/src/types";

export interface CalculatorSubmitAnswers {
  carKmPerWeek: number;
  publicTransportFrequency: "daily" | "few_times_week" | "rarely" | "never";
  dietType: "vegan" | "vegetarian" | "non_vegetarian";
  meatFrequency: "daily" | "few_times_week" | "rarely" | "never";
  acUsageHours: number;
  electricityRange: "low" | "medium" | "high" | "very_high";
  onlinePurchasesPerMonth: number;
  flightsPerYear: number;
}

export interface SubmitResponse {
  success: boolean;
  footprint: { totalCo2: number; breakdown: FootprintBreakdown; loggedAt: string };
  logId: string;
}

export async function submitCalculator(answers: CalculatorSubmitAnswers): Promise<SubmitResponse> {
  const { data } = await axiosInstance.post<SubmitResponse>("/calculator/submit", answers);
  return data;
}

export async function getCalculatorHistory(): Promise<{ logs: Array<{ _id: string; totalCo2: number; breakdown: FootprintBreakdown; loggedAt: string }> }> {
  const { data } = await axiosInstance.get("/calculator/history");
  return data;
}

export async function getLatestFootprint(): Promise<{
  log: { _id: string; totalCo2: number; breakdown: FootprintBreakdown; loggedAt: string } | null;
}> {
  const { data } = await axiosInstance.get("/calculator/latest");
  return data;
}
