let installed = false;

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

interface ScheduleItem {
  day: string;
  type: CarbType;
  note: string;
}

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

export function installWeeklyStructureEnhancer(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;

  const enhance = () => {
    document.querySelectorAll<HTMLElement>(".card").forEach(setupWeeklyStructureCard);
  };

  enhance();
  const observer = new MutationObserver(enhance);
  observer.observe(document.body, { childList: true, subtree: true });
}

function setupWeeklyStructureCard(card: HTMLElement): void {
  const title = card.querySelector<HTMLElement>(".card-title");
  if (!title || !isWeeklyStructureTitle(title.textContent)) return;

  const rows = Array.from(card.querySelectorAll<HTMLElement>(".schedule-row"));
  if (rows.length !== 7) return;

  const isZh = title.textContent?.trim() === "一周结构";
  resetBaseItemsIfReactRenderedNewSchedule(card, rows);
  const baseItems = readBaseItems(rows);
  const signature = buildBaseSignature(baseItems);

  if (card.dataset.weeklyStructureReady !== "true") {
    card.dataset.weeklyStructureReady = "true";
    card.classList.add("weekly-structure-card");
    installHeader(card, title, isZh);
    installPanel(card, isZh);
  }

  if (card.dataset.weeklyBaseSignature !== signature) {
    card.dataset.weeklyBaseSignature = signature;
    renderAdjustedSchedule(card, rows, baseItems, isZh);
    renderFocusControls(card, baseItems, isZh);
  } else {
    renderAdjustedSchedule(card, rows, baseItems, isZh);
  }
}

function installHeader(card: HTMLElement, title: HTMLElement, isZh: boolean): void {
  if (card.querySelector(".weekly-structure-header")) return;

  const header = document.createElement("div");
  header.className = "weekly-structure-header";

  const button = document.createElement("button");
  button.className = "adjust-button";
  button.type = "button";
  button.textContent = isZh ? "调整" : "Adjust";
  button.setAttribute("aria-expanded", "false");

  title.replaceWith(header);
  header.append(title, button);

  button.addEventListener("click", () => {
    const open = card.classList.toggle("is-adjusting");
    button.setAttribute("aria-expanded", String(open));
    button.textContent = open ? (isZh ? "完成" : "Done") : (isZh ? "调整" : "Adjust");
  });
}

function installPanel(card: HTMLElement, isZh: boolean): void {
  if (card.querySelector(".schedule-adjust-panel")) return;

  const copy = getCopy(isZh);
  const panel = document.createElement("div");
  panel.className = "schedule-adjust-panel";
  panel.innerHTML = `
    <div class="schedule-adjust-section">
      <div>
        <strong>${copy.rotationTitle}</strong>
        <p>${copy.rotationNote}</p>
      </div>
      <div class="rotation-controls">
        <button type="button" data-shift="earlier">← ${copy.earlier}</button>
        <span data-rotation-label>${copy.rotation} ${formatRotation(loadRotationOffset())}</span>
        <button type="button" data-shift="later">${copy.later} →</button>
      </div>
    </div>
    <div class="schedule-adjust-section">
      <div>
        <strong>${copy.focusTitle}</strong>
        <p>${copy.focusNote}</p>
      </div>
      <div class="focus-grid"></div>
    </div>
    <button class="reset-adjustments" type="button">${copy.reset}</button>
  `;

  const dayCounts = card.querySelector(".day-counts");
  dayCounts?.after(panel);

  panel.querySelector<HTMLButtonElement>('[data-shift="earlier"]')?.addEventListener("click", () => {
    saveRotationOffset(loadRotationOffset() - 1);
    refreshCard(card, isZh);
  });

  panel.querySelector<HTMLButtonElement>('[data-shift="later"]')?.addEventListener("click", () => {
    saveRotationOffset(loadRotationOffset() + 1);
    refreshCard(card, isZh);
  });

  panel.querySelector<HTMLButtonElement>(".reset-adjustments")?.addEventListener("click", () => {
    saveRotationOffset(0);
    saveFocusByDay({});
    refreshCard(card, isZh);
  });
}

