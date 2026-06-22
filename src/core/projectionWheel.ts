let installed = false;

interface ProjectionItem {
  week: string;
  weight: string;
}

const PIXELS_PER_WEEK = 34;
const FLICK_VELOCITY = 0.65;

export function installProjectionWheel(): void {
  if (installed || typeof document === "undefined") return;
  installed = true;

  const enhance = () => {
    document.querySelectorAll<HTMLElement>(".projection-table").forEach(setupProjectionCard);
  };

  enhance();

  const observer = new MutationObserver(enhance);
  observer.observe(document.body, { childList: true, subtree: true });
}

function setupProjectionCard(table: HTMLElement): void {
  if (table.dataset.focusReady === "true") return;

  const rows = Array.from(table.querySelectorAll<HTMLElement>(".projection-row"));
  const items = rows.map(readProjectionItem).filter(Boolean) as ProjectionItem[];
  if (items.length === 0) return;

  table.dataset.focusReady = "true";
  table.classList.add("projection-wheel");
  table.setAttribute("role", "button");
  table.setAttribute("tabindex", "0");
  table.setAttribute("aria-label", "Open 12-week projection focus view");

  setActiveRow(rows, 0);

  table.addEventListener("click", () => openProjectionFocus(items));
  table.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProjectionFocus(items);
    }
  });
}

function openProjectionFocus(items: ProjectionItem[]): void {
  const previousOverlay = document.querySelector(".projection-focus-overlay");
  if (previousOverlay) previousOverlay.remove();

  let activeIndex = 0;
  let startIndex = 0;
  let startY = 0;
  let lastY = 0;
  let startTime = 0;
  let dragging = false;
  const reducedMotion = prefersReducedMotion();

  const overlay = document.createElement("div");
  overlay.className = "projection-focus-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "12-week projection focus view");

  const backdrop = document.createElement("button");
  backdrop.className = "projection-focus-backdrop";
  backdrop.type = "button";
  backdrop.setAttribute("aria-label", "Close projection");

  const card = document.createElement("div");
  card.className = "projection-focus-card";
  card.tabIndex = 0;

  const week = document.createElement("div");
  week.className = "projection-focus-week";

  const weight = document.createElement("div");
  weight.className = "projection-focus-weight";

  card.append(week, weight);
  overlay.append(backdrop, card);
  document.body.appendChild(overlay);
  document.body.classList.add("projection-focus-open");

  const render = (direction: "up" | "down" | "none" = "none", animate = true) => {
    const item = items[activeIndex];
    week.textContent = item.week;
    weight.textContent = item.weight;
    card.dataset.direction = direction;

    if (!reducedMotion && animate) {
      card.classList.remove("projection-focus-animate");
      void card.offsetWidth;
      card.classList.add("projection-focus-animate");
    }
  };

  const close = () => {
    document.body.classList.remove("projection-focus-open");
    overlay.classList.add("is-closing");
    window.setTimeout(() => overlay.remove(), reducedMotion ? 0 : 160);
    document.removeEventListener("keydown", handleKeydown);
  };

  const setIndex = (nextIndex: number, animate = true) => {
    const clampedIndex = clamp(nextIndex, 0, items.length - 1);
    if (clampedIndex === activeIndex) return;

    const direction = clampedIndex > activeIndex ? "up" : "down";
    activeIndex = clampedIndex;
    render(direction, animate);
  };

  const move = (delta: number) => {
    setIndex(activeIndex + delta);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") close();
    if (event.key === "ArrowUp") move(1);
    if (event.key === "ArrowDown") move(-1);
  };

  backdrop.addEventListener("click", close);
  card.addEventListener("pointerdown", (event) => {
    dragging = true;
    startY = event.clientY;
    lastY = event.clientY;
    startIndex = activeIndex;
    startTime = performance.now();
    card.classList.add("is-dragging");
    card.setPointerCapture(event.pointerId);
  });

  card.addEventListener("pointermove", (event) => {
    if (!dragging) return;

    lastY = event.clientY;
    const offset = Math.trunc((startY - event.clientY) / PIXELS_PER_WEEK);
    setIndex(startIndex + offset, false);
  });

  card.addEventListener("pointerup", (event) => {
    if (!dragging) return;

    dragging = false;
    card.classList.remove("is-dragging");
    card.releasePointerCapture(event.pointerId);

    const elapsed = Math.max(1, performance.now() - startTime);
    const deltaY = startY - lastY;
    const velocity = deltaY / elapsed;
    const baseOffset = Math.round(deltaY / PIXELS_PER_WEEK);
    const momentum = Math.abs(velocity) > FLICK_VELOCITY ? Math.sign(velocity) * 2 : 0;
    const finalOffset = baseOffset + momentum;

    if (finalOffset !== 0) {
      setIndex(startIndex + finalOffset, true);
    }
  });

  card.addEventListener("pointercancel", () => {
    dragging = false;
    card.classList.remove("is-dragging");
  });

  card.addEventListener("wheel", (event) => {
    event.preventDefault();
    const wheelDelta = Math.max(-3, Math.min(3, Math.round(event.deltaY / 36)));
    if (wheelDelta !== 0) move(wheelDelta);
  }, { passive: false });
  document.addEventListener("keydown", handleKeydown);

  render("none");
  window.setTimeout(() => card.focus(), 0);
}

function readProjectionItem(row: HTMLElement): ProjectionItem | null {
  const week = row.querySelector("span")?.textContent?.trim();
  const weight = row.querySelector("strong")?.textContent?.trim();

  if (!week || !weight) return null;

  return { week, weight };
}

function setActiveRow(rows: HTMLElement[], activeIndex: number): void {
  rows.forEach((row, index) => {
    const isActive = index === activeIndex;
    row.classList.toggle("is-active", isActive);
    row.setAttribute("aria-hidden", isActive ? "false" : "true");
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
