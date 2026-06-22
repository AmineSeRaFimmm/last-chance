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

interface AdjustedScheduleItem extends ScheduleItem {
  focusKey: TrainingFocusKey;
}

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
  }

  if (card.dataset.weeklyBaseSignature !== signature) {
    card.dataset.weeklyBaseSignature = signature;
  }

  renderAdjustedSchedule(card, rows, baseItems, isZh);
}

function installHeader(card: HTMLElement, title: HTMLElement, isZh: boolean): void {
  if (card.querySelector(".weekly-structure-header")) return;

  const header = document.createElement("div");
  header.className = "weekly-structure-header";

  const button = document.createElement("button");
  button.className = "adjust-button";
  button.type = "button";
  button.textContent = isZh ? "调整" : "Adjust";
  button.setAttribute("aria-haspopup", "dialog");

  title.replaceWith(header);
  header.append(title, button);

  button.addEventListener("click", () => {
    const rows = Array.from(card.querySelectorAll<HTMLElement>(".schedule-row"));
    const baseItems = readBaseItems(rows);
    openWeeklyStructureEditor(card, baseItems, isZh);
  });
}

function openWeeklyStructureEditor(card: HTMLElement, baseItems: ScheduleItem[], isZh: boolean): void {
  document.querySelector(".weekly-adjust-overlay")?.remove();
  const copy = getCopy(isZh);
  let startY = 0;
  let startOffset = loadRotationOffset();
  let activePointerId: number | null = null;

  const overlay = document.createElement("div");
  overlay.className = "weekly-adjust-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", copy.editorTitle);

  const backdrop = document.createElement("button");
  backdrop.className = "weekly-adjust-backdrop";
  backdrop.type = "button";
  backdrop.setAttribute("aria-label", copy.done);

  const panel = document.createElement("div");
  panel.className = "weekly-adjust-modal";

  const header = document.createElement("div");
  header.className = "weekly-adjust-modal-header";

  const titleBlock = document.createElement("div");
  const editorTitle = document.createElement("strong");
  editorTitle.textContent = copy.editorTitle;
  const editorHint = document.createElement("span");
  editorHint.textContent = copy.editorHint;
  titleBlock.append(editorTitle, editorHint);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "weekly-adjust-done";
  closeButton.textContent = copy.done;

  const grid = document.createElement("div");
  grid.className = "weekly-adjust-grid";

  const close = () => {
    document.body.classList.remove("weekly-adjust-open");
    overlay.classList.add("is-closing");
    window.setTimeout(() => overlay.remove(), 160);
    document.removeEventListener("keydown", handleKeydown);
  };

  const rerender = () => {
    renderEditorGrid(grid, card, baseItems, isZh, beginSwipe, moveSwipe, endSwipe);
    renderAdjustedSchedule(card, Array.from(card.querySelectorAll<HTMLElement>(".schedule-row")), baseItems, isZh);
  };

  const shiftBy = (delta: number) => {
    saveRotationOffset(loadRotationOffset() + delta);
    rerender();
  };

  function beginSwipe(event: PointerEvent): void {
    activePointerId = event.pointerId;
    startY = event.clientY;
    startOffset = loadRotationOffset();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    grid.classList.add("is-swiping");
  }

  function moveSwipe(event: PointerEvent): void {
    if (activePointerId !== event.pointerId) return;
    const offset = Math.trunc((event.clientY - startY) / SWIPE_THRESHOLD_PX);
    const nextOffset = startOffset + offset;

    if (nextOffset !== loadRotationOffset()) {
      saveRotationOffset(nextOffset);
      rerender();
    }
  }

  function endSwipe(event: PointerEvent): void {
    if (activePointerId !== event.pointerId) return;
    activePointerId = null;
    grid.classList.remove("is-swiping");
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") close();
    if (event.key === "ArrowUp") shiftBy(-1);
    if (event.key === "ArrowDown") shiftBy(1);
  }

  const tools = document.createElement("div");
  tools.className = "weekly-adjust-tools";

  const upButton = document.createElement("button");
  upButton.type = "button";
  upButton.textContent = "↑";
  upButton.setAttribute("aria-label", copy.moveUp);
  upButton.addEventListener("click", () => shiftBy(-1));

  const downButton = document.createElement("button");
  downButton.type = "button";
  downButton.textContent = "↓";
  downButton.setAttribute("aria-label", copy.moveDown);
  downButton.addEventListener("click", () => shiftBy(1));

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.textContent = copy.reset;
  resetButton.addEventListener("click", () => {
    saveRotationOffset(0);
    saveFocusByDay({});
    rerender();
  });

  tools.append(upButton, downButton, resetButton);
  header.append(titleBlock, closeButton);
  panel.append(header, grid, tools);
  overlay.append(backdrop, panel);
  document.body.append(overlay);
  document.body.classList.add("weekly-adjust-open");

  backdrop.addEventListener("click", close);
  closeButton.addEventListener("click", close);
  document.addEventListener("keydown", handleKeydown);

  rerender();
}

