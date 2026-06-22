import { KCAL_PER_KG_FAT } from "./constants";

export interface WeightLogEntry {
  date: string;
  weightKg: number;
  calories?: number;
}

export type ProgressStatus = "insufficient" | "onTrack" | "slow" | "fast" | "gain";

export interface ProgressSummary {
  entryCount: number;
  latestAverageKg?: number;
  earliestDate?: string;
  latestDate?: string;
  days?: number;
  weightChangeKg?: number;
  actualLossPerWeekKg?: number;
  actualTdee?: number;
  status: ProgressStatus;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function normalizeWeightLog(entries: WeightLogEntry[]): WeightLogEntry[] {
  return entries
    .filter((entry) => entry.date && Number.isFinite(entry.weightKg) && entry.weightKg > 0)
    .map((entry) => ({
      date: entry.date,
      weightKg: Number(entry.weightKg),
      calories:
        entry.calories !== undefined && Number.isFinite(entry.calories) && entry.calories > 0
          ? Number(entry.calories)
          : undefined
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getLatestAverageWeight(entries: WeightLogEntry[], count = 7): number | undefined {
  const normalized = normalizeWeightLog(entries);
  const latest = normalized.slice(-count);

  if (latest.length === 0) return undefined;

  const total = latest.reduce((sum, entry) => sum + entry.weightKg, 0);
  return total / latest.length;
}

export function calculateProgressSummary(
  entries: WeightLogEntry[],
  plannedDailyCalories: number,
  expectedWeeklyLossKg: number
): ProgressSummary {
  const normalized = normalizeWeightLog(entries);
  const latestAverageKg = getLatestAverageWeight(normalized);

  if (normalized.length < 2) {
    return {
      entryCount: normalized.length,
      latestAverageKg,
      status: "insufficient"
    };
  }

  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  const days = Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / MS_PER_DAY);

  if (days < 7) {
    return {
      entryCount: normalized.length,
      latestAverageKg,
      earliestDate: first.date,
      latestDate: last.date,
      days,
      weightChangeKg: last.weightKg - first.weightKg,
      status: "insufficient"
    };
  }

  const weightChangeKg = last.weightKg - first.weightKg;
  const actualLossPerWeekKg = (-weightChangeKg / days) * 7;
  const averageCalories = getAverageLoggedCalories(normalized) ?? plannedDailyCalories;
  const actualTdee = averageCalories - (weightChangeKg * KCAL_PER_KG_FAT) / days;
  const status = classifyProgress(actualLossPerWeekKg, expectedWeeklyLossKg);

  return {
    entryCount: normalized.length,
    latestAverageKg,
    earliestDate: first.date,
    latestDate: last.date,
    days,
    weightChangeKg,
    actualLossPerWeekKg,
    actualTdee,
    status
  };
}

function getAverageLoggedCalories(entries: WeightLogEntry[]): number | undefined {
  const logged = entries.filter((entry) => entry.calories !== undefined) as Array<
    WeightLogEntry & { calories: number }
  >;

  if (logged.length === 0) return undefined;

  return logged.reduce((sum, entry) => sum + entry.calories, 0) / logged.length;
}

function classifyProgress(
  actualLossPerWeekKg: number,
  expectedWeeklyLossKg: number
): ProgressStatus {
  if (actualLossPerWeekKg < -0.1) return "gain";
  if (expectedWeeklyLossKg <= 0) return "insufficient";

  const ratio = actualLossPerWeekKg / expectedWeeklyLossKg;

  if (ratio < 0.5) return "slow";
  if (ratio > 1.35) return "fast";
  return "onTrack";
}
