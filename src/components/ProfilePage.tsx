import { useEffect, useState } from "react";
import { buildSafeCarbCyclingPlan as buildCarbCyclingPlan } from "../core/carbCyclingSafePlan";
import { DEFAULT_INPUTS } from "../core/constants";
import { buildStandardPlan } from "../core/standardPlan";
import type { PlanResult, UserInput } from "../core/types";
import { loadInput } from "../storage/localPlan";
import { ProgressTracker } from "./ProgressTracker";

type Language = "en" | "zh";

const copy = {
  en: {
    eyebrow: "Personal dashboard",
    title: "Profile",
    subtitle: "Saved plan, body data, and progress tracking in one place.",
    noPlan: "No saved plan yet",
    noPlanText: "Go to Plan, complete your data, then tap Save plan locally.",
    personal: "Personal data",
    savedPlan: "Saved plan",
    sex: "Sex",
    age: "Age",
    height: "Height",
    weight: "Current weight",
    target: "Target weight",
    timeline: "Timeline",
    activity: "Activity factor",
    trainingDays: "Training days",
    planType: "Plan type",
    calories: "Planned calories",
    weeklyLoss: "Expected weekly loss",
    protein: "Protein factor"
  },
  zh: {
    eyebrow: "个人主页",
    title: "Profile",
    subtitle: "个人信息、保存计划和进度跟踪集中在一个页面。",
    noPlan: "还没有保存计划",
    noPlanText: "先进入 Plan，填完数据后点击保存到本机。",
    personal: "个人信息",
    savedPlan: "保存的计划",
    sex: "性别",
    age: "年龄",
    height: "身高",
    weight: "当前体重",
    target: "目标体重",
    timeline: "目标周期",
    activity: "活动系数",
    trainingDays: "训练天数",
    planType: "计划类型",
    calories: "计划热量",
    weeklyLoss: "预计周下降",
    protein: "蛋白系数"
  }
} as const;

export function ProfilePage() {
  const [source, setSource] = useState(() => buildProfileSource());

  useEffect(() => {
    const refresh = () => setSource(buildProfileSource());
    window.addEventListener("focus", refresh);
    window.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const t = copy[source.language];

  return (
    <main className="app-shell profile-shell">
      <section className="hero profile-hero">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="hero-title">Profile</h1>
        <p className="hero-subtitle">{t.subtitle}</p>
      </section>

      {!source.savedInput && (
        <section className="card">
          <div className="card-title">{t.noPlan}</div>
          <p className="small-note no-margin">{t.noPlanText}</p>
        </section>
      )}

      {source.savedInput && (
        <>
          <section className="card profile-summary-card">
            <div className="card-title">{t.personal}</div>
            <div className="profile-metric-grid">
              <ProfileMetric label={t.sex} value={source.savedInput.sex} />
              <ProfileMetric label={t.age} value={String(source.savedInput.age)} />
              <ProfileMetric label={t.height} value={`${source.savedInput.heightCm} cm`} />
              <ProfileMetric label={t.weight} value={`${source.savedInput.weightKg} kg`} />
              <ProfileMetric label={t.target} value={source.savedInput.targetWeightKg ? `${source.savedInput.targetWeightKg} kg` : "—"} />
              <ProfileMetric label={t.timeline} value={source.savedInput.expectedTimelineWeeks ? `${source.savedInput.expectedTimelineWeeks} weeks` : "—"} />
            </div>
          </section>

          <section className="card profile-summary-card">
            <div className="card-title">{t.savedPlan}</div>
            <div className="profile-metric-grid">
              <ProfileMetric label={t.planType} value={source.savedInput.planType} />
              <ProfileMetric label={t.activity} value={String(source.savedInput.activityFactor)} />
              <ProfileMetric label={t.trainingDays} value={`${source.savedInput.trainingDaysPerWeek}/week`} />
              <ProfileMetric label={t.protein} value={`${source.savedInput.proteinFactor} g/kg`} />
              <ProfileMetric label={t.calories} value={`${source.plannedDailyCalories} kcal/day`} />
              <ProfileMetric label={t.weeklyLoss} value={`${source.expectedWeeklyLossKg} kg/week`} />
            </div>
          </section>
        </>
      )}

      <ProgressTracker
        language={source.language}
        plannedDailyCalories={source.plannedDailyCalories}
        expectedWeeklyLossKg={source.expectedWeeklyLossKg}
        defaultWeightKg={source.defaultWeightKg}
      />
    </main>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return <div className="profile-metric"><span>{label}</span><strong>{value}</strong></div>;
}

function buildProfileSource() {
  const language = loadLanguage();
  const savedInput = loadInput();
  const input = savedInput ?? buildDefaultInput();
  const result = buildResult(input);
  const plannedDailyCalories = result.kind === "standard" ? result.daily.calories : Math.round(result.weeklyCalories / 7);
  return { language, savedInput, plannedDailyCalories, expectedWeeklyLossKg: result.weeklyLossKg, defaultWeightKg: input.weightKg };
}

function buildResult(input: UserInput): PlanResult {
  if (input.sex === "male" && input.planType === "carbCycling") return buildCarbCyclingPlan(input);
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
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("last_chance_language") === "zh" ? "zh" : "en";
}