function refreshCard(card: HTMLElement, isZh: boolean): void {
  const rows = Array.from(card.querySelectorAll<HTMLElement>(".schedule-row"));
  const baseItems = readBaseItems(rows);
  renderAdjustedSchedule(card, rows, baseItems, isZh);
  renderFocusControls(card, baseItems, isZh);
}

function renderFocusControls(card: HTMLElement, baseItems: ScheduleItem[], isZh: boolean): void {
  const grid = card.querySelector<HTMLElement>(".focus-grid");
  if (!grid) return;

  const focusByDay = loadFocusByDay();
  const nextSignature = `${isZh ? "zh" : "en"}|${buildBaseSignature(baseItems)}|${JSON.stringify(focusByDay)}`;
  if (grid.dataset.focusSignature === nextSignature) return;

  grid.dataset.focusSignature = nextSignature;
  grid.innerHTML = "";

  baseItems.forEach((item) => {
    const focusKey = focusByDay[item.day] ?? inferTrainingFocus(item.note);
    const label = document.createElement("label");
    label.className = "focus-row";

    const day = document.createElement("span");
    day.textContent = item.day;

    const select = document.createElement("select");
    select.value = focusKey;

    TRAINING_OPTIONS.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option;
      optionElement.textContent = getFocusLabel(option, isZh);
      select.append(optionElement);
    });

    select.addEventListener("change", () => {
      const nextFocus = loadFocusByDay();
      nextFocus[item.day] = select.value as TrainingFocusKey;
      saveFocusByDay(nextFocus);
      refreshCard(card, isZh);
    });

    label.append(day, select);
    grid.append(label);
  });
}

function renderAdjustedSchedule(
  card: HTMLElement,
  rows: HTMLElement[],
  baseItems: ScheduleItem[],
  isZh: boolean
): void {
  const types = rotateCarbTypes(baseItems.map((item) => item.type), loadRotationOffset());
  const focusByDay = loadFocusByDay();
  const rotationLabel = card.querySelector<HTMLElement>("[data-rotation-label]");
  const copy = getCopy(isZh);

  setTextIfChanged(rotationLabel, `${copy.rotation} ${formatRotation(loadRotationOffset())}`);

  rows.forEach((row, index) => {
    const item = baseItems[index];
    const type = types[index];
    const focusKey = focusByDay[item.day] ?? inferTrainingFocus(item.note);
    const typeElement = row.querySelector<HTMLElement>(".day-type");
    const noteElement = row.querySelector<HTMLElement>(".small-note");

    setTextIfChanged(typeElement, type);
    if (typeElement) typeElement.className = `day-type ${type.toLowerCase()}`;
    setTextIfChanged(noteElement, getFocusLabel(focusKey, isZh));
  });

  card.dataset.renderedAdjustedSignature = buildCurrentRenderedSignature(rows);
}

function readBaseItems(rows: HTMLElement[]): ScheduleItem[] {
  return rows.map((row) => {
    const day = row.querySelector("strong")?.textContent?.trim() || "";
    const currentType = row.querySelector(".day-type")?.textContent?.trim() as CarbType;
    const currentNote = row.querySelector(".small-note")?.textContent?.trim() || "";

    if (!row.dataset.baseDay) row.dataset.baseDay = day;
    if (!row.dataset.baseType) row.dataset.baseType = currentType;
    if (!row.dataset.baseNote) row.dataset.baseNote = currentNote;

    return {
      day: row.dataset.baseDay,
      type: row.dataset.baseType as CarbType,
      note: row.dataset.baseNote
    };
  });
}

