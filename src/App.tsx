import { useEffect, useMemo, useState } from "react";
import type { MacroResult, PlanResult, PlanType, Sex, UserInput } from "./core/types";
import { buildSafeCarbCyclingPlan as buildCarbCyclingPlan } from "./core/carbCyclingSafePlan";
import { ACTIVITY_LEVELS, DEFAULT_INPUTS } from "./core/constants";
import { buildStandardPlan } from "./core/standardPlan";
import { loadInput, saveInput } from "./storage/localPlan";

type Language = "en" | "zh";

const LANGUAGE_KEY = "last_chance_language";

function loadLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LANGUAGE_KEY);
  return stored === "zh" ? "zh" : "en";
}

function saveLanguage(language: Language) {
  window.localStorage.setItem(LANGUAGE_KEY, language);
}

const copy = {
  en: {
    eyebrow: "Evidence-based planner",
    subtitle:
      "A minimal fat-loss planner for calorie deficit, high-protein dieting, and male carb cycling.",
    sex: "Sex",
    male: "Male",
    female: "Female",
    plan: "Plan",
    standard: "Standard",
    carbCycling: "Carb Cycling",
    carbNote:
      "Carb cycling keeps the weekly deficit fixed and shifts carbohydrates toward the hardest resistance-training days.",
    bodyData: "Body data",
    age: "Age",
    height: "Height cm",
    weight: "Weight kg",
    target: "Target kg",
    activity: "Activity",
    trainingDays: "Training days",
    weeklyLoss: "Weekly loss %",
    protein: "Protein g/kg",
    saveLocal: "Save plan locally",
    savedLocal: "Saved locally",
    result: "Result",
    calories: "Calories",
    proteinShort: "Protein",
    fat: "Fat",
    carbs: "Carbs",
    high: "High Carb Day",
    medium: "Medium Carb Day",
    low: "Low Carb Day",
    weeklyStructure: "Weekly structure",
    highNote:
      "High-carb days should be assigned to the hardest sessions, not to uncontrolled cheat meals.",
    safety: "Safety notes",
    install: "Install",
    installNote: "iPhone: open this site in Safari, tap Share, then Add to Home Screen.",
    disclaimer:
      "Last Chance is not medical advice. If pregnant, breastfeeding, under 18, diagnosed with diabetes, kidney disease, eating disorder, or using medication affecting appetite or blood glucose, seek professional guidance first.",
    projection: "12-week projection",
    projectionNote:
      "This projection assumes adherence and no metabolic adaptation. Use 7-day average body weight to judge the trend.",
    week: "Week",
    projectedWeight: "Projected weight",
    expectedLoss: "Expected loss",
    export: "Export",
    exportJson: "Download JSON",
    exportCsv: "Download CSV",
    weeklyCheck: "Weekly calorie check",
    targetWeeklyCalories: "Target weekly calories",
    allocatedWeeklyCalories: "Allocated weekly calories",
    difference: "Difference",
    execution: "Execution rules",
    standardRules:
      "Keep calories consistent, hit protein daily, use strength training to preserve lean mass, and adjust only after two weeks of 7-day average weight data.",
    carbRules:
      "Keep weekly calories fixed. Put high-carb days on heavy legs, deadlift, or full-body sessions. Low-carb days are for rest, walking, or light cardio.",
    femaleRules:
      "Use a moderate deficit, do not overreact to premenstrual water-weight changes, and monitor sleep, recovery, menstrual regularity, and hunger."
  },
  zh: {
    eyebrow: "证据导向减脂计划",
    subtitle: "极简科学减脂工具：热量缺口、高蛋白饮食，以及男士训练导向碳水循环。",
    sex: "性别",
    male: "男士",
    female: "女士",
    plan: "方案",
    standard: "标准减脂",
    carbCycling: "碳水循环",
    carbNote: "碳水循环保持每周总赤字不变，只把更多碳水分配给最难的力量训练日。",
    bodyData: "身体数据",
    age: "年龄",
    height: "身高 cm",
    weight: "体重 kg",
    target: "目标体重 kg",
    activity: "活动水平",
    trainingDays: "每周训练天数",
    weeklyLoss: "每周下降 %",
    protein: "蛋白 g/kg",
    saveLocal: "保存到本机",
    savedLocal: "已保存",
    result: "结果",
    calories: "热量",
    proteinShort: "蛋白质",
    fat: "脂肪",
    carbs: "碳水",
    high: "高碳日",
    medium: "中碳日",
    low: "低碳日",
    weeklyStructure: "一周结构",
    highNote: "高碳日应该给最重的训练日，不是用来失控放纵。",
    safety: "安全提示",
    install: "安装",
    installNote: "iPhone：用 Safari 打开，点击分享，然后选择添加到主屏幕。",
    disclaimer:
      "Last Chance 不是医疗建议。孕期、哺乳期、未成年人、糖尿病、肾脏疾病、进食障碍史，或正在使用影响食欲/血糖药物的人，应先咨询专业人士。",
    projection: "12 周预测",
    projectionNote: "该预测假设严格执行且不考虑代谢适应。判断趋势时请使用 7 日平均体重。",
    week: "周数",
    projectedWeight: "预测体重",
    expectedLoss: "预计下降",
    export: "导出",
    exportJson: "下载 JSON",
    exportCsv: "下载 CSV",
    weeklyCheck: "周热量核验",
    targetWeeklyCalories: "目标周热量",
    allocatedWeeklyCalories: "分配周热量",
    difference: "差值",
    execution: "执行规则",
    standardRules: "保持热量稳定，每天打够蛋白，用力量训练保留瘦体重；至少观察两周 7 日平均体重后再调整。",
    carbRules: "保持周热量不变。高碳日给重腿、硬拉、全身大容量训练；低碳日用于休息、步行或轻有氧。",
    femaleRules: "使用温和赤字，不要因经前水重波动误判失败，并持续观察睡眠、恢复、月经规律和饥饿感。"
  }
} as const;

