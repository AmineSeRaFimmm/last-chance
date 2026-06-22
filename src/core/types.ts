export type Sex = "male" | "female";

export type PlanType = "standard" | "carbCycling";

export interface UserInput {
  sex: Sex;
  planType: PlanType;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  expectedTimelineWeeks?: number;
  activityFactor: number;
  trainingDaysPerWeek: number;
  goalRatePctPerWeek: number;
  proteinFactor: number;
}

export interface MacroResult {
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
}

export interface StandardPlanResult {
  kind: "standard";
  rmr: number;
  tdee: number;
  dailyDeficitKcal: number;
  weeklyLossKg: number;
  daily: MacroResult;
  warnings: string[];
}

export interface CarbCyclingPlanResult {
  kind: "carbCycling";
  rmr: number;
  tdee: number;
  dailyDeficitKcal: number;
  weeklyLossKg: number;
  weeklyCalories: number;
  dayCounts: {
    high: number;
    medium: number;
    low: number;
  };
  highDay: MacroResult;
  mediumDay: MacroResult;
  lowDay: MacroResult;
  weeklySchedule: {
    day: string;
    type: "High" | "Medium" | "Low";
    note: string;
  }[];
  warnings: string[];
}

export type PlanResult = StandardPlanResult | CarbCyclingPlanResult;