function renderEditorGrid(
  grid: HTMLElement,
  card: HTMLElement,
  baseItems: ScheduleItem[],
  isZh: boolean,
  beginSwipe: (event: PointerEvent) => void,
  moveSwipe: (event: PointerEvent) => void,
  endSwipe: (event: PointerEvent) => void
): void {
  const copy = getCopy(isZh);
  const adjustedItems = buildAdjustedItems(baseItems, isZh);
  grid.innerHTML = "";

  const dateHead = document.createElement("span");
  dateHead.textContent = copy.date;
  const carbHead = document.createElement("span");
  carbHead.textContent = copy.carb;
  const focusHead = document.createElement("span");
  focusHead.textContent = copy.focus;
  grid.append(dateHead, carbHead, focusHead);

  adjustedItems.forEach((item) => {
    const dayCell = document.createElement("div");
    dayCell.className = "weekly-date-cell";
    dayCell.textContent = item.day;

    const carbCell = document.createElement("button");
    carbCell.className = `weekly-carb-cell ${item.type.toLowerCase()}`;
    carbCell.type = "button";
    carbCell.textContent = item.type;
    carbCell.addEventListener("pointerdown", beginSwipe);
    carbCell.addEventListener("pointermove", moveSwipe);
    carbCell.addEventListener("pointerup", endSwipe);
    carbCell.addEventListener("pointercancel", endSwipe);
    carbCell.addEventListener("wheel", (event) => {
      event.preventDefault();
      saveRotationOffset(loadRotationOffset() + (event.deltaY > 0 ? 1 : -1));
      renderEditorGrid(grid, card, baseItems, isZh, beginSwipe, moveSwipe, endSwipe);
      renderAdjustedSchedule(card, Array.from(card.querySelectorAll<HTMLElement>(".schedule-row")), baseItems, isZh);
    }, { passive: false });

    const select = document.createElement("select");
    select.className = "weekly-focus-select";
    select.value = item.focusKey;
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
      renderEditorGrid(grid, card, baseItems, isZh, beginSwipe, moveSwipe, endSwipe);
      renderAdjustedSchedule(card, Array.from(card.querySelectorAll<HTMLElement>(".schedule-row")), baseItems, isZh);
    });

    grid.append(dayCell, carbCell, select);
  });
}

function renderAdjustedSchedule(
  card: HTMLElement,
  rows: HTMLElement[],
  baseItems: ScheduleItem[],
  isZh: boolean
): void {
  const adjustedItems = buildAdjustedItems(baseItems, isZh);

  rows.forEach((row, index) => {
    const item = adjustedItems[index];
    const typeElement = row.querySelector<HTMLElement>(".day-type");
    const noteElement = row.querySelector<HTMLElement>(".small-note");

    setTextIfChanged(typeElement, item.type);
    if (typeElement) typeElement.className = `day-type ${item.type.toLowerCase()}`;
    setTextIfChanged(noteElement, getFocusLabel(item.focusKey, isZh));
  });

  card.dataset.renderedAdjustedSignature = buildCurrentRenderedSignature(rows);
}

function buildAdjustedItems(baseItems: ScheduleItem[], isZh: boolean): AdjustedScheduleItem[] {
  const rotatedTypes = rotateCarbTypes(baseItems.map((item) => item.type), loadRotationOffset());
  const focusByDay = loadFocusByDay();

  return baseItems.map((item, index) => ({
    ...item,
    type: rotatedTypes[index],
    focusKey: focusByDay[item.day] ?? inferTrainingFocus(item.note)
  }));
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
