const STORAGE_KEY = "last_chance_last_input";
const LANGUAGE_KEY = "last_chance_language";
const GENERATED_ATTR = "data-plan-generated-section";

const copy = {
  en: {
    result: "Result",
    status: "Status",
    setupTitle: "Build your plan first",
    setupDetail: "Complete the key inputs before the app shows personal numbers. No default result card is shown before setup.",
    setupCta: "Start setup",
    setupStepBody: "Body data",
    setupStepGoal: "Goal weight",
    setupStepTimeline: "Timeline",
    previewTitle: "Draft preview",
    previewDetail: "Live numbers based on your current inputs. Save locally when the plan looks right.",
    savedTitle: "Your plan is ready",
    savedDetail: "This is your saved local plan. Change any setting below to create a new draft preview.",
    previewBadge: "Preview",
    savedBadge: "Saved"
  },
  zh: {
    result: "结果",
    status: "状态",
    setupTitle: "先建立你的计划",
    setupDetail: "完成关键输入后再展示个人结果。首次进入不会展示默认数字，避免假结果感。",
    setupCta: "开始设置",
    setupStepBody: "身体数据",
    setupStepGoal: "目标体重",
    setupStepTimeline: "完成周期",
    previewTitle: "预览方案",
    previewDetail: "根据当前输入实时更新。确认方案合理后，再保存到本机。",
    savedTitle: "计划已就绪",
    savedDetail: "这是你已保存的本地计划。修改下方设置后，会自动变成新的预览方案。",
    previewBadge: "预览",
    savedBadge: "已保存"
  }
} as const;

let started = false;
let planStartedThisPage = false;
let planDraftThisPage = false;

startPlanHomeExperience();

function startPlanHomeExperience(): void {
  if (started || typeof window === "undefined" || typeof document === "undefined") return;
  started = true;

  document.addEventListener("click", handlePlanClick, true);
  document.addEventListener("input", handlePlanInput, true);
  document.addEventListener("change", handlePlanInput, true);

  const observer = new MutationObserver(refreshPlanHome);
  observer.observe(document.body, { childList: true, subtree: true });
  window.requestAnimationFrame(refreshPlanHome);
}

function handlePlanClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const shell = target.closest(".app-shell");
  if (!(shell instanceof HTMLElement)) return;

  if (target.closest("[data-plan-start]")) {
    markStarted(true);
    refreshPlanHome();
    window.requestAnimationFrame(() => document.querySelector(".plan-body-data-card")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return;
  }

  const segmentedButton = target.closest(".segmented button");
  if (segmentedButton) {
    markStarted(true);
    window.requestAnimationFrame(refreshPlanHome);
    return;
  }

  const saveButton = target.closest(".change-plan-button");
  if (saveButton instanceof HTMLButtonElement && !saveButton.disabled) {
    window.setTimeout(() => {
      if (hasStoredPlan()) {
        planStartedThisPage = true;
        planDraftThisPage = false;
        refreshPlanHome();
      }
    }, 0);
  }
}

function handlePlanInput(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!target.closest(".app-shell")) return;
  if (!target.matches("input, select")) return;
  markStarted(true);
  window.requestAnimationFrame(refreshPlanHome);
}

function markStarted(isDraft: boolean): void {
  planStartedThisPage = true;
  if (isDraft) planDraftThisPage = true;
}

function refreshPlanHome(): void {
  const shell = document.querySelector(".app-shell");
  if (!(shell instanceof HTMLElement)) return;

  classifyPlanCards(shell);
  markGeneratedSections(shell);

  const stored = hasStoredPlan();
  const active = stored || planStartedThisPage;
  const mode = active ? stored && !planDraftThisPage ? "saved" : "draft" : "start";

  shell.classList.toggle("plan-home-start", mode === "start");
  shell.classList.toggle("plan-home-active", mode !== "start");
  shell.classList.toggle("plan-home-draft", mode === "draft");
  shell.classList.toggle("plan-home-saved", mode === "saved");

  const startCard = ensureStartCard(shell);
  startCard.hidden = mode !== "start";

  const resultCard = shell.querySelector(".plan-result-card");
  if (resultCard instanceof HTMLElement) {
    resultCard.hidden = mode === "start";
    if (mode !== "start") {
      ensureResultBanner(resultCard, mode);
      moveAfter(resultCard, shell.querySelector(".hero"));
    }
  }

  const statusCard = ensureStatusCard(shell);
  statusCard.hidden = mode === "start";
  if (mode !== "start" && resultCard instanceof HTMLElement) {
    syncStatusCard(statusCard, shell);
    moveAfter(statusCard, resultCard);
  }

  shell.querySelectorAll(`[${GENERATED_ATTR}="true"]`).forEach((section) => {
    if (section instanceof HTMLElement && !section.classList.contains("plan-result-card") && !section.classList.contains("plan-home-status-card")) {
      section.hidden = mode === "start";
    }
  });
}

