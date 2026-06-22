import { useEffect, useMemo, useState } from "react";
import type { MacroResult, PlanResult, PlanType, Sex, UserInput } from "./core/types";
import { buildSafeCarbCyclingPlan as buildCarbCyclingPlan } from "./core/carbCyclingSafePlan";
import { ACTIVITY_LEVELS, DEFAULT_INPUTS } from "./core/constants";
import { buildStandardPlan } from "./core/standardPlan";
import { loadInput, saveInput } from "./storage/localPlan";

type Language = "en" | "zh";
type TimelineStatus = "empty" | "maintain" | "safe" | "standard" | "aggressive" | "high" | "blocked";

const LANGUAGE_KEY = "last_chance_language";
const DEFAULT_TIMELINE_WEEKS = 12;
const MIN_TIMELINE_WEEKS = 1;
const MAX_TIMELINE_WEEKS = 156;
const HARD_TIMELINE_LIMIT_RATE = 0.02;

interface TimelineRisk {
  status: TimelineStatus;
  title: string;
  detail: string;
  blocked: boolean;
  planRate?: number;
}

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
    expectedTimeline: "Expected timeline weeks",
    activity: "Activity",
    trainingDays: "Training days",
    weeklyLoss: "Weekly loss %",
    protein: "Protein g/kg",
    saveLocal: "Save plan locally",
    savedLocal: "Saved locally",
    adjustTimeline: "Adjust timeline first",
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
    projection: "Target timeline projection",
    projectionNote:
      "When a target weight is set, this projection follows your expected timeline. If no target is set, it falls back to 12 weeks.",
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
      "Use a moderate deficit, do not overreact to premenstrual water-weight changes, and monitor sleep, recovery, menstrual regularity, and hunger.",
    riskSetTarget: "Set target to assess risk",
    riskSetTargetDetail: "Enter a target weight and timeline to calculate the required weekly loss rate.",
    riskNoLossTarget: "Target is not below current weight",
    riskNoLossTargetDetail: "If the target is not fat loss, the app keeps the default weekly loss setting.",
    riskSafe: "Conservative range",
    riskStandard: "Standard range",
    riskAggressive: "Aggressive range",
    riskHigh: "High-risk range",
    riskBlocked: "Timeline too short",
    riskDetail:
      "Requires about {loss} kg/week, equal to {rate}% of body weight per week. Standard recommendation: at least {standardWeeks} weeks; hard minimum: no less than {hardWeeks} weeks."
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
    expectedTimeline: "期待完成用时（周）",
    activity: "活动水平",
    trainingDays: "每周训练天数",
    weeklyLoss: "每周下降 %",
    protein: "蛋白 g/kg",
    saveLocal: "保存到本机",
    savedLocal: "已保存",
    adjustTimeline: "先调整目标时间",
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
    projection: "目标时间预测",
    projectionNote: "设置目标体重后，预测长度会跟随期待完成用时；未设置目标体重时，默认显示 12 周。",
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
    femaleRules: "使用温和赤字，不要因经前水重波动误判失败，并持续观察睡眠、恢复、月经规律和饥饿感。",
    riskSetTarget: "设置目标后评估风险",
    riskSetTargetDetail: "输入目标体重和期待完成用时后，系统会计算所需每周下降速度。",
    riskNoLossTarget: "目标体重不低于当前体重",
    riskNoLossTargetDetail: "如果目标不是减重，系统会使用默认每周下降设置。",
    riskSafe: "保守区间",
    riskStandard: "标准区间",
    riskAggressive: "激进区间",
    riskHigh: "高风险区间",
    riskBlocked: "时间过短，不建议生成计划",
    riskDetail:
      "需要约 {loss} kg/周，等于当前体重的 {rate}%/周。标准建议至少 {standardWeeks} 周；硬性最低建议不少于 {hardWeeks} 周。"
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
  const [expectedTimelineWeeks, setExpectedTimelineWeeks] = useState(
    savedInput?.expectedTimelineWeeks ?? DEFAULT_TIMELINE_WEEKS
  );
  const [activityFactor, setActivityFactor] = useState(
    savedInput?.activityFactor ?? 1.5
  );
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(
    savedInput?.trainingDaysPerWeek ?? 4
  );
  const [proteinFactor, setProteinFactor] = useState(
    savedInput?.proteinFactor ?? DEFAULT_INPUTS.male.proteinFactor
  );
  const [saved, setSaved] = useState(false);

  const t = copy[language];
  const effectivePlanType: PlanType = sex === "female" ? "standard" : planType;
  const timelineRisk = useMemo(
    () => buildTimelineRisk(weightKg, targetWeightKg, expectedTimelineWeeks, t),
    [weightKg, targetWeightKg, expectedTimelineWeeks, t]
  );
  const goalRatePctPerWeek = timelineRisk.planRate ?? DEFAULT_INPUTS[sex].goalRatePctPerWeek;

  const input: UserInput = {
    sex,
    planType: effectivePlanType,
    age,
    heightCm,
    weightKg,
    targetWeightKg,
    expectedTimelineWeeks,
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
    expectedTimelineWeeks,
    activityFactor,
    trainingDaysPerWeek,
    goalRatePctPerWeek,
    proteinFactor
  ]);

  const projection = useMemo(
    () => buildTimelineProjection(weightKg, result.weeklyLossKg, targetWeightKg, expectedTimelineWeeks),
    [weightKg, result.weeklyLossKg, targetWeightKg, expectedTimelineWeeks]
  );

  const exportPayload = useMemo(
    () => ({
      app: "Last Chance",
      generatedAt: new Date().toISOString(),
      input,
      timelineRisk,
      result,
      projection
    }),
    [input, timelineRisk, result, projection]
  );

  useEffect(() => {
    setSaved(false);
  }, [result, timelineRisk]);

  function handleLanguageChange(nextLanguage: Language) {
    setLanguage(nextLanguage);
    saveLanguage(nextLanguage);
  }

  function handleSexChange(nextSex: Sex) {
    setSex(nextSex);

    if (nextSex === "female") {
      setPlanType("standard");
      setProteinFactor(DEFAULT_INPUTS.female.proteinFactor);
    } else {
      setProteinFactor(DEFAULT_INPUTS.male.proteinFactor);
    }
  }

  function handleSave() {
    if (timelineRisk.blocked) return;
    saveInput(input);
    setSaved(true);
  }

  function handleDownloadJson() {
    if (timelineRisk.blocked) return;
    downloadTextFile(
      "last-chance-plan.json",
      JSON.stringify(exportPayload, null, 2),
      "application/json"
    );
  }

  function handleDownloadCsv() {
    if (timelineRisk.blocked) return;
    downloadTextFile("last-chance-plan.csv", buildCsv(input, timelineRisk, result, projection), "text/csv");
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
          <NumberField
            label={t.expectedTimeline}
            value={expectedTimelineWeeks}
            min={MIN_TIMELINE_WEEKS}
            max={MAX_TIMELINE_WEEKS}
            onChange={setExpectedTimelineWeeks}
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
          <NumberField
            label={t.protein}
            value={proteinFactor}
            min={1.4}
            max={2.4}
            step={0.1}
            onChange={setProteinFactor}
          />
        </div>
        <TimelineRiskPanel risk={timelineRisk} />
        <button
          className="primary-button"
          disabled={timelineRisk.blocked}
          onClick={handleSave}
          type="button"
        >
          {timelineRisk.blocked ? t.adjustTimeline : saved ? t.savedLocal : t.saveLocal}
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
          <button
            className="secondary-button"
            disabled={timelineRisk.blocked}
            type="button"
            onClick={handleDownloadJson}
          >
            {t.exportJson}
          </button>
          <button
            className="secondary-button"
            disabled={timelineRisk.blocked}
            type="button"
            onClick={handleDownloadCsv}
          >
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
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (Number.isFinite(nextValue)) onChange(nextValue);
        }}
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
        onChange={(event) => {
          const rawValue = event.target.value.trim();
          if (rawValue === "") {
            onChange(undefined);
            return;
          }

          const nextValue = Number(rawValue);
          if (Number.isFinite(nextValue)) onChange(nextValue);
        }}
      />
    </div>
  );
}

