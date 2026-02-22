import type { ICalculatorAnswers } from "../constants/emissionFactors.js";
import { calculateFootprint as calc } from "../constants/emissionFactors.js";

export function calculateFootprint(answers: ICalculatorAnswers) {
  const result = calc(answers);
  return {
    totalCo2: result.totalCo2,
    breakdown: result.breakdown,
    gridFactorUsed: result.gridFactorUsed,
    comparedToIndiaAvg: result.comparedToIndiaAvg,
  };
}
