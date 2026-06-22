import { useEffect, useMemo, useState } from "react";
import type { CarbCyclingPlanResult } from "../core/types";

type CarbType = "High" | "Medium" | "Low";
type TrainingFocusKey =
  | "heavyLegs"
  | "backDeadlift"
  | "upperBody"
  | "push"
  | "pull"
  | "fullBody"
  | "strength"
  | "accessoryCardio"
  | "lightCardio"
  | "walkRecovery"
  | "rest";

type Labels = {
  weeklyStructure: string;
  highNote: string;
};

type TrainingFocusByDay = Record<string, TrainingFocusKey>;

const ROTATION_KEY = "last_chance_carb_rotation_offset";
const FOCUS_KEY = "last_chance_training_focus_by_day";

const TRAINING_OPTIONS: TrainingFocusKey[] = [
  "heavyLegs",
  "backDeadlift",
  "upperBody",
  "push",
  "pull",
  "fullBody",
  "strength",
  "accessoryCardio",
  "lightCardio",
  "walkRecovery",
  "rest"
];

const FOCUS_LABELS: Record<TrainingFocusKey, { en: string; zh: string }> = {
  heavyLegs: { en: "Heavy legs", zh: "重腿训练" },
  backDeadlift: { en: "Back / deadlift", zh: "背部 / 硬拉" },
  upperBody: { en: "Upper body", zh: "上肢训练" },
  push: { en: "Push", zh: "推类训练" },
  pull: { en: "Pull", zh: "拉类训练" },
  fullBody: { en: "Full body", zh: "全身训练" },
  strength: { en: "Strength session", zh: "力量训练" },
  accessoryCardio: { en: "Accessory / cardio", zh: "辅助 / 有氧" },
  lightCardio: { en: "Light cardio", zh: "轻有氧" },
  walkRecovery: { en: "Walk / recovery", zh: "步行 / 恢复" },
  rest: { en: "Rest", zh: "休息" }
};

