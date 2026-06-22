import type { StandardPlanResult, UserInput } from "./types";
import {
  buildMacroResult,
  calculateCutCalories,
  calculateRMR,
  calculateTDEE
} from "./formulas";
import { buildWarnings } from "./warnings";

export function buildStandardPlan(input: UserInput): StandardPlanResult {
  const referenceWeight = input.targetWeightKg || input.weightKg;

  const rmr = calculateRMR(
    input.sex,
    input.weightKg,
    input.heightCm,
    input.age
  );

  const tdee = calculateTDEE(rmr, input.activityFactor);

  const cut = calculateCutCalories(
    input.weightKg,
    tdee,
    input.goalRatePctPerWeek
  );

  const calories = cut.avgCutCalories;
  const proteinG = input.proteinFactor * referenceWeight;

  const fatG =
    input.sex === "male"
      ? Math.max(0.7 * referenceWeight, (0.2 * calories) / 9)
      : Math.max(0.8 * referenceWeight, (0.25 * calories) / 9);

  const daily = buildMacroResult(calories, proteinG, fatG);
  const warnings = buildWarnings(input, daily, cut.dailyDeficitKcal);

  return {
    kind: "standard",
    rmr: Math.round(rmr),
    tdee: Math.round(tdee),
    dailyDeficitKcal: Math.round(cut.dailyDeficitKcal),
    weeklyLossKg: Number(cut.weeklyLossKg.toFixed(2)),
    daily,
    warnings
  };
}
