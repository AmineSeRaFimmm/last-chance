export const KCAL_PER_KG_FAT = 7700;

export const ACTIVITY_LEVELS = [
  { label: "Sedentary", description: "Little exercise", value: 1.2 },
  { label: "Light", description: "1–2 sessions/week", value: 1.35 },
  { label: "Moderate", description: "3–4 sessions/week", value: 1.5 },
  { label: "Active", description: "5–6 sessions/week", value: 1.65 },
  { label: "Very active", description: "High training + active job", value: 1.8 }
] as const;

export const DEFAULT_INPUTS = {
  male: {
    proteinFactor: 2.0,
    goalRatePctPerWeek: 0.006
  },
  female: {
    proteinFactor: 1.8,
    goalRatePctPerWeek: 0.005
  }
} as const;
