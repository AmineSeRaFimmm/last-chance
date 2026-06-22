import { normalizeWeightLog, type WeightLogEntry } from "../core/progress";

const WEIGHT_LOG_KEY = "last_chance_weight_log";

export function loadWeightLog(): WeightLogEntry[] {
  const raw = window.localStorage.getItem(WEIGHT_LOG_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as WeightLogEntry[];
    return normalizeWeightLog(Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

export function saveWeightLog(entries: WeightLogEntry[]): WeightLogEntry[] {
  const normalized = normalizeWeightLog(entries);
  window.localStorage.setItem(WEIGHT_LOG_KEY, JSON.stringify(normalized));
  return normalized;
}

export function upsertWeightLogEntry(
  entries: WeightLogEntry[],
  nextEntry: WeightLogEntry
): WeightLogEntry[] {
  const filtered = entries.filter((entry) => entry.date !== nextEntry.date);
  return saveWeightLog([...filtered, nextEntry]);
}

export function deleteWeightLogEntry(entries: WeightLogEntry[], date: string): WeightLogEntry[] {
  return saveWeightLog(entries.filter((entry) => entry.date !== date));
}

export function clearWeightLog(): WeightLogEntry[] {
  window.localStorage.removeItem(WEIGHT_LOG_KEY);
  return [];
}
