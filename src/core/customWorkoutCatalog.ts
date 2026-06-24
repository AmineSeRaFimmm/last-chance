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
const exerciseCache = new Map<string, CustomCatalogExercise[]>();
const pendingRequests = new Map<string, Promise<CustomCatalogExercise[]>>();

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

export function getCachedCustomExercisesByMuscle(muscle: string): CustomCatalogExercise[] | null {
  return exerciseCache.get(muscle) ?? null;
}

export async function fetchCustomExercisesByMuscle(muscle: string): Promise<CustomCatalogExercise[]> {
  const cached = exerciseCache.get(muscle);
  if (cached) return cached;

  const pending = pendingRequests.get(muscle);
  if (pending) return pending;

  const request = fetch(`${EXERCISE_DB_BASE_URL}/api/en/muscles/${muscle}.json`)
    .then(async (response) => {
      if (!response.ok) throw new Error(`Failed to load ${muscle} exercises`);
      const data = await response.json() as { exercises?: CustomCatalogExercise[] };
      const exercises = Array.isArray(data.exercises) ? data.exercises : [];
      exerciseCache.set(muscle, exercises);
      return exercises;
    })
    .catch((error) => {
      exerciseCache.set(muscle, []);
      throw error;
    })
    .finally(() => {
      pendingRequests.delete(muscle);
    });

  pendingRequests.set(muscle, request);
  return request;
}
