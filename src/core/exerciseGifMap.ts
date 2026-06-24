export type ExerciseGifMatchStatus = "exact" | "fallback" | "none";

export interface ExerciseGifAsset {
  sourceName: string;
  file: string;
}

export interface ExerciseGifMatch {
  status: ExerciseGifMatchStatus;
  originalName: string;
  normalizedName: string;
  asset?: ExerciseGifAsset;
  reason?: string;
}

type AssetKey =
  | "barbellBenchPress"
  | "barbellFullSquatSidePov"
  | "barbellRomanianDeadlift"
  | "dumbbellRomanianDeadlift"
  | "trapBarDeadlift"
  | "smithLegPress"
  | "splitSquats"
  | "dumbbellSingleLegSplitSquat"
  | "leverLyingLegCurl"
  | "leverSeatedLegCurl"
  | "barbellStandingCalfRaise"
  | "barbellBentOverRow"
  | "cableSeatedRow"
  | "dumbbellOneArmBentOverRow"
  | "cablePulldown"
  | "pullUp"
  | "dumbbellStandingOverheadPress"
  | "dumbbellInclineBenchPress"
  | "dumbbellLateralRaise"
  | "cableLateralRaise"
  | "dumbbellRearLateralRaise"
  | "cablePushdown"
  | "barbellCurl"
  | "leverBackExtension"
  | "leverChestPress"
  | "leverShoulderPress"
  | "pallofPressHorizontal"
  | "pushUp"
  | "dumbbellGobletSquat"
  | "weightedFrontPlank";

export const EXERCISE_GIF_ASSETS: Record<AssetKey, ExerciseGifAsset> = {
  barbellBenchPress: { sourceName: "Barbell Bench Press", file: "pectorals/barbell-bench-press.gif" },
  barbellFullSquatSidePov: { sourceName: "Barbell Full Squat Side POV", file: "glutes/barbell-full-squat-side-pov.gif" },
  barbellRomanianDeadlift: { sourceName: "Barbell Romanian Deadlift", file: "glutes/barbell-romanian-deadlift.gif" },
  dumbbellRomanianDeadlift: { sourceName: "Dumbbell Romanian Deadlift", file: "glutes/dumbbell-romanian-deadlift.gif" },
  trapBarDeadlift: { sourceName: "Trap Bar Deadlift", file: "glutes/trap-bar-deadlift.gif" },
  smithLegPress: { sourceName: "Smith Leg Press", file: "glutes/smith-leg-press.gif" },
  splitSquats: { sourceName: "Split Squats", file: "quads/split-squats.gif" },
  dumbbellSingleLegSplitSquat: { sourceName: "Dumbbell Single Leg Split Squat", file: "quads/dumbbell-single-leg-split-squat.gif" },
  leverLyingLegCurl: { sourceName: "Lever Lying Leg Curl", file: "hamstrings/lever-lying-leg-curl.gif" },
  leverSeatedLegCurl: { sourceName: "Lever Seated Leg Curl", file: "hamstrings/lever-seated-leg-curl.gif" },
  barbellStandingCalfRaise: { sourceName: "Barbell Standing Calf Raise", file: "calves/barbell-standing-calf-raise.gif" },
  barbellBentOverRow: { sourceName: "Barbell Bent Over Row", file: "upper-back/barbell-bent-over-row.gif" },
  cableSeatedRow: { sourceName: "Cable Seated Row", file: "upper-back/cable-seated-row.gif" },
  dumbbellOneArmBentOverRow: { sourceName: "Dumbbell One Arm Bent Over Row", file: "upper-back/dumbbell-one-arm-bent-over-row.gif" },
  cablePulldown: { sourceName: "Cable Pulldown", file: "lats/cable-pulldown.gif" },
  pullUp: { sourceName: "Pull-up", file: "lats/pull-up.gif" },
  dumbbellStandingOverheadPress: { sourceName: "Dumbbell Standing Overhead Press", file: "delts/dumbbell-standing-overhead-press.gif" },
  dumbbellInclineBenchPress: { sourceName: "Dumbbell Incline Bench Press", file: "pectorals/dumbbell-incline-bench-press.gif" },
  dumbbellLateralRaise: { sourceName: "Dumbbell Lateral Raise", file: "delts/dumbbell-lateral-raise.gif" },
  cableLateralRaise: { sourceName: "Cable Lateral Raise", file: "delts/cable-lateral-raise.gif" },
  dumbbellRearLateralRaise: { sourceName: "Dumbbell Rear Lateral Raise", file: "delts/dumbbell-rear-lateral-raise.gif" },
  cablePushdown: { sourceName: "Cable Pushdown", file: "triceps/cable-pushdown.gif" },
  barbellCurl: { sourceName: "Barbell Curl", file: "biceps/barbell-curl.gif" },
  leverBackExtension: { sourceName: "Lever Back Extension", file: "spine/lever-back-extension.gif" },
  leverChestPress: { sourceName: "Lever Chest Press", file: "pectorals/lever-chest-press.gif" },
  leverShoulderPress: { sourceName: "Lever Shoulder Press", file: "delts/lever-shoulder-press-v-3.gif" },
  pallofPressHorizontal: { sourceName: "Band Horizontal Pallof Press", file: "abs/band-horizontal-pallof-press.gif" },
  pushUp: { sourceName: "Push-up", file: "pectorals/push-up.gif" },
  dumbbellGobletSquat: { sourceName: "Dumbbell Goblet Squat", file: "quads/dumbbell-goblet-squat.gif" },
  weightedFrontPlank: { sourceName: "Weighted Front Plank", file: "abs/weighted-front-plank.gif" }
};