function classifyPlanCards(shell: HTMLElement): void {
  const cards = Array.from(shell.children).filter((child): child is HTMLElement => child instanceof HTMLElement && child.classList.contains("card"));

  cards.forEach((card) => {
    if (card.classList.contains("accent-card")) card.classList.add("plan-result-card");
    if (card.querySelector(".input-grid")) card.classList.add("plan-body-data-card", "plan-settings-card");
    if (card.querySelector(".segmented.two") && !card.querySelector(".input-grid") && !card.classList.contains("plan-result-card")) card.classList.add("plan-settings-card");
  });
}

function markGeneratedSections(shell: HTMLElement): void {
  const children = Array.from(shell.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
  const resultIndex = children.findIndex((child) => child.classList.contains("plan-result-card"));
  if (resultIndex < 0) return;

  children.slice(resultIndex).forEach((child) => {
    if (child.classList.contains("plan-settings-card")) return;
    if (child.getAttribute(GENERATED_ATTR) !== "true") child.setAttribute(GENERATED_ATTR, "true");
  });
}

function ensureStartCard(shell: HTMLElement): HTMLElement {
  const existing = shell.querySelector(".plan-start-card");
  if (existing instanceof HTMLElement) return existing;

  const labels = getCopy();
  const card = document.createElement("section");
  card.className = "card plan-start-card";
  card.innerHTML = `
    <div class="card-title">${labels.result}</div>
    <h2>${labels.setupTitle}</h2>
    <p>${labels.setupDetail}</p>
    <div class="setup-step-grid">
      <span>${labels.setupStepBody}</span>
      <span>${labels.setupStepGoal}</span>
      <span>${labels.setupStepTimeline}</span>
    </div>
    <button class="primary-button plan-start-button" data-plan-start type="button">${labels.setupCta}</button>
  `;

  const hero = shell.querySelector(".hero");
  if (hero) moveAfter(card, hero);
  else shell.prepend(card);
  return card;
}

function ensureResultBanner(resultCard: HTMLElement, mode: "draft" | "saved"): void {
  const labels = getCopy();
  const existing = resultCard.querySelector(".plan-result-banner");
  const banner = existing instanceof HTMLElement ? existing : document.createElement("div");
  if (banner.dataset.planMode === mode) return;

  banner.className = "plan-result-banner";
  banner.dataset.planMode = mode;
  banner.innerHTML = `
    <div>
      <div class="card-title">${labels.result}</div>
      <h2>${mode === "saved" ? labels.savedTitle : labels.previewTitle}</h2>
      <p>${mode === "saved" ? labels.savedDetail : labels.previewDetail}</p>
    </div>
    <span>${mode === "saved" ? labels.savedBadge : labels.previewBadge}</span>
  `;
  if (!existing) resultCard.prepend(banner);
}

function ensureStatusCard(shell: HTMLElement): HTMLElement {
  const existing = shell.querySelector(".plan-home-status-card");
  if (existing instanceof HTMLElement) return existing;
  const card = document.createElement("section");
  card.className = "card plan-home-status-card";
  return card;
}

function syncStatusCard(statusCard: HTMLElement, shell: HTMLElement): void {
  const labels = getCopy();
  const risk = shell.querySelector(".plan-body-data-card .timeline-risk-panel");
  const nextHtml = `<div class="card-title">${labels.status}</div>${risk instanceof HTMLElement ? risk.outerHTML : ""}`;
  if (statusCard.innerHTML !== nextHtml) statusCard.innerHTML = nextHtml;
}

function moveAfter(node: Element, reference: Element | null): void {
  if (!reference || !reference.parentElement) return;
  if (reference.nextSibling === node) return;
  reference.parentElement.insertBefore(node, reference.nextSibling);
}

function hasStoredPlan(): boolean {
  return Boolean(window.localStorage.getItem(STORAGE_KEY));
}

function getCopy(): typeof copy.en | typeof copy.zh {
  return window.localStorage.getItem(LANGUAGE_KEY) === "zh" ? copy.zh : copy.en;
}

export {};
