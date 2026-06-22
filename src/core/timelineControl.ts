let installed = false;

const TIMELINE_KEY = "last_chance_expected_timeline_weeks";
const DEFAULT_WEEKS = 12;
const MIN_WEEKS = 1;
const MAX_WEEKS = 156;
const HARD_LIMIT_RATE = 0.02;

interface TimelineRisk {
  status: "empty" | "maintain" | "safe" | "standard" | "aggressive" | "high" | "blocked";
  title: string;
  detail: string;
  blocked: boolean;
}

export function installTimelineControl(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;

  const enhance = () => setupTimelineControl();
  enhance();

  const observer = new MutationObserver(enhance);
  observer.observe(document.body, { childList: true, subtree: true });
}

function setupTimelineControl(): void {
  const grid = document.querySelector<HTMLElement>(".input-grid");
  if (!grid) return;

  const weeklyField = findFieldByLabel(["Weekly loss %", "每周下降 %"]);
  const weightInput = findInputByLabel(["Weight kg", "体重 kg"]);
  const targetInput = findInputByLabel(["Target kg", "目标体重 kg"]);
  const saveButton = document.querySelector<HTMLButtonElement>(".primary-button");

  if (!weeklyField || !weightInput || !targetInput || !saveButton) return;

  weeklyField.classList.add("timeline-hidden-field");

  const language = getLanguage();
  const copy = getCopy(language);
  let timelineField = grid.querySelector<HTMLElement>(".timeline-field");
  let timelineInput = grid.querySelector<HTMLInputElement>(".timeline-weeks-input");

  if (!timelineField || !timelineInput) {
    timelineField = document.createElement("div");
    timelineField.className = "field timeline-field";

    const label = document.createElement("label");
    label.className = "timeline-label";

    timelineInput = document.createElement("input");
    timelineInput.className = "timeline-weeks-input";
    timelineInput.type = "number";
    timelineInput.min = String(MIN_WEEKS);
    timelineInput.max = String(MAX_WEEKS);
    timelineInput.step = "1";
    timelineInput.value = String(loadWeeks());

    timelineField.append(label, timelineInput);
    targetInput.closest(".field")?.after(timelineField);
  }

  const label = timelineField.querySelector<HTMLLabelElement>(".timeline-label");
  if (label) label.textContent = copy.timeline;

  let riskPanel = document.querySelector<HTMLElement>(".timeline-risk-panel");
  if (!riskPanel) {
    riskPanel = document.createElement("div");
    riskPanel.className = "timeline-risk-panel";
    grid.after(riskPanel);
  }

  const update = () => {
    const weeks = sanitizeWeeks(Number(timelineInput?.value));
    if (timelineInput && String(weeks) !== timelineInput.value) timelineInput.value = String(weeks);
    saveWeeks(weeks);

    const weightKg = Number(weightInput.value);
    const targetWeightKg = Number(targetInput.value);
    const risk = evaluateTimelineRisk(weightKg, targetWeightKg, weeks, language);
    renderRiskPanel(riskPanel, risk);
    setSaveBlocked(saveButton, risk.blocked, copy.blockedSave);

    if (Number.isFinite(weightKg) && Number.isFinite(targetWeightKg) && targetWeightKg < weightKg) {
      const requiredRate = (weightKg - targetWeightKg) / weeks / weightKg;
      const planRate = Math.min(HARD_LIMIT_RATE, Math.max(0.002, requiredRate));
      setReactInputValue(
        weeklyField.querySelector<HTMLInputElement>("input"),
        String(Number((planRate * 100).toFixed(2)))
      );
    }
  };

  if (timelineField.dataset.bound !== "true") {
    timelineField.dataset.bound = "true";
    timelineInput.addEventListener("input", update);
    weightInput.addEventListener("input", () => window.setTimeout(update, 0));
    targetInput.addEventListener("input", () => window.setTimeout(update, 0));
  }

  update();
}

