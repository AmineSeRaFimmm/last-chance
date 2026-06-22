import type { StandardPlanResult, UserInput } from "./types";
import {
  buildMacroResult,
  calculateCutCalories,
  calculateRMR,
  calculateTDEE
} from "./formulas";
import { sanitizeUserInput } from "./validators";
import { buildWarnings } from "./warnings";

export function buildStandardPlan(input: UserInput): StandardPlanResult {
  const safeInput = sanitizeUserInput(input);
  const referenceWeight = safeInput.targetWeightKg || safeInput.weightKg;

  const rmr = calculateRMR(
    safeInput.sex,
    safeInput.weightKg,
    safeInput.heightCm,
    safeInput.age
  );

  const tdee = calculateTDEE(rmr, safeInput.activityFactor);

  const cut = calculateCutCalories(
    safeInput.weightKg,
    tdee,
    safeInput.goalRatePctPerWeek
  );

  const calories = cut.avgCutCalories;
  const proteinG = safeInput.proteinFactor * referenceWeight;

  const fatG =
    safeInput.sex === "male"
      ? Math.max(0.7 * referenceWeight, (0.2 * calories) / 9)
      : Math.max(0.8 * referenceWeight, (0.25 * calories) / 9);

  const daily = buildMacroResult(calories, proteinG, fatG);
  const warnings = buildWarnings(safeInput, daily, cut.dailyDeficitKcal);

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