export default function WeeklyStructureAdjuster({
  result,
  labels
}: {
  result: CarbCyclingPlanResult;
  labels: Labels;
}) {
  const isZh = labels.weeklyStructure === "一周结构";
  const copy = getCopy(isZh);
  const [isOpen, setIsOpen] = useState(false);
  const [rotationOffset, setRotationOffset] = useState(loadRotationOffset);
  const [focusByDay, setFocusByDay] = useState<TrainingFocusByDay>(loadFocusByDay);

  useEffect(() => {
    window.localStorage.setItem(ROTATION_KEY, String(rotationOffset));
  }, [rotationOffset]);

  useEffect(() => {
    window.localStorage.setItem(FOCUS_KEY, JSON.stringify(focusByDay));
  }, [focusByDay]);

  const adjustedSchedule = useMemo(() => {
    const carbTypes = result.weeklySchedule.map((row) => row.type);
    const rotatedTypes = rotateCarbTypes(carbTypes, rotationOffset);

    return result.weeklySchedule.map((row, index) => {
      const focusKey = focusByDay[row.day] ?? inferTrainingFocus(row.note);
      return {
        day: row.day,
        type: rotatedTypes[index],
        focusKey,
        note: getFocusLabel(focusKey, isZh)
      };
    });
  }, [focusByDay, isZh, result.weeklySchedule, rotationOffset]);

  function shiftEarlier() {
    setRotationOffset((value) => value - 1);
  }

  function shiftLater() {
    setRotationOffset((value) => value + 1);
  }

  function resetAdjustments() {
    setRotationOffset(0);
    setFocusByDay({});
  }

  function updateFocus(day: string, focusKey: TrainingFocusKey) {
    setFocusByDay((current) => ({ ...current, [day]: focusKey }));
  }

  return (
    <section className="card weekly-structure-card">
      <div className="card-title-row">
        <div className="card-title">{labels.weeklyStructure}</div>
        <button
          className="adjust-button"
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
        >
          {isOpen ? copy.done : copy.adjust}
        </button>
      </div>

      <div className="day-counts">
        <span>{result.dayCounts.high} high</span>
        <span>{result.dayCounts.medium} medium</span>
        <span>{result.dayCounts.low} low</span>
      </div>

      {isOpen && (
        <div className="schedule-adjust-panel">
          <div className="schedule-adjust-section">
            <div>
              <strong>{copy.rotationTitle}</strong>
              <p>{copy.rotationNote}</p>
            </div>
            <div className="rotation-controls">
              <button type="button" onClick={shiftEarlier}>← {copy.earlier}</button>
              <span>{copy.rotation} {formatRotation(rotationOffset)}</span>
              <button type="button" onClick={shiftLater}>{copy.later} →</button>
            </div>
          </div>

          <div className="schedule-adjust-section">
            <div>
              <strong>{copy.focusTitle}</strong>
              <p>{copy.focusNote}</p>
            </div>
            <div className="focus-grid">
              {adjustedSchedule.map((row) => (
                <label className="focus-row" key={`focus-${row.day}`}>
                  <span>{row.day}</span>
                  <select
                    value={row.focusKey}
                    onChange={(event) => updateFocus(row.day, event.target.value as TrainingFocusKey)}
                  >
                    {TRAINING_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {getFocusLabel(option, isZh)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <button className="reset-adjustments" type="button" onClick={resetAdjustments}>
            {copy.reset}
          </button>
        </div>
      )}

      <div className="schedule-stack">
        {adjustedSchedule.map((row) => (
          <div className="schedule-row" key={row.day}>
            <strong>{row.day}</strong>
            <span className={`day-type ${row.type.toLowerCase()}`}>{row.type}</span>
            <span className="small-note">{row.note}</span>
          </div>
        ))}
      </div>

      <p className="small-note">{labels.highNote}</p>
    </section>
  );
}

function rotateCarbTypes(types: CarbType[], offset: number): CarbType[] {
  if (types.length === 0) return types;
  const normalizedOffset = ((offset % types.length) + types.length) % types.length;
  return types.map((_, index) => types[(index - normalizedOffset + types.length) % types.length]);
}

function inferTrainingFocus(note: string): TrainingFocusKey {
  const normalized = note.toLowerCase();

  if (normalized.includes("deadlift") || normalized.includes("back")) return "backDeadlift";
  if (normalized.includes("legs")) return "heavyLegs";
  if (normalized.includes("upper")) return "upperBody";
  if (normalized.includes("full")) return "fullBody";
  if (normalized.includes("accessory")) return "accessoryCardio";
  if (normalized.includes("light cardio")) return "lightCardio";
  if (normalized.includes("walk") || normalized.includes("recovery")) return "walkRecovery";
  if (normalized.includes("rest")) return "rest";
  return "strength";
}

function getFocusLabel(focusKey: TrainingFocusKey, isZh: boolean): string {
  return FOCUS_LABELS[focusKey][isZh ? "zh" : "en"];
}

function loadRotationOffset(): number {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(ROTATION_KEY) ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function loadFocusByDay(): TrainingFocusByDay {
  if (typeof window === "undefined") return {};

  try {
    const value = JSON.parse(window.localStorage.getItem(FOCUS_KEY) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function formatRotation(offset: number): string {
  if (offset === 0) return "0";
  return offset > 0 ? `+${offset}` : String(offset);
}

function getCopy(isZh: boolean) {
  if (isZh) {
    return {
      adjust: "调整",
      done: "完成",
      rotationTitle: "碳水日循环位移",
      rotationNote: "日期固定不动，只移动高 / 中 / 低碳日的排列，让高碳日对齐真正的重训练日。",
      earlier: "提前",
      later: "延后",
      rotation: "当前位移",
      focusTitle: "训练部位",
      focusNote: "每个日期的训练部位可以独立调整，不改变日期顺序。",
      reset: "恢复默认结构"
    };
  }

  return {
    adjust: "Adjust",
    done: "Done",
    rotationTitle: "Carb day rotation",
    rotationNote: "Dates stay fixed. Only the high / medium / low sequence rotates so high-carb days can match your real hard sessions.",
    earlier: "Earlier",
    later: "Later",
    rotation: "Offset",
    focusTitle: "Training focus",
    focusNote: "Training focus can be changed for each fixed day without moving the date order.",
    reset: "Reset default structure"
  };
}