function evaluateTimelineRisk(weightKg: number, targetWeightKg: number, weeks: number, language: "en" | "zh"): TimelineRisk {
  const copy = getCopy(language);

  if (!Number.isFinite(weightKg) || !Number.isFinite(targetWeightKg)) {
    return {
      status: "empty",
      title: copy.setTarget,
      detail: copy.setTargetDetail,
      blocked: false
    };
  }

  if (targetWeightKg >= weightKg) {
    return {
      status: "maintain",
      title: copy.noLossTarget,
      detail: copy.noLossTargetDetail,
      blocked: false
    };
  }

  const totalLossKg = weightKg - targetWeightKg;
  const weeklyLossKg = totalLossKg / weeks;
  const weeklyRate = weeklyLossKg / weightKg;
  const minimumWeeks = Math.ceil(totalLossKg / (weightKg * 0.01));
  const hardMinimumWeeks = Math.ceil(totalLossKg / (weightKg * HARD_LIMIT_RATE));
  const ratePct = (weeklyRate * 100).toFixed(2);
  const weeklyLoss = weeklyLossKg.toFixed(2);

  const detail = copy.detail
    .replace("{loss}", weeklyLoss)
    .replace("{rate}", ratePct)
    .replace("{standardWeeks}", String(Math.max(1, minimumWeeks)))
    .replace("{hardWeeks}", String(Math.max(1, hardMinimumWeeks)));

  if (weeklyRate > HARD_LIMIT_RATE) {
    return {
      status: "blocked",
      title: copy.blocked,
      detail,
      blocked: true
    };
  }

  if (weeklyRate > 0.015) {
    return { status: "high", title: copy.high, detail, blocked: false };
  }

  if (weeklyRate > 0.01) {
    return { status: "aggressive", title: copy.aggressive, detail, blocked: false };
  }

  if (weeklyRate >= 0.005) {
    return { status: "standard", title: copy.standard, detail, blocked: false };
  }

  return { status: "safe", title: copy.safe, detail, blocked: false };
}

function renderRiskPanel(panel: HTMLElement, risk: TimelineRisk): void {
  panel.className = `timeline-risk-panel ${risk.status}`;
  panel.innerHTML = `<strong>${risk.title}</strong><span>${risk.detail}</span>`;
}

function setSaveBlocked(button: HTMLButtonElement, blocked: boolean, blockedText: string): void {
  if (blocked) {
    if (button.dataset.timelineBlocked !== "true") {
      button.dataset.preTimelineText = button.textContent || "Save plan locally";
    }

    button.disabled = true;
    button.dataset.timelineBlocked = "true";
    button.classList.add("timeline-save-blocked");
    button.textContent = blockedText;
    return;
  }

  button.disabled = false;
  button.classList.remove("timeline-save-blocked");

  if (button.dataset.timelineBlocked === "true" && button.dataset.preTimelineText) {
    button.textContent = button.dataset.preTimelineText;
  }

  delete button.dataset.timelineBlocked;
  delete button.dataset.preTimelineText;
}

function setReactInputValue(input: HTMLInputElement | null, value: string): void {
  if (!input || input.value === value) return;

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function findFieldByLabel(labels: string[]): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>(".field")).find((field) => {
    const label = field.querySelector("label")?.textContent?.trim();
    return label ? labels.includes(label) : false;
  }) ?? null;
}

function findInputByLabel(labels: string[]): HTMLInputElement | null {
  return findFieldByLabel(labels)?.querySelector("input") ?? null;
}

function sanitizeWeeks(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_WEEKS;
  return Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, Math.round(value)));
}

function loadWeeks(): number {
  return sanitizeWeeks(Number(window.localStorage.getItem(TIMELINE_KEY) ?? DEFAULT_WEEKS));
}

function saveWeeks(weeks: number): void {
  window.localStorage.setItem(TIMELINE_KEY, String(weeks));
}

function getLanguage(): "en" | "zh" {
  return window.localStorage.getItem("last_chance_language") === "zh" ? "zh" : "en";
}

function getCopy(language: "en" | "zh") {
  if (language === "zh") {
    return {
      timeline: "期待完成用时（周）",
      setTarget: "设置目标后评估风险",
      setTargetDetail: "输入目标体重后，系统会根据用时自动计算每周下降速度。",
      noLossTarget: "目标体重不低于当前体重",
      noLossTargetDetail: "如果目标不是减重，系统会维持当前减脂速度设置。",
      safe: "保守区间",
      standard: "标准区间",
      aggressive: "激进区间",
      high: "高风险区间",
      blocked: "时间过短，不建议生成计划",
      blockedSave: "先调整目标时间",
      detail: "需要约 {loss} kg/周，等于当前体重的 {rate}%/周。标准建议至少 {standardWeeks} 周；硬性最低建议不少于 {hardWeeks} 周。"
    };
  }

  return {
    timeline: "Expected timeline weeks",
    setTarget: "Set target to assess risk",
    setTargetDetail: "After target weight is entered, the app calculates weekly loss rate from your timeline.",
    noLossTarget: "Target is not below current weight",
    noLossTargetDetail: "If the target is not fat loss, the app keeps the current loss-rate setting.",
    safe: "Conservative range",
    standard: "Standard range",
    aggressive: "Aggressive range",
    high: "High-risk range",
    blocked: "Timeline too short",
    blockedSave: "Adjust timeline first",
    detail: "Requires about {loss} kg/week, equal to {rate}% of body weight per week. Standard recommendation: at least {standardWeeks} weeks; hard minimum: no less than {hardWeeks} weeks."
  };
}
