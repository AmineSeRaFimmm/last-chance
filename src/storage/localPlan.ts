import type { UserInput } from "../core/types";

const STORAGE_KEY = "last_chance_last_input";

export function saveInput(input: UserInput): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
}

export function loadInput(): UserInput | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UserInput;
  } catch {
    return null;
  }
}

export function clearInput(): void {
  localStorage.removeItem(STORAGE_KEY);
}
