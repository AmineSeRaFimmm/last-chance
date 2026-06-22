import type { MacroResult, UserInput } from "./types";

export function buildWarnings(
  input: UserInput,
  daily: MacroResult,
  dailyDeficitKcal: number
): string[] {
  const warnings: string[] = [];

  if (input.sex === "male" && daily.calories < 1500) {
    warnings.push(
      "Calories are very low for most men. Consider reducing the deficit or increasing activity instead."
    );
  }

  if (input.sex === "female" && daily.calories < 1200) {
    warnings.push(
      "Calories are very low. This may affect menstrual cycle, sleep, recovery, and adherence."
    );
  }

  if (input.sex === "male" && daily.carbsG < 80) {
    warnings.push(
      "Carbohydrates are very low and may reduce training performance."
    );
  }

  if (input.sex === "female" && daily.carbsG < 100) {
    warnings.push(
      "Carbohydrates are low. Monitor fatigue, cravings, sleep, and training performance."
    );
  }

  if (input.goalRatePctPerWeek > 0.01) {
    warnings.push(
      "The selected weekly loss rate is aggressive. A slower rate usually preserves lean mass better."
    );
  }

  if (dailyDeficitKcal > 800) {
    warnings.push(
      "Daily deficit is large. Monitor hunger, sleep, strength, and mood."
    );
  }

  return warnings;
}

export function buildCarbCycleWarnings(
  input: UserInput,
  highDay: MacroResult,
  mediumDay: MacroResult,
  lowDay: MacroResult,
  lowCalories: number
): string[] {
  const warnings: string[] = [];

  if (lowCalories < 1500) {
    warnings.push(
      "Low-carb day calories are very low. Reduce the target loss rate or lower high-carb day calories."
    );
  }

  if (lowDay.carbsG < 50) {
    warnings.push(
      "Low-carb day carbohydrates are extremely low. Avoid long-term use without professional supervision."
    );
  }

  if (highDay.fatG > mediumDay.fatG && highDay.carbsG > mediumDay.carbsG) {
    warnings.push(
      "High-carb days should not become high-carb plus high-fat cheat days."
    );
  }

  if (input.trainingDaysPerWeek < 2) {
    warnings.push(
      "Carb cycling works best when paired with structured resistance training."
    );
  }

  return warnings;
}