function resetBaseItemsIfReactRenderedNewSchedule(card: HTMLElement, rows: HTMLElement[]): void {
  const renderedSignature = buildCurrentRenderedSignature(rows);
  const previousAdjustedSignature = card.dataset.renderedAdjustedSignature;

  if (!previousAdjustedSignature || renderedSignature === previousAdjustedSignature) return;

  rows.forEach((row) => {
    delete row.dataset.baseDay;
    delete row.dataset.baseType;
    delete row.dataset.baseNote;
  });

  delete card.dataset.weeklyBaseSignature;
}

function buildCurrentRenderedSignature(rows: HTMLElement[]): string {
  return rows
    .map((row) => {
      const day = row.querySelector("strong")?.textContent?.trim() || "";
      const type = row.querySelector(".day-type")?.textContent?.trim() || "";
      const note = row.querySelector(".small-note")?.textContent?.trim() || "";
      return `${day}:${type}:${note}`;
    })
    .join("|");
}

function setTextIfChanged(element: HTMLElement | null, value: string): void {
  if (element && element.textContent !== value) element.textContent = value;
}

function rotateCarbTypes(types: CarbType[], offset: number): CarbType[] {
  if (types.length === 0) return types;
  const normalizedOffset = ((offset % types.length) + types.length) % types.length;
  return types.map((_, index) => types[(index - normalizedOffset + types.length) % types.length]);
}

function inferTrainingFocus(note: string): TrainingFocusKey {
  const normalized = note.toLowerCase();

  if (normalized.includes("deadlift") || normalized.includes("back") || normalized.includes("硬拉") || normalized.includes("背")) return "backDeadlift";
  if (normalized.includes("legs") || normalized.includes("腿")) return "heavyLegs";
  if (normalized.includes("upper") || normalized.includes("上肢")) return "upperBody";
  if (normalized.includes("full") || normalized.includes("全身")) return "fullBody";
  if (normalized.includes("accessory") || normalized.includes("辅助")) return "accessoryCardio";
  if (normalized.includes("light cardio") || normalized.includes("轻有氧")) return "lightCardio";
  if (normalized.includes("walk") || normalized.includes("recovery") || normalized.includes("步行") || normalized.includes("恢复")) return "walkRecovery";
  if (normalized.includes("rest") || normalized.includes("休息")) return "rest";
  return "strength";
}

function getFocusLabel(focusKey: TrainingFocusKey, isZh: boolean): string {
  return FOCUS_LABELS[focusKey][isZh ? "zh" : "en"];
}

function loadRotationOffset(): number {
  const value = Number(window.localStorage.getItem(ROTATION_KEY) ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function saveRotationOffset(offset: number): void {
  window.localStorage.setItem(ROTATION_KEY, String(offset));
}

function loadFocusByDay(): Record<string, TrainingFocusKey> {
  try {
    const value = JSON.parse(window.localStorage.getItem(FOCUS_KEY) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function saveFocusByDay(value: Record<string, TrainingFocusKey>): void {
  window.localStorage.setItem(FOCUS_KEY, JSON.stringify(value));
}

function formatRotation(offset: number): string {
  if (offset === 0) return "0";
  return offset > 0 ? `+${offset}` : String(offset);
}

function buildBaseSignature(items: ScheduleItem[]): string {
  return items.map((item) => `${item.day}:${item.type}:${item.note}`).join("|");
}

function isWeeklyStructureTitle(value: string | null): boolean {
  const title = value?.trim();
  return title === "Weekly structure" || title === "一周结构";
}

function getCopy(isZh: boolean) {
  if (isZh) {
    return {
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
    rotationTitle: "Carb day rotation",
    rotationNote: "Dates stay fixed. Only the high / medium / low sequence rotates so high-carb days can match real hard sessions.",
    earlier: "Earlier",
    later: "Later",
    rotation: "Offset",
    focusTitle: "Training focus",
    focusNote: "Training focus can be changed for each fixed day without moving the date order.",
    reset: "Reset default structure"
  };
}
