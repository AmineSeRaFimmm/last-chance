import { useState } from "react";
import { buildCarbCyclingPlan } from "../core/carbCyclingPlan";
import { DEFAULT_INPUTS } from "../core/constants";
import { buildStandardPlan } from "../core/standardPlan";
import type { PlanResult, UserInput } from "../core/types";
import { loadInput } from "../storage/localPlan";
import { ProgressTracker } from "./ProgressTracker";

type Language = "en" | "zh";

interface TrackerPlanSource {
  language: Language;
  plannedDailyCalories: number;
  expectedWeeklyLossKg: number;
  defaultWeightKg: number;
  label: string;
  hasSavedPlan: boolean;
}

const copy = {
  en: {
    title: "Tracking source",
    saved: "Using locally saved plan",
    fallback: "Using default plan until you save your current plan",
    sync: "Sync saved plan",
    note: "For exact tracking, adjust the plan above, tap Save plan locally, then sync here."
  },
  zh: {
    title: "跟踪来源",
    saved: "正在使用本机保存的方案",
    fallback: "尚未保存当前方案，暂用默认方案",
    sync: "同步已保存方案",
    note: "要精确跟踪，请先在上方调整方案并点击保存到本机，然后在这里同步。"
  }
} as const;

export function StandaloneProgressTracker() {
  const [source, setSource] = useState<TrackerPlanSource>(() => buildTrackerPlanSource());
  const t = copy[source.language];

  function handleSync() {
    setSource(buildTrackerPlanSource());
  }

  return (
    <main className="app-shell progress-shell">
      <section className="card tracker-source-card">
        <div className="card-title">{t.title}</div>
        <div className="summary-line">
          <span>{source.label}</span>
          <span>{Math.round(source.plannedDailyCalories)} kcal/day</span>
          <span>{source.expectedWeeklyLossKg.toFixed(2)} kg/week</span>
        </div>
        <p className="small-note">{t.note}</p>
        <button className="secondary-button full-width-button" type="button" onClick={handleSync}>
          {t.sync}
        </button>
      </section>

      <ProgressTracker
        language={source.language}
        plannedDailyCalories={source.plannedDailyCalories}
        expectedWeeklyLossKg={source.expectedWeeklyLossKg}
        defaultWeightKg={source.defaultWeightKg}
      />
    </main>
  );
}

function buildTrackerPlanSource(): TrackerPlanSource {
  const language = loadLanguage();
  const savedInput = loadInput();
  const input = savedInput ?? buildDefaultInput();
  const result = buildResult(input);
  const plannedDailyCalories =
    result.kind === "standard" ? result.daily.calories : Math.round(result.weeklyCalories / 7);

  return {
    language,
    plannedDailyCalories,
    expectedWeeklyLossKg: result.weeklyLossKg,
    defaultWeightKg: input.weightKg,
    label: savedInput ? copy[language].saved : copy[language].fallback,
    hasSavedPlan: Boolean(savedInput)
  };
}

function buildResult(input: UserInput): PlanResult {
  if (input.sex === "male" && input.planType === "carbCycling") {
    return buildCarbCyclingPlan(input);
  }

  return buildStandardPlan(input);
}

function buildDefaultInput(): UserInput {
  return {
    sex: "male",
    planType: "standard",
    age: 30,
    heightCm: 175,
    weightKg: 80,
    activityFactor: 1.5,
    trainingDaysPerWeek: 4,
    goalRatePctPerWeek: DEFAULT_INPUTS.male.goalRatePctPerWeek,
    proteinFactor: DEFAULT_INPUTS.male.proteinFactor
  };
}

function loadLanguage(): Language {
  const stored = window.localStorage.getItem("last_chance_language");
  return stored === "zh" ? "zh" : "en";
}
