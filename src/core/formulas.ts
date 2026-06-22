import { KCAL_PER_KG_FAT } from "./constants";
import type { MacroResult, Sex } from "./types";

export function round(value: number): number {
  return Math.round(value);
}

export function calculateRMR(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(rmr: number, activityFactor: number): number {
  return rmr * activityFactor;
}

export function calculateCutCalories(
  weightKg: number,
  tdee: number,
  goalRatePctPerWeek: number
) {
  const weeklyLossKg = weightKg * goalRatePctPerWeek;
  const weeklyDeficitKcal = weeklyLossKg * KCAL_PER_KG_FAT;
  const dailyDeficitKcal = weeklyDeficitKcal / 7;
  const avgCutCalories = tdee - dailyDeficitKcal;

  return {
    weeklyLossKg,
    weeklyDeficitKcal,
    dailyDeficitKcal,
    avgCutCalories
  };
}

export function calculateCarbsG(
  calories: number,
  proteinG: number,
  fatG: number
): number {
  return (calories - proteinG * 4 - fatG * 9) / 4;
}

export function buildMacroResult(
  calories: number,
  proteinG: number,
  fatG: number
): MacroResult {
  const carbsG = calculateCarbsG(calories, proteinG, fatG);

  return {
    calories: round(calories),
    proteinG: round(proteinG),
    fatG: round(fatG),
    carbsG: round(carbsG)
  };
}
