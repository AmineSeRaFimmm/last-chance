import type { CarbCyclingPlanResult, UserInput } from "./types";
import {
  buildMacroResult,
  calculateCutCalories,
  calculateRMR,
  calculateTDEE
} from "./formulas";
import { buildCarbCycleWarnings } from "./warnings";

function getCarbCycleDayCounts(trainingDays: number) {
  if (trainingDays <= 2) return { high: 1, medium: 1, low: 5 };
  if (trainingDays === 3) return { high: 1, medium: 2, low: 4 };
  if (trainingDays === 4) return { high: 2, medium: 2, low: 3 };
  if (trainingDays === 5) return { high: 2, medium: 3, low: 2 };
  return { high: 2, medium: 4, low: 1 };
}

function buildWeeklySchedule(trainingDays: number) {
  if (trainingDays <= 2) {
    return [
      { day: "Mon", type: "High" as const, note: "Hardest strength session" },
      { day: "Tue", type: "Low" as const, note: "Walk / recovery" },
      { day: "Wed", type: "Medium" as const, note: "Strength session" },
      { day: "Thu", type: "Low" as const, note: "Rest" },
      { day: "Fri", type: "Low" as const, note: "Walk" },
      { day: "Sat", type: "Low" as const, note: "Light cardio" },
      { day: "Sun", type: "Low" as const, note: "Rest" }
    ];
  }

  if (trainingDays === 3) {
    return [
      { day: "Mon", type: "High" as const, note: "Heavy legs / full body" },
      { day: "Tue", type: "Low" as const, note: "Walk / recovery" },
      { day: "Wed", type: "Medium" as const, note: "Upper body" },
      { day: "Thu", type: "Low" as const, note: "Rest" },
      { day: "Fri", type: "Medium" as const, note: "Strength session" },
      { day: "Sat", type: "Low" as const, note: "Light cardio" },
      { day: "Sun", type: "Low" as const, note: "Rest" }
    ];
  }

  if (trainingDays === 4) {
    return [
      { day: "Mon", type: "High" as const, note: "Heavy legs" },
      { day: "Tue", type: "Medium" as const, note: "Upper body" },
      { day: "Wed", type: "Low" as const, note: "Walk / recovery" },
      { day: "Thu", type: "High" as const, note: "Back / deadlift" },
      { day: "Fri", type: "Medium" as const, note: "Upper body" },
      { day: "Sat", type: "Low" as const, note: "Light cardio" },
      { day: "Sun", type: "Low" as const, note: "Rest" }
    ];
  }

  if (trainingDays === 5) {
    return [
      { day: "Mon", type: "High" as const, note: "Heavy legs" },
      { day: "Tue", type: "Medium" as const, note: "Upper body" },
      { day: "Wed", type: "Medium" as const, note: "Strength session" },
      { day: "Thu", type: "High" as const, note: "Back / deadlift" },
      { day: "Fri", type: "Medium" as const, note: "Upper body" },
      { day: "Sat", type: "Low" as const, note: "Light cardio" },
      { day: "Sun", type: "Low" as const, note: "Rest" }
    ];
  }

  return [
    { day: "Mon", type: "High" as const, note: "Heavy legs" },
    { day: "Tue", type: "Medium" as const, note: "Upper body" },
    { day: "Wed", type: "Medium" as const, note: "Strength session" },
    { day: "Thu", type: "High" as const, note: "Back / deadlift" },
    { day: "Fri", type: "Medium" as const, note: "Upper body" },
    { day: "Sat", type: "Medium" as const, note: "Accessory / cardio" },
    { day: "Sun", type: "Low" as const, note: "Rest" }
  ];
}

export function buildCarbCyclingPlan(input: UserInput): CarbCyclingPlanResult {
  const referenceWeight = input.targetWeightKg || input.weightKg;

  const rmr = calculateRMR("male", input.weightKg, input.heightCm, input.age);
  const tdee = calculateTDEE(rmr, input.activityFactor);

  const cut = calculateCutCalories(
    input.weightKg,
    tdee,
    input.goalRatePctPerWeek
  );

  const avgCalories = cut.avgCutCalories;
  const weeklyCalories = avgCalories * 7;
  const dayCounts = getCarbCycleDayCounts(input.trainingDaysPerWeek);

  let highCalories = tdee * 0.98;
  const mediumCalories = avgCalories;

  let lowCalories =
    (weeklyCalories -
      dayCounts.high * highCalories -
      dayCounts.medium * mediumCalories) /
    dayCounts.low;

  if (lowCalories < 1500) {
    highCalories = tdee * 0.95;
    lowCalories =
      (weeklyCalories -
        dayCounts.high * highCalories -
        dayCounts.medium * mediumCalories) /
      dayCounts.low;
  }

  const proteinG = 2.0 * referenceWeight;

  let highFatG = 0.55 * referenceWeight;
  let mediumFatG = 0.7 * referenceWeight;
  let lowFatG = 0.9 * referenceWeight;

  highFatG = Math.min(highFatG, (0.35 * highCalories) / 9);
  mediumFatG = Math.min(mediumFatG, (0.35 * mediumCalories) / 9);
  lowFatG = Math.min(lowFatG, (0.35 * lowCalories) / 9);

  const highDay = buildMacroResult(highCalories, proteinG, highFatG);
  const mediumDay = buildMacroResult(mediumCalories, proteinG, mediumFatG);
  const lowDay = buildMacroResult(lowCalories, proteinG, lowFatG);

  const warnings = buildCarbCycleWarnings(
    input,
    highDay,
    mediumDay,
    lowDay,
    lowCalories
  );

  return {
    kind: "carbCycling",
    rmr: Math.round(rmr),
    tdee: Math.round(tdee),
    dailyDeficitKcal: Math.round(cut.dailyDeficitKcal),
    weeklyLossKg: Number(cut.weeklyLossKg.toFixed(2)),
    weeklyCalories: Math.round(weeklyCalories),
    dayCounts,
    highDay,
    mediumDay,
    lowDay,
    weeklySchedule: buildWeeklySchedule(input.trainingDaysPerWeek),
    warnings
  };
}
