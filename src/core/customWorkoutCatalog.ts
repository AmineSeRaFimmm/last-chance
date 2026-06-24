export interface CustomCatalogExercise {
  id: string;
  slug: string;
  name: string;
  muscle: string;
  bodyPart: string;
  equipment: string;
  category: string;
  file: string;
  gifUrl: string;
  thumbUrl?: string;
}

export interface CustomWorkoutMuscleTab {
  muscle: string;
  label: string;
}

const EXERCISE_DB_BASE_URL = "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@main";

export const CUSTOM_WORKOUT_MUSCLE_TABS: CustomWorkoutMuscleTab[] = [
  { muscle: "pectorals", label: "Chest" },
  { muscle: "lats", label: "Lats" },
  { muscle: "upper-back", label: "Upper Back" },
  { muscle: "glutes", label: "Glutes" },
  { muscle: "quads", label: "Quads" },
  { muscle: "hamstrings", label: "Hamstrings" },
  { muscle: "delts", label: "Shoulders" },
  { muscle: "triceps", label: "Triceps" },
  { muscle: "biceps", label: "Biceps" },
  { muscle: "abs", label: "Abs" },
  { muscle: "calves", label: "Calves" },
  { muscle: "forearms", label: "Forearms" },
  { muscle: "traps", label: "Traps" },
  { muscle: "spine", label: "Spine" },
  { muscle: "abductors", label: "Abductors" },
  { muscle: "adductors", label: "Adductors" },
  { muscle: "serratus-anterior", label: "Serratus" },
  { muscle: "cardio", label: "Cardio" }
];

export async function fetchCustomExercisesByMuscle(muscle: string): Promise<CustomCatalogExercise[]> {
  const response = await fetch(`${EXERCISE_DB_BASE_URL}/api/en/muscles/${muscle}.json`);
  if (!response.ok) throw new Error(`Failed to load ${muscle} exercises`);

  const data = await response.json() as { exercises?: CustomCatalogExercise[] };
  return Array.isArray(data.exercises) ? data.exercises : [];
}
