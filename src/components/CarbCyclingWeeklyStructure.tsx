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

type FocusByDay = Record<string, TrainingFocusKey>;

const ROTATION_KEY = "last_chance_carb_rotation_offset";
const FOCUS_KEY = "last_chance_training_focus_by_day";
const SWIPE_THRESHOLD_PX = 34;

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

export default function CarbCyclingWeeklyStructure({
  result,
  labels
}: {
  result: CarbCyclingPlanResult;
  labels: Labels;
}) {
  const isZh = labels.weeklyStructure === "一周结构";
  const copy = getCopy(isZh);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [rotationOffset, setRotationOffset] = useState(loadRotationOffset);
  const [focusByDay, setFocusByDay] = useState<FocusByDay>(loadFocusByDay);
  const [swipeStart, setSwipeStart] = useState<{ y: number; offset: number } | null>(null);

  useEffect(() => {
    window.localStorage.setItem(ROTATION_KEY, String(rotationOffset));
  }, [rotationOffset]);

  useEffect(() => {
    window.localStorage.setItem(FOCUS_KEY, JSON.stringify(focusByDay));
  }, [focusByDay]);

  useEffect(() => {
    document.body.classList.toggle("weekly-adjust-open", isEditorOpen);
    return () => document.body.classList.remove("weekly-adjust-open");
  }, [isEditorOpen]);

  useEffect(() => {
    if (!isEditorOpen) return;

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsEditorOpen(false);
      if (event.key === "ArrowUp") setRotationOffset((value) => value - 1);
      if (event.key === "ArrowDown") setRotationOffset((value) => value + 1);
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [isEditorOpen]);

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

  function handleFocusChange(day: string, focusKey: TrainingFocusKey) {
    setFocusByDay((current) => ({ ...current, [day]: focusKey }));
  }

  function resetAdjustments() {
    setRotationOffset(0);
    setFocusByDay({});
  }

  function beginSwipe(clientY: number) {
    setSwipeStart({ y: clientY, offset: rotationOffset });
  }

  function moveSwipe(clientY: number) {
    if (!swipeStart) return;
    const delta = Math.trunc((clientY - swipeStart.y) / SWIPE_THRESHOLD_PX);
    const nextOffset = swipeStart.offset + delta;
    if (nextOffset !== rotationOffset) setRotationOffset(nextOffset);
  }

  function endSwipe() {
    setSwipeStart(null);
  }

  return (
    <section className="card weekly-structure-card">
      <div className="weekly-structure-header">
        <div className="card-title">{labels.weeklyStructure}</div>
        <button
          className="adjust-button"
          type="button"
          aria-haspopup="dialog"
          onClick={() => setIsEditorOpen(true)}
        >
          {isZh ? "调整" : "Adjust"}
        </button>
      </div>

      <div className="day-counts">
        <span>{result.dayCounts.high} high</span>
        <span>{result.dayCounts.medium} medium</span>
        <span>{result.dayCounts.low} low</span>
      </div>

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

      {isEditorOpen && (
        <div className="weekly-adjust-overlay" role="dialog" aria-modal="true" aria-label={copy.editorTitle}>
          <button className="weekly-adjust-backdrop" type="button" aria-label={copy.done} onClick={() => setIsEditorOpen(false)} />
          <div className="weekly-adjust-modal">
            <div className="weekly-adjust-modal-header">
              <div>
                <strong>{copy.editorTitle}</strong>
                <span>{copy.editorHint}</span>
              </div>
              <button className="weekly-adjust-done" type="button" onClick={() => setIsEditorOpen(false)}>
                {copy.done}
              </button>
            </div>

            <div className={`weekly-adjust-grid ${swipeStart ? "is-swiping" : ""}`}>
              <span>{copy.date}</span>
              <span>{copy.carb}</span>
              <span>{copy.focus}</span>

              {adjustedSchedule.map((row) => (
                <div className="weekly-adjust-row-fragment" key={row.day}>
                  <div className="weekly-date-cell">{row.day}</div>
                  <button
                    className={`weekly-carb-cell ${row.type.toLowerCase()}`}
                    type="button"
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      beginSwipe(event.clientY);
                    }}
                    onPointerMove={(event) => moveSwipe(event.clientY)}
                    onPointerUp={endSwipe}
                    onPointerCancel={endSwipe}
                    onWheel={(event) => {
                      event.preventDefault();
                      setRotationOffset((value) => value + (event.deltaY > 0 ? 1 : -1));
                    }}
                  >
                    {row.type}
                  </button>
                  <select
                    className="weekly-focus-select"
                    value={row.focusKey}
                    onChange={(event) => handleFocusChange(row.day, event.target.value as TrainingFocusKey)}
                  >
                    {TRAINING_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {getFocusLabel(option, isZh)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="weekly-adjust-tools">
              <button type="button" aria-label={copy.moveUp} onClick={() => setRotationOffset((value) => value - 1)}>↑</button>
              <button type="button" aria-label={copy.moveDown} onClick={() => setRotationOffset((value) => value + 1)}>↓</button>
              <button type="button" onClick={resetAdjustments}>{copy.reset}</button>
            </div>
          </div>
        </div>
      )}
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

function loadFocusByDay(): FocusByDay {
  if (typeof window === "undefined") return {};

  try {
    const value = JSON.parse(window.localStorage.getItem(FOCUS_KEY) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function getCopy(isZh: boolean) {
  if (isZh) {
    return {
      editorTitle: "调整一周结构",
      editorHint: "日期固定；上下滑动碳水列进行循环微调。",
      done: "完成",
      reset: "恢复默认",
      date: "日期",
      carb: "碳水",
      focus: "训练部位",
      moveUp: "上移碳水序列",
      moveDown: "下移碳水序列"
    };
  }

  return {
    editorTitle: "Adjust weekly structure",
    editorHint: "Dates stay fixed; swipe the carb column to rotate the sequence.",
    done: "Done",
    reset: "Reset",
    date: "Date",
    carb: "Carb",
    focus: "Training Focus",
    moveUp: "Move carb sequence up",
    moveDown: "Move carb sequence down"
  };
}