const EXACT_MATCHES: Record<string, AssetKey> = {
  "bench press": "barbellBenchPress",
  "back squat": "barbellFullSquatSidePov",
  "squat": "barbellFullSquatSidePov",
  "romanian deadlift": "barbellRomanianDeadlift",
  "dumbbell romanian deadlift": "dumbbellRomanianDeadlift",
  "leg press": "smithLegPress",
  "split squat": "splitSquats",
  "hamstring curl": "leverLyingLegCurl",
  "seated leg curl": "leverSeatedLegCurl",
  "standing calf raise": "barbellStandingCalfRaise",
  "row": "barbellBentOverRow",
  "seated row": "cableSeatedRow",
  "lat pulldown": "cablePulldown",
  "pull up": "pullUp",
  "overhead press": "dumbbellStandingOverheadPress",
  "incline dumbbell press": "dumbbellInclineBenchPress",
  "lateral raise": "dumbbellLateralRaise",
  "rear delt raise": "dumbbellRearLateralRaise",
  "triceps pressdown": "cablePushdown",
  "back extension": "leverBackExtension",
  "chest press machine": "leverChestPress",
  "shoulder press machine": "leverShoulderPress",
  "cable core press": "pallofPressHorizontal",
  "push up": "pushUp",
  "goblet squat": "dumbbellGobletSquat",
  "plank": "weightedFrontPlank"
};

const FALLBACK_MATCHES: Record<string, { assetKey: AssetKey; reason: string }> = {
  "deadlift": { assetKey: "trapBarDeadlift", reason: "Plain barbell deadlift was not verified; using the closest deadlift-pattern asset." },
  "hip hinge": { assetKey: "barbellRomanianDeadlift", reason: "Generic hinge pattern; using Romanian deadlift as representative." },
  "hip hinge accessory": { assetKey: "barbellRomanianDeadlift", reason: "Generic hinge accessory; using Romanian deadlift as representative." },
  "leg press or split squat": { assetKey: "smithLegPress", reason: "Compound option; using the first listed movement." },
  "lat pulldown or pull up": { assetKey: "cablePulldown", reason: "Compound option; using the first listed movement." },
  "pulldown or pull up": { assetKey: "cablePulldown", reason: "Compound option; using the first listed movement." },
  "pull up or pulldown": { assetKey: "pullUp", reason: "Compound option; using the first listed movement." },
  "barbell or cable row": { assetKey: "barbellBentOverRow", reason: "Compound option; using the first listed movement." },
  "chest supported row": { assetKey: "cableSeatedRow", reason: "Chest-supported row was not verified; using seated row as closest row pattern." },
  "chin up": { assetKey: "pullUp", reason: "Chin-up was not verified; using pull-up as closest vertical pull." },
  "bench or press intensity": { assetKey: "barbellBenchPress", reason: "Compound strength slot; using bench press as first listed movement." },
  "bench or press volume": { assetKey: "barbellBenchPress", reason: "Compound strength slot; using bench press as first listed movement." },
  "bench press or overhead press": { assetKey: "barbellBenchPress", reason: "Alternating lift slot; using bench press as first listed movement." },
  "press pattern": { assetKey: "barbellBenchPress", reason: "Generic press pattern; using bench press as representative." },
  "pull pattern": { assetKey: "barbellBentOverRow", reason: "Generic pull pattern; using barbell row as representative." },
  "squat pattern": { assetKey: "barbellFullSquatSidePov", reason: "Generic squat pattern; using barbell squat as representative." },
  "core anti extension": { assetKey: "weightedFrontPlank", reason: "Generic anti-extension core pattern; using plank as representative." },
  "lateral raise curls": { assetKey: "dumbbellLateralRaise", reason: "Superset label; using the first listed movement." },
  "cable lateral raise arms": { assetKey: "cableLateralRaise", reason: "Superset label; using the first listed movement." },
  "curl variation": { assetKey: "barbellCurl", reason: "Generic curl label; using barbell curl as representative." },
  "dumbbell press": { assetKey: "dumbbellInclineBenchPress", reason: "Generic dumbbell press; using dumbbell incline bench press as representative." },
  "band row": { assetKey: "dumbbellOneArmBentOverRow", reason: "Band row was not verified; using one-arm dumbbell row as closest row pattern." },
  "one arm row": { assetKey: "dumbbellOneArmBentOverRow", reason: "Generic one-arm row; using one-arm dumbbell row." },
  "deadlift or power clean": { assetKey: "trapBarDeadlift", reason: "Power clean was not verified; using the deadlift-pattern option." },
  "core or carry": { assetKey: "weightedFrontPlank", reason: "Generic core/carry slot; using plank as core representative." },
  "single leg or row assistance": { assetKey: "dumbbellSingleLegSplitSquat", reason: "Generic assistance slot; using split squat as single-leg representative." }
};

