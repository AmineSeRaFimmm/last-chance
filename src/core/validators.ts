import { DEFAULT_INPUTS } from "./constants";
import type { UserInput } from "./types";

export function sanitizeUserInput(input: UserInput): UserInput {
  const sex = input.sex === "female" ? "female" : "male";
  const defaultGoalRate = DEFAULT_INPUTS[sex].goalRatePctPerWeek;
  const defaultProtein = DEFAULT_INPUTS[sex].proteinFactor;
  const targetWeightKg = sanitizeOptionalNumber(input.targetWeightKg, 35, 250);

  return {
    sex,
    planType: sex === "female" ? "standard" : input.planType === "carbCycling" ? "carbCycling" : "standard",
    age: sanitizeNumber(input.age, 18, 80, 30),
    heightCm: sanitizeNumber(input.heightCm, 130, 230, 175),
    weightKg: sanitizeNumber(input.weightKg, 35, 250, 80),
    targetWeightKg,
    activityFactor: sanitizeNumber(input.activityFactor, 1.2, 1.8, 1.5),
    trainingDaysPerWeek: Math.round(sanitizeNumber(input.trainingDaysPerWeek, 0, 6, 4)),
    goalRatePctPerWeek: sanitizeNumber(input.goalRatePctPerWeek, 0.002, 0.012, defaultGoalRate),
    proteinFactor: sanitizeNumber(input.proteinFactor, 1.4, 2.4, defaultProtein)
  };
}

function sanitizeNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function sanitizeOptionalNumber(value: number | undefined, min: number, max: number): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.min(max, Math.max(min, value));
}
