let installed = false;

interface ProjectionItem {
  week: string;
  weight: string;
}

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
  let startY = 0;
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

  const hint = document.createElement("div");
  hint.className = "projection-focus-hint";
  hint.textContent = "Swipe up / down";

  card.append(week, weight, hint);
  overlay.append(backdrop, card);
  document.body.appendChild(overlay);
  document.body.classList.add("projection-focus-open");

  const render = (direction: "up" | "down" | "none" = "none") => {
    const item = items[activeIndex];
    week.textContent = item.week;
    weight.textContent = item.weight;
    card.dataset.direction = direction;

    if (!reducedMotion) {
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

  const move = (delta: number) => {
    const nextIndex = Math.min(items.length - 1, Math.max(0, activeIndex + delta));
    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;
    render(delta > 0 ? "up" : "down");
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") close();
    if (event.key === "ArrowUp") move(1);
    if (event.key === "ArrowDown") move(-1);
  };

  backdrop.addEventListener("click", close);
  card.addEventListener("pointerdown", (event) => {
    startY = event.clientY;
  });
  card.addEventListener("pointerup", (event) => {
    const deltaY = event.clientY - startY;
    if (deltaY < -18) move(1);
    if (deltaY > 18) move(-1);
  });
  card.addEventListener("wheel", (event) => {
    event.preventDefault();
    move(event.deltaY > 0 ? 1 : -1);
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

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