const NONE_MATCHES = new Set([
  "rest day",
  "zone 2 cardio",
  "brisk walk",
  "mobility circuit",
  "skill practice",
  "strength primer",
  "metcon",
  "cooldown walk breathing",
  "opposite pattern assistance",
  "loaded carry"
]);

const PATTERN_MATCHES: Array<{ needle: string; assetKey: AssetKey; status: Exclude<ExerciseGifMatchStatus, "none">; reason?: string }> = [
  { needle: "incline dumbbell press", assetKey: "dumbbellInclineBenchPress", status: "exact" },
  { needle: "dumbbell romanian deadlift", assetKey: "dumbbellRomanianDeadlift", status: "exact" },
  { needle: "romanian deadlift", assetKey: "barbellRomanianDeadlift", status: "exact" },
  { needle: "bench press", assetKey: "barbellBenchPress", status: "exact" },
  { needle: "overhead press", assetKey: "dumbbellStandingOverheadPress", status: "exact" },
  { needle: "shoulder press", assetKey: "leverShoulderPress", status: "exact" },
  { needle: "chest press", assetKey: "leverChestPress", status: "exact" },
  { needle: "leg press", assetKey: "smithLegPress", status: "exact" },
  { needle: "split squat", assetKey: "splitSquats", status: "exact" },
  { needle: "squat", assetKey: "barbellFullSquatSidePov", status: "exact" },
  { needle: "deadlift", assetKey: "trapBarDeadlift", status: "fallback", reason: "Deadlift variant matched by movement pattern." },
  { needle: "pulldown", assetKey: "cablePulldown", status: "exact" },
  { needle: "pull up", assetKey: "pullUp", status: "exact" },
  { needle: "row", assetKey: "barbellBentOverRow", status: "exact" },
  { needle: "lateral raise", assetKey: "dumbbellLateralRaise", status: "exact" },
  { needle: "rear delt", assetKey: "dumbbellRearLateralRaise", status: "exact" },
  { needle: "pressdown", assetKey: "cablePushdown", status: "exact" },
  { needle: "pushdown", assetKey: "cablePushdown", status: "exact" },
  { needle: "curl", assetKey: "barbellCurl", status: "fallback", reason: "Generic curl label matched to barbell curl." },
  { needle: "back extension", assetKey: "leverBackExtension", status: "exact" },
  { needle: "goblet squat", assetKey: "dumbbellGobletSquat", status: "exact" },
  { needle: "push up", assetKey: "pushUp", status: "exact" },
  { needle: "plank", assetKey: "weightedFrontPlank", status: "fallback", reason: "Plain plank was not verified; using closest plank visual." },
  { needle: "pallof", assetKey: "pallofPressHorizontal", status: "fallback", reason: "Cable core press matched to Pallof press pattern." }
];

export function getExerciseGifMatch(exerciseName: string): ExerciseGifMatch {
  const normalizedName = normalizeExerciseName(exerciseName);

  if (NONE_MATCHES.has(normalizedName)) {
    return { status: "none", originalName: exerciseName, normalizedName, reason: "No single exercise GIF should be shown for this workout row." };
  }

  const exactAssetKey = EXACT_MATCHES[normalizedName];
  if (exactAssetKey) return buildMatch("exact", exerciseName, normalizedName, exactAssetKey);

  const fallback = FALLBACK_MATCHES[normalizedName];
  if (fallback) return buildMatch("fallback", exerciseName, normalizedName, fallback.assetKey, fallback.reason);

  const patternMatch = PATTERN_MATCHES.find((entry) => normalizedName.includes(entry.needle));
  if (patternMatch) return buildMatch(patternMatch.status, exerciseName, normalizedName, patternMatch.assetKey, patternMatch.reason);

  return { status: "none", originalName: exerciseName, normalizedName, reason: "No verified ExerciseGymGifsDB match for this workout row." };
}

export function normalizeExerciseName(exerciseName: string): string {
  return exerciseName
    .toLowerCase()
    .replace(/5\/3\/1 work/g, "")
    .replace(/first-set-last/g, "")
    .replace(/\bintensity\b/g, "")
    .replace(/\bvolume\b/g, "")
    .replace(/[+]/g, " ")
    .replace(/[/]/g, " ")
    .replace(/[–—-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMatch(status: Exclude<ExerciseGifMatchStatus, "none">, originalName: string, normalizedName: string, assetKey: AssetKey, reason?: string): ExerciseGifMatch {
  return { status, originalName, normalizedName, asset: EXERCISE_GIF_ASSETS[assetKey], reason };
}