function TimelineRiskPanel({ risk }: { risk: TimelineRisk }) {
  return (
    <div className={`timeline-risk-panel ${risk.status}`}>
      <strong>{risk.title}</strong>
      <span>{risk.detail}</span>
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

function buildTimelineRisk(
  currentWeightKg: number,
  targetWeightKg: number | undefined,
  expectedTimelineWeeks: number,
  labels: typeof copy.en | typeof copy.zh
): TimelineRisk {
  if (!Number.isFinite(currentWeightKg) || !Number.isFinite(expectedTimelineWeeks)) {
    return {
      status: "empty",
      title: labels.riskSetTarget,
      detail: labels.riskSetTargetDetail,
      blocked: false
    };
  }

  if (targetWeightKg === undefined || !Number.isFinite(targetWeightKg)) {
    return {
      status: "empty",
      title: labels.riskSetTarget,
      detail: labels.riskSetTargetDetail,
      blocked: false
    };
  }

  if (targetWeightKg >= currentWeightKg) {
    return {
      status: "maintain",
      title: labels.riskNoLossTarget,
      detail: labels.riskNoLossTargetDetail,
      blocked: false
    };
  }

  const weeks = Math.min(
    MAX_TIMELINE_WEEKS,
    Math.max(MIN_TIMELINE_WEEKS, Math.round(expectedTimelineWeeks))
  );
  const totalLossKg = currentWeightKg - targetWeightKg;
  const weeklyLossKg = totalLossKg / weeks;
  const weeklyRate = weeklyLossKg / currentWeightKg;
  const standardWeeks = Math.max(1, Math.ceil(totalLossKg / (currentWeightKg * 0.01)));
  const hardWeeks = Math.max(1, Math.ceil(totalLossKg / (currentWeightKg * HARD_TIMELINE_LIMIT_RATE)));
  const detail = labels.riskDetail
    .replace("{loss}", weeklyLossKg.toFixed(2))
    .replace("{rate}", (weeklyRate * 100).toFixed(2))
    .replace("{standardWeeks}", String(standardWeeks))
    .replace("{hardWeeks}", String(hardWeeks));
  const planRate = Math.min(HARD_TIMELINE_LIMIT_RATE, Math.max(0.002, weeklyRate));

  if (weeklyRate > HARD_TIMELINE_LIMIT_RATE) {
    return {
      status: "blocked",
      title: labels.riskBlocked,
      detail,
      blocked: true,
      planRate
    };
  }

  if (weeklyRate > 0.015) {
    return { status: "high", title: labels.riskHigh, detail, blocked: false, planRate };
  }

  if (weeklyRate > 0.01) {
    return { status: "aggressive", title: labels.riskAggressive, detail, blocked: false, planRate };
  }

  if (weeklyRate >= 0.005) {
    return { status: "standard", title: labels.riskStandard, detail, blocked: false, planRate };
  }

  return { status: "safe", title: labels.riskSafe, detail, blocked: false, planRate };
}

function buildTimelineProjection(
  currentWeightKg: number,
  weeklyLossKg: number,
  targetWeightKg: number | undefined,
  expectedTimelineWeeks: number
) {
  const hasWeightTarget =
    Number.isFinite(targetWeightKg) && targetWeightKg !== undefined && targetWeightKg < currentWeightKg;
  const totalWeeks = hasWeightTarget
    ? Math.min(MAX_TIMELINE_WEEKS, Math.max(MIN_TIMELINE_WEEKS, Math.round(expectedTimelineWeeks)))
    : DEFAULT_TIMELINE_WEEKS;
  const target = hasWeightTarget ? targetWeightKg : undefined;
  const projectionWeeklyLossKg =
    target !== undefined ? (currentWeightKg - target) / totalWeeks : weeklyLossKg;

  return Array.from({ length: totalWeeks }, (_, index) => {
    const week = index + 1;
    const rawWeight = currentWeightKg - projectionWeeklyLossKg * week;
    const weightKg = target !== undefined ? Math.max(rawWeight, target) : rawWeight;

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
  timelineRisk: TimelineRisk,
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
  lines.push(`input,expectedTimelineWeeks,${input.expectedTimelineWeeks}`);
  lines.push(`input,activityFactor,${input.activityFactor}`);
  lines.push(`input,trainingDaysPerWeek,${input.trainingDaysPerWeek}`);
  lines.push(`input,goalRatePctPerWeek,${input.goalRatePctPerWeek}`);
  lines.push(`input,proteinFactor,${input.proteinFactor}`);
  lines.push(`timeline,status,${timelineRisk.status}`);
  lines.push(`timeline,blocked,${timelineRisk.blocked}`);
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