export default function App() {
  const savedInput = typeof window !== "undefined" ? loadInput() : null;

  const [language, setLanguage] = useState<Language>(loadLanguage());
  const [sex, setSex] = useState<Sex>(savedInput?.sex ?? "male");
  const [planType, setPlanType] = useState<PlanType>(
    savedInput?.planType ?? "standard"
  );
  const [age, setAge] = useState(savedInput?.age ?? 30);
  const [heightCm, setHeightCm] = useState(savedInput?.heightCm ?? 175);
  const [weightKg, setWeightKg] = useState(savedInput?.weightKg ?? 80);
  const [targetWeightKg, setTargetWeightKg] = useState<number | undefined>(
    savedInput?.targetWeightKg
  );
  const [activityFactor, setActivityFactor] = useState(
    savedInput?.activityFactor ?? 1.5
  );
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(
    savedInput?.trainingDaysPerWeek ?? 4
  );
  const [goalRatePctPerWeek, setGoalRatePctPerWeek] = useState(
    savedInput?.goalRatePctPerWeek ?? DEFAULT_INPUTS.male.goalRatePctPerWeek
  );
  const [proteinFactor, setProteinFactor] = useState(
    savedInput?.proteinFactor ?? DEFAULT_INPUTS.male.proteinFactor
  );
  const [saved, setSaved] = useState(false);

  const t = copy[language];
  const effectivePlanType: PlanType = sex === "female" ? "standard" : planType;

  const input: UserInput = {
    sex,
    planType: effectivePlanType,
    age,
    heightCm,
    weightKg,
    targetWeightKg,
    activityFactor,
    trainingDaysPerWeek,
    goalRatePctPerWeek,
    proteinFactor
  };

  const result = useMemo<PlanResult>(() => {
    if (sex === "male" && effectivePlanType === "carbCycling") {
      return buildCarbCyclingPlan(input);
    }

    return buildStandardPlan(input);
  }, [
    sex,
    effectivePlanType,
    age,
    heightCm,
    weightKg,
    targetWeightKg,
    activityFactor,
    trainingDaysPerWeek,
    goalRatePctPerWeek,
    proteinFactor
  ]);

  const projection = useMemo(
    () => buildTwelveWeekProjection(weightKg, result.weeklyLossKg, targetWeightKg),
    [weightKg, result.weeklyLossKg, targetWeightKg]
  );

  const exportPayload = useMemo(
    () => ({
      app: "Last Chance",
      generatedAt: new Date().toISOString(),
      input,
      result,
      projection
    }),
    [input, result, projection]
  );

  useEffect(() => {
    setSaved(false);
  }, [result]);

  function handleLanguageChange(nextLanguage: Language) {
    setLanguage(nextLanguage);
    saveLanguage(nextLanguage);
  }

  function handleSexChange(nextSex: Sex) {
    setSex(nextSex);

    if (nextSex === "female") {
      setPlanType("standard");
      setProteinFactor(DEFAULT_INPUTS.female.proteinFactor);
      setGoalRatePctPerWeek(DEFAULT_INPUTS.female.goalRatePctPerWeek);
    } else {
      setProteinFactor(DEFAULT_INPUTS.male.proteinFactor);
      setGoalRatePctPerWeek(DEFAULT_INPUTS.male.goalRatePctPerWeek);
    }
  }

  function handleSave() {
    saveInput(input);
    setSaved(true);
  }

  function handleDownloadJson() {
    downloadTextFile(
      "last-chance-plan.json",
      JSON.stringify(exportPayload, null, 2),
      "application/json"
    );
  }

  function handleDownloadCsv() {
    downloadTextFile("last-chance-plan.csv", buildCsv(input, result, projection), "text/csv");
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-topline">
          <p className="eyebrow">{t.eyebrow}</p>
          <div className="language-toggle" aria-label="Language selector">
            <button
              className={language === "en" ? "active" : ""}
              onClick={() => handleLanguageChange("en")}
              type="button"
            >
              EN
            </button>
            <button
              className={language === "zh" ? "active" : ""}
              onClick={() => handleLanguageChange("zh")}
              type="button"
            >
              中文
            </button>
          </div>
        </div>
        <h1 className="hero-title">Last Chance</h1>
        <p className="hero-subtitle">{t.subtitle}</p>
      </section>

      <section className="card">
        <div className="card-title">{t.sex}</div>
        <div className="segmented two">
          <button
            className={sex === "male" ? "active" : ""}
            onClick={() => handleSexChange("male")}
            type="button"
          >
            {t.male}
          </button>
          <button
            className={sex === "female" ? "active" : ""}
            onClick={() => handleSexChange("female")}
            type="button"
          >
            {t.female}
          </button>
        </div>
      </section>

      {sex === "male" && (
        <section className="card">
          <div className="card-title">{t.plan}</div>
          <div className="segmented two">
            <button
              className={planType === "standard" ? "active" : ""}
              onClick={() => setPlanType("standard")}
              type="button"
            >
              {t.standard}
            </button>
            <button
              className={planType === "carbCycling" ? "active" : ""}
              onClick={() => setPlanType("carbCycling")}
              type="button"
            >
              {t.carbCycling}
            </button>
          </div>
          <p className="small-note">{t.carbNote}</p>
        </section>
      )}

      <section className="card">
        <div className="card-title">{t.bodyData}</div>
        <div className="input-grid">
          <NumberField label={t.age} value={age} min={18} max={80} onChange={setAge} />
          <NumberField
            label={t.height}
            value={heightCm}
            min={130}
            max={230}
            onChange={setHeightCm}
          />
          <NumberField
            label={t.weight}
            value={weightKg}
            min={35}
            max={250}
            step={0.1}
            onChange={setWeightKg}
          />
          <OptionalNumberField
            label={t.target}
            value={targetWeightKg}
            min={35}
            max={250}
            step={0.1}
            onChange={setTargetWeightKg}
          />
          <div className="field">
            <label>{t.activity}</label>
            <select
              value={activityFactor}
              onChange={(event) => setActivityFactor(Number(event.target.value))}
            >
              {ACTIVITY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label} · {level.description}
                </option>
              ))}
            </select>
          </div>
          <NumberField
            label={t.trainingDays}
            value={trainingDaysPerWeek}
            min={0}
            max={6}
            onChange={setTrainingDaysPerWeek}
          />
          <div className="field">
            <label>{t.weeklyLoss}</label>
            <input
              type="number"
              value={Number((goalRatePctPerWeek * 100).toFixed(2))}
              min={0.2}
              max={1.2}
              step={0.05}
              onChange={(event) =>
                setGoalRatePctPerWeek(Number(event.target.value) / 100)
              }
            />
          </div>
          <NumberField
            label={t.protein}
            value={proteinFactor}
            min={1.4}
            max={2.4}
            step={0.1}
            onChange={setProteinFactor}
          />
        </div>
        <button className="primary-button" onClick={handleSave} type="button">
          {saved ? t.savedLocal : t.saveLocal}
        </button>
      </section>

      <section className="card accent-card">
        <div className="card-title">{t.result}</div>
        {result.kind === "standard" ? (
          <MacroGrid data={result.daily} labels={t} />
        ) : (
          <div className="cycle-stack">
            <MacroBlock title={t.high} data={result.highDay} labels={t} />
            <MacroBlock title={t.medium} data={result.mediumDay} labels={t} />
            <MacroBlock title={t.low} data={result.lowDay} labels={t} />
          </div>
        )}
        <div className="summary-line">
          <span>RMR {result.rmr} kcal</span>
          <span>TDEE {result.tdee} kcal</span>
          <span>{t.expectedLoss} {result.weeklyLossKg} kg/week</span>
        </div>
      </section>

      {result.kind === "carbCycling" && (
        <section className="card">
          <div className="card-title">{t.weeklyCheck}</div>
          <WeeklyCalorieCheck result={result} labels={t} />
        </section>
      )}

      <section className="card">
        <div className="card-title">{t.projection}</div>
        <div className="projection-table">
          {projection.map((row) => (
            <div className="projection-row" key={row.week}>
              <span>{t.week} {row.week}</span>
              <strong>{row.weightKg.toFixed(1)} kg</strong>
            </div>
          ))}
        </div>
        <p className="small-note">{t.projectionNote}</p>
      </section>

      <section className="card">
        <div className="card-title">{t.export}</div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={handleDownloadJson}>
            {t.exportJson}
          </button>
          <button className="secondary-button" type="button" onClick={handleDownloadCsv}>
            {t.exportCsv}
          </button>
        </div>
      </section>

      {result.kind === "carbCycling" && (
        <section className="card">
          <div className="card-title">{t.weeklyStructure}</div>
          <div className="day-counts">
            <span>{result.dayCounts.high} high</span>
            <span>{result.dayCounts.medium} medium</span>
            <span>{result.dayCounts.low} low</span>
          </div>
          {result.weeklySchedule.map((row) => (
            <div className="schedule-row" key={row.day}>
              <strong>{row.day}</strong>
              <span className={`day-type ${row.type.toLowerCase()}`}>{row.type}</span>
              <span className="small-note">{row.note}</span>
            </div>
          ))}
          <p className="small-note">{t.highNote}</p>
        </section>
      )}

      <section className="card">
        <div className="card-title">{t.execution}</div>
        <p className="small-note">
          {sex === "female"
            ? t.femaleRules
            : result.kind === "carbCycling"
              ? t.carbRules
              : t.standardRules}
        </p>
      </section>

      {result.warnings.length > 0 && (
        <section className="card">
          <div className="card-title">{t.safety}</div>
          {result.warnings.map((warning) => (
            <div className="warning" key={warning}>
              {warning}
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <div className="card-title">{t.install}</div>
        <p className="small-note">{t.installNote}</p>
        <p className="small-note">{t.disclaimer}</p>
      </section>
    </main>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function OptionalNumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  label: string;
  value?: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        placeholder="Optional"
        onChange={(event) =>
          onChange(event.target.value === "" ? undefined : Number(event.target.value))
        }
      />
    </div>
  );
}

function Metric({
  label,
  value,
  unit
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {value}
        <span className="metric-unit">{unit}</span>
      </div>
    </div>
  );
}

function MacroGrid({
  data,
  labels
}: {
  data: MacroResult;
  labels: typeof copy.en | typeof copy.zh;
}) {
  return (
    <div className="metric-grid">
      <Metric label={labels.calories} value={data.calories} unit="kcal" />
      <Metric label={labels.proteinShort} value={data.proteinG} unit="g" />
      <Metric label={labels.fat} value={data.fatG} unit="g" />
      <Metric label={labels.carbs} value={data.carbsG} unit="g" />
    </div>
  );
}

function MacroBlock({
  title,
  data,
  labels
}: {
  title: string;
  data: MacroResult;
  labels: typeof copy.en | typeof copy.zh;
}) {
  return (
    <div className="macro-block">
      <h3>{title}</h3>
      <MacroGrid data={data} labels={labels} />
    </div>
  );
}

function WeeklyCalorieCheck({
  result,
  labels
}: {
  result: Extract<PlanResult, { kind: "carbCycling" }>;
  labels: typeof copy.en | typeof copy.zh;
}) {
  const allocated =
    result.highDay.calories * result.dayCounts.high +
    result.mediumDay.calories * result.dayCounts.medium +
    result.lowDay.calories * result.dayCounts.low;
  const difference = allocated - result.weeklyCalories;

  return (
    <div className="check-grid">
      <div>
        <span>{labels.targetWeeklyCalories}</span>
        <strong>{result.weeklyCalories} kcal</strong>
      </div>
      <div>
        <span>{labels.allocatedWeeklyCalories}</span>
        <strong>{allocated} kcal</strong>
      </div>
      <div>
        <span>{labels.difference}</span>
        <strong>{difference > 0 ? "+" : ""}{difference} kcal</strong>
      </div>
    </div>
  );
}

function buildTwelveWeekProjection(
  currentWeightKg: number,
  weeklyLossKg: number,
  targetWeightKg?: number
) {
  return Array.from({ length: 12 }, (_, index) => {
    const week = index + 1;
    const rawWeight = currentWeightKg - weeklyLossKg * week;
    const weightKg =
      targetWeightKg && targetWeightKg < currentWeightKg
        ? Math.max(rawWeight, targetWeightKg)
        : rawWeight;

    return {
      week,
      weightKg
    };
  });
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildCsv(
  input: UserInput,
  result: PlanResult,
  projection: { week: number; weightKg: number }[]
): string {
  const lines: string[] = [];
  lines.push("section,key,value");
  lines.push(`input,sex,${input.sex}`);
  lines.push(`input,planType,${input.planType}`);
  lines.push(`input,age,${input.age}`);
  lines.push(`input,heightCm,${input.heightCm}`);
  lines.push(`input,weightKg,${input.weightKg}`);
  lines.push(`input,targetWeightKg,${input.targetWeightKg ?? ""}`);
  lines.push(`input,activityFactor,${input.activityFactor}`);
  lines.push(`input,trainingDaysPerWeek,${input.trainingDaysPerWeek}`);
  lines.push(`input,goalRatePctPerWeek,${input.goalRatePctPerWeek}`);
  lines.push(`input,proteinFactor,${input.proteinFactor}`);
  lines.push(`result,rmr,${result.rmr}`);
  lines.push(`result,tdee,${result.tdee}`);
  lines.push(`result,dailyDeficitKcal,${result.dailyDeficitKcal}`);
  lines.push(`result,weeklyLossKg,${result.weeklyLossKg}`);

  if (result.kind === "standard") {
    appendMacroCsv(lines, "daily", result.daily);
  } else {
    appendMacroCsv(lines, "highDay", result.highDay);
    appendMacroCsv(lines, "mediumDay", result.mediumDay);
    appendMacroCsv(lines, "lowDay", result.lowDay);
    lines.push(`carbCycle,highDays,${result.dayCounts.high}`);
    lines.push(`carbCycle,mediumDays,${result.dayCounts.medium}`);
    lines.push(`carbCycle,lowDays,${result.dayCounts.low}`);
    lines.push(`carbCycle,weeklyCalories,${result.weeklyCalories}`);
  }

  projection.forEach((row) => {
    lines.push(`projection,week_${row.week},${row.weightKg.toFixed(1)}`);
  });

  return lines.join("\n");
}

function appendMacroCsv(lines: string[], prefix: string, macro: MacroResult) {
  lines.push(`${prefix},calories,${macro.calories}`);
  lines.push(`${prefix},proteinG,${macro.proteinG}`);
  lines.push(`${prefix},fatG,${macro.fatG}`);
  lines.push(`${prefix},carbsG,${macro.carbsG}`);
}
