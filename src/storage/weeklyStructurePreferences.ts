export type TrainingFocusKey =
  | "heavyLegs"
  | "backDeadlift"
  | "upperBody"
  | "push"
  | "pull"
  | "fullBody"
  | "strength"
  | "accessoryCardio"
  | "lightCardio"
  | "walkRecovery"
  | "rest";

export type FocusByDay = Record<string, TrainingFocusKey>;

const ROTATION_KEY = "last_chance_carb_rotation_offset";
const FOCUS_KEY = "last_chance_training_focus_by_day";

export function loadCarbRotationOffset(): number {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(ROTATION_KEY) ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export function saveCarbRotationOffset(offset: number): void {
  window.localStorage.setItem(ROTATION_KEY, String(offset));
}

export function loadTrainingFocusByDay(): FocusByDay {
  if (typeof window === "undefined") return {};

  try {
    const value = JSON.parse(window.localStorage.getItem(FOCUS_KEY) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function saveTrainingFocusByDay(value: FocusByDay): void {
  window.localStorage.setItem(FOCUS_KEY, JSON.stringify(value));
}
