import { axiosInstance } from "./axiosInstance";
import type { FootprintBreakdown } from "@/src/types";
import type { CalculatorAnswers } from "@/constants/emissionFactors";

export type CalculatorSubmitAnswers = CalculatorAnswers;

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
