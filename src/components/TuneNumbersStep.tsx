import type { CSSProperties, ReactNode } from "react";
import type { AppCopy, Language } from "../core/appCopy";

interface TimelineRiskView {
  status: "empty" | "maintain" | "safe" | "standard" | "aggressive" | "high" | "blocked";
  title: string;
  detail: string;
  blocked: boolean;
}

interface TuneNumbersStepProps {
  labels: AppCopy;
  language: Language;
  weightKg: number;
  targetWeightKg: number;
  expectedTimelineWeeks: number;
  age: number;
  heightCm: number;
  trainingDaysPerWeek: number;
  proteinFactor: number;
  timelineRisk: TimelineRiskView;
  onWeightChange: (value: number) => void;
  onTargetWeightChange: (value: number) => void;
  onExpectedTimelineChange: (value: number) => void;
  onAgeChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onTrainingDaysChange: (value: number) => void;
  onProteinChange: (value: number) => void;
}

const tuneCopy = {
  en: {
    bodyData: "Body data",
    weight: "Weight",
    target: "Target",
    timeline: "Timeline",
    tooShort: "Timeline too short",
    aggressive: "Aggressive range",
    standard: "Standard range",
    conservative: "Conservative range",
    age: "Age",
    height: "Height",
    training: "Training days",
    protein: "Protein"
  },
  zh: {
    bodyData: "身体数据",
    weight: "体重",
    target: "目标",
    timeline: "周期",
    tooShort: "时间过短",
    aggressive: "激进区间",
    standard: "标准区间",
    conservative: "保守区间",
    age: "年龄",
    height: "身高",
    training: "训练天数",
    protein: "蛋白"
  }
} as const;

export function TuneNumbersStep({
  labels,
  language,
  weightKg,
  targetWeightKg,
  expectedTimelineWeeks,
  age,
  heightCm,
  trainingDaysPerWeek,
  proteinFactor,
  timelineRisk,
  onWeightChange,
  onTargetWeightChange,
  onExpectedTimelineChange,
  onAgeChange,
  onHeightChange,
  onTrainingDaysChange,
  onProteinChange
}: TuneNumbersStepProps) {
  const t = tuneCopy[language];

  return (
    <div className="setup-step-pane tune-numbers-pane" key="body-step">
      <div className="setup-step-copy">
        <strong>{labels.stepBodyTitle}</strong>
        <span>{labels.stepBodyDetail}</span>
      </div>
      <section className="tune-numbers-stack" aria-label={t.bodyData}>
        <div className="tune-primary-stack">
          <TunePrimaryCard title={t.weight} value={weightKg} suffix="kg" min={35} max={170} step={0.1} onChange={onWeightChange} />
          <TunePrimaryCard title={t.target} value={targetWeightKg} suffix="kg" min={35} max={170} step={0.1} onChange={onTargetWeightChange} />
          <TunePrimaryCard title={t.timeline} value={expectedTimelineWeeks} suffix="weeks" min={1} max={86} step={1} onChange={onExpectedTimelineChange} footer={<TimelineRiskStrip risk={timelineRisk} labels={t} />} />
        </div>
        <div className="tune-secondary-grid" aria-label="Secondary body settings">
          <TuneCompactStepper title={t.age} value={age} suffix="years" min={14} max={65} step={1} onChange={onAgeChange} />
          <TuneCompactStepper title={t.height} value={heightCm} suffix="cm" min={130} max={230} step={1} onChange={onHeightChange} />
          <TuneCompactStepper title={t.training} value={trainingDaysPerWeek} suffix="/wk" min={0} max={7} step={1} onChange={onTrainingDaysChange} />
          <TuneCompactStepper title={t.protein} value={proteinFactor} suffix="g/kg" min={1.4} max={2.4} step={0.1} onChange={onProteinChange} />
        </div>
      </section>
    </div>
  );
}

function TunePrimaryCard({ title, value, suffix, min, max, step, footer, onChange }: { title: string; value: number; suffix: string; min: number; max: number; step: number; footer?: ReactNode; onChange: (value: number) => void }) {
  const safeValue = clampNumber(value, min, max, step);
  const displayValue = formatNumber(safeValue, step);

  return (
    <article className="tune-control-card tune-control-card-primary">
      <div className="tune-card-head">
        <span className="tune-card-title">{title}</span>
        <strong className="tune-card-value">{displayValue}<em>{suffix}</em></strong>
      </div>
      <div className="tune-slider-row">
        <button className="tune-round-stepper" type="button" onClick={() => onChange(clampNumber(safeValue - step, min, max, step))}>−</button>
        <div className="tune-slider-shell">
          <input className="tune-premium-range" type="range" min={min} max={max} step={step} value={safeValue} style={{ "--tune-progress": `${progressPercent(safeValue, min, max)}%` } as CSSProperties} onChange={(event) => onChange(clampNumber(Number(event.target.value), min, max, step))} />
          <div className="tune-slider-scale"><span>{formatNumber(min, step)}</span><span>{displayValue}</span><span>{formatNumber(max, step)}</span></div>
        </div>
        <button className="tune-round-stepper" type="button" onClick={() => onChange(clampNumber(safeValue + step, min, max, step))}>+</button>
      </div>
      {footer}
    </article>
  );
}

function TimelineRiskStrip({ risk, labels }: { risk: TimelineRiskView; labels: typeof tuneCopy.en | typeof tuneCopy.zh }) {
  const riskClass = risk.status === "blocked" ? "blocked" : risk.status === "aggressive" || risk.status === "high" ? "aggressive" : risk.status === "standard" ? "standard" : "safe";

  return (
    <div className={`tune-risk-strip risk-${riskClass}`}>
      <div className="tune-risk-gradient" aria-hidden="true">
        <span>{labels.tooShort}</span><span>{labels.aggressive}</span><span>{labels.standard}</span><span>{labels.conservative}</span><i />
      </div>
      <div className="tune-risk-copy"><strong>{risk.title}</strong><span>{risk.detail}</span></div>
    </div>
  );
}

function TuneCompactStepper({ title, value, suffix, min, max, step, onChange }: { title: string; value: number; suffix: string; min: number; max: number; step: number; onChange: (value: number) => void }) {
  const safeValue = clampNumber(value, min, max, step);
  return (
    <div className="tune-compact-stepper">
      <span>{title}</span>
      <div className="tune-compact-controls">
        <button type="button" onClick={() => onChange(clampNumber(safeValue - step, min, max, step))}>−</button>
        <strong>{formatNumber(safeValue, step)}<em>{suffix}</em></strong>
        <button type="button" onClick={() => onChange(clampNumber(safeValue + step, min, max, step))}>+</button>
      </div>
    </div>
  );
}

function clampNumber(value: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, value));
  return Number(clamped.toFixed(decimalsForStep(step)));
}

function formatNumber(value: number, step: number): string {
  return value.toFixed(decimalsForStep(step));
}

function decimalsForStep(step: number): number {
  const value = String(step);
  return value.includes(".") ? value.split(".")[1].length : 0;
}

function progressPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}
