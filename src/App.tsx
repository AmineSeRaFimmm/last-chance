import { useEffect, useMemo, useState } from "react";
import type { MacroResult, PlanType, Sex, UserInput } from "./core/types";
import { buildCarbCyclingPlan } from "./core/carbCyclingPlan";
import { ACTIVITY_LEVELS, DEFAULT_INPUTS } from "./core/constants";
import { buildStandardPlan } from "./core/standardPlan";
import { loadInput, saveInput } from "./storage/localPlan";

export default function App() {
  const savedInput = typeof window !== "undefined" ? loadInput() : null;

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

  const result = useMemo(() => {
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

  useEffect(() => {
    setSaved(false);
  }, [result]);

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

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Evidence-based planner</p>
        <h1 className="hero-title">Last Chance</h1>
        <p className="hero-subtitle">
          A minimal fat-loss planner for calorie deficit, high-protein dieting,
          and male carb cycling.
        </p>
      </section>

      <section className="card">
        <div className="card-title">Sex</div>
        <div className="segmented two">
          <button
            className={sex === "male" ? "active" : ""}
            onClick={() => handleSexChange("male")}
            type="button"
          >
            Male
          </button>
          <button
            className={sex === "female" ? "active" : ""}
            onClick={() => handleSexChange("female")}
            type="button"
          >
            Female
          </button>
        </div>
      </section>

      {sex === "male" && (
        <section className="card">
          <div className="card-title">Plan</div>
          <div className="segmented two">
            <button
              className={planType === "standard" ? "active" : ""}
              onClick={() => setPlanType("standard")}
              type="button"
            >
              Standard
            </button>
            <button
              className={planType === "carbCycling" ? "active" : ""}
              onClick={() => setPlanType("carbCycling")}
              type="button"
            >
              Carb Cycling
            </button>
          </div>
          <p className="small-note">
            Carb cycling keeps the weekly deficit fixed and shifts carbohydrates
            toward the hardest resistance-training days.
          </p>
        </section>
      )}

      <section className="card">
        <div className="card-title">Body data</div>
        <div className="input-grid">
          <NumberField label="Age" value={age} min={18} max={80} onChange={setAge} />
          <NumberField
            label="Height cm"
            value={heightCm}
            min={130}
            max={230}
            onChange={setHeightCm}
          />
          <NumberField
            label="Weight kg"
            value={weightKg}
            min={35}
            max={250}
            step={0.1}
            onChange={setWeightKg}
          />
          <OptionalNumberField
            label="Target kg"
            value={targetWeightKg}
            min={35}
            max={250}
            step={0.1}
            onChange={setTargetWeightKg}
          />
          <div className="field">
            <label>Activity</label>
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
            label="Training days"
            value={trainingDaysPerWeek}
            min={0}
            max={6}
            onChange={setTrainingDaysPerWeek}
          />
          <div className="field">
            <label>Weekly loss %</label>
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
            label="Protein g/kg"
            value={proteinFactor}
            min={1.4}
            max={2.4}
            step={0.1}
            onChange={setProteinFactor}
          />
        </div>
        <button className="primary-button" onClick={handleSave} type="button">
          {saved ? "Saved locally" : "Save plan locally"}
        </button>
      </section>

      <section className="card accent-card">
        <div className="card-title">Result</div>
        {result.kind === "standard" ? (
          <MacroGrid data={result.daily} />
        ) : (
          <div className="cycle-stack">
            <MacroBlock title="High Carb Day" data={result.highDay} />
            <MacroBlock title="Medium Carb Day" data={result.mediumDay} />
            <MacroBlock title="Low Carb Day" data={result.lowDay} />
          </div>
        )}
        <div className="summary-line">
          <span>RMR {result.rmr} kcal</span>
          <span>TDEE {result.tdee} kcal</span>
          <span>Target loss {result.weeklyLossKg} kg/week</span>
        </div>
      </section>

      {result.kind === "carbCycling" && (
        <section className="card">
          <div className="card-title">Weekly structure</div>
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
          <p className="small-note">
            High-carb days should be assigned to the hardest sessions, not to
            uncontrolled cheat meals.
          </p>
        </section>
      )}

      {result.warnings.length > 0 && (
        <section className="card">
          <div className="card-title">Safety notes</div>
          {result.warnings.map((warning) => (
            <div className="warning" key={warning}>
              {warning}
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <div className="card-title">Install</div>
        <p className="small-note">
          iPhone: open this site in Safari, tap Share, then Add to Home Screen.
        </p>
        <p className="small-note">
          Last Chance is not medical advice. If pregnant, breastfeeding, under
          18, diagnosed with diabetes, kidney disease, eating disorder, or using
          medication affecting appetite or blood glucose, seek professional
          guidance first.
        </p>
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

function MacroGrid({ data }: { data: MacroResult }) {
  return (
    <div className="metric-grid">
      <Metric label="Calories" value={data.calories} unit="kcal" />
      <Metric label="Protein" value={data.proteinG} unit="g" />
      <Metric label="Fat" value={data.fatG} unit="g" />
      <Metric label="Carbs" value={data.carbsG} unit="g" />
    </div>
  );
}

function MacroBlock({ title, data }: { title: string; data: MacroResult }) {
  return (
    <div className="macro-block">
      <h3>{title}</h3>
      <MacroGrid data={data} />
    </div>
  );
}
