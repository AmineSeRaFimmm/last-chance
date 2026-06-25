const EXIT_DURATION_MS = 220;
const CENTER_MEDIA_OVERLAY_SELECTOR = ".workout-gif-overlay, .custom-builder-gif-overlay";
const BOTTOM_SHEET_OVERLAY_SELECTOR = ".workout-selector-overlay";
const FULL_SCREEN_SHEET_OVERLAY_SELECTOR = ".custom-workout-builder-overlay";
const IMMERSIVE_EDITOR_OVERLAY_SELECTOR = ".meal-composer-overlay";
const OVERLAY_SELECTOR = [
  CENTER_MEDIA_OVERLAY_SELECTOR,
  BOTTOM_SHEET_OVERLAY_SELECTOR,
  FULL_SCREEN_SHEET_OVERLAY_SELECTOR,
  IMMERSIVE_EDITOR_OVERLAY_SELECTOR
].join(", ");
const SCROLL_LOCK_OVERLAY_SELECTOR = [
  CENTER_MEDIA_OVERLAY_SELECTOR,
  BOTTOM_SHEET_OVERLAY_SELECTOR,
  FULL_SCREEN_SHEET_OVERLAY_SELECTOR
].join(", ");
const CLOSE_TRIGGER_SELECTOR = [
  ".workout-gif-backdrop",
  ".custom-builder-gif-backdrop",
  ".workout-selector-backdrop",
  ".workout-selector-head button",
  ".workout-selector-modal .program-option:not(.custom-plan-option)",
  ".custom-builder-back",
  ".custom-builder-done",
  ".meal-composer-backdrop",
  ".meal-composer-actions .primary-button:not(:disabled)"
].join(", ");

type OverlayMotionModel = "centerMedia" | "bottomSheet" | "fullScreenSheet" | "immersiveEditor";

interface ScrollLockSnapshot {
  overflow: string;
  touchAction: string;
  overscrollBehavior: string;
}

let started = false;
let lastGifOrigin: DOMRect | null = null;
let scrollLockSnapshot: ScrollLockSnapshot | null = null;
let startupScrollStyle: ScrollLockSnapshot | null = null;

startInteractionMotion();

function startInteractionMotion(): void {
  if (started || typeof window === "undefined" || typeof document === "undefined") return;
  started = true;
  startupScrollStyle = readScrollStyle();

  document.addEventListener("pointerdown", rememberGifOrigin, true);
  document.addEventListener("click", interceptCloseClick, true);

  const observer = new MutationObserver(() => {
    enhanceMotionLayers();
    updateScrollLock();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window.requestAnimationFrame(() => {
    enhanceMotionLayers();
    updateScrollLock();
  });
}

function rememberGifOrigin(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const button = target.closest(".exercise-gif-button");
  if (button instanceof HTMLElement) lastGifOrigin = button.getBoundingClientRect();
}

function interceptCloseClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const trigger = target.closest(CLOSE_TRIGGER_SELECTOR);
  if (!(trigger instanceof HTMLElement)) return;
  if (trigger.dataset.motionReplay === "true") return;

  const overlay = trigger.closest(OVERLAY_SELECTOR);
  if (!(overlay instanceof HTMLElement)) return;
  if (overlay.dataset.motionState === "exit") return;

  const motionModel = getOverlayMotionModel(overlay);
  if (!motionModel) return;

  if (motionModel === "fullScreenSheet" && trigger.matches(".custom-builder-back") && overlay.querySelector(".custom-workout-builder-modal.is-editing")) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (motionModel === "centerMedia") refreshGifFlip(overlay);

  setLayerState(overlay, "exit");

  window.setTimeout(() => {
    trigger.dataset.motionReplay = "true";
    trigger.click();
    window.setTimeout(() => delete trigger.dataset.motionReplay, 0);
    scheduleScrollUnlockCheck();
  }, EXIT_DURATION_MS);
}

function enhanceMotionLayers(): void {
  document.querySelectorAll(OVERLAY_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.dataset.motionEnhanced === "true") return;

    const motionModel = getOverlayMotionModel(node);
    if (!motionModel) return;

    node.dataset.motionEnhanced = "true";
    node.dataset.motionModel = motionModel;
    setLayerState(node, "enter");

    if (motionModel === "bottomSheet") {
      node.classList.add("motion-layer", "motion-sheet", "motion-bottom-sheet");
      addMotionClass(node, ".workout-selector-backdrop", "motion-backdrop");
      addMotionClass(node, ".workout-selector-modal", "motion-surface");
    } else if (motionModel === "centerMedia") {
      node.classList.add("motion-layer", "motion-center", "motion-center-media");
      addMotionClass(node, ".workout-gif-backdrop, .custom-builder-gif-backdrop", "motion-backdrop");
      const modal = node.querySelector(".workout-gif-modal, .custom-builder-gif-modal");
      if (modal instanceof HTMLElement) {
        modal.classList.add("motion-surface");
        applyGifFlip(modal);
        stabilizeGifFlipAfterMediaLoad(modal);
      }
    } else if (motionModel === "fullScreenSheet") {
      node.classList.add("motion-layer", "motion-fullscreen-sheet", "motion-full-screen-sheet");
    } else if (motionModel === "immersiveEditor") {
      node.classList.add("motion-layer", "motion-immersive", "motion-immersive-editor");
      addMotionClass(node, ".meal-composer-backdrop", "motion-backdrop");
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setLayerState(node, "open"));
    });
  });
}

function getOverlayMotionModel(overlay: HTMLElement): OverlayMotionModel | null {
  if (overlay.matches(CENTER_MEDIA_OVERLAY_SELECTOR)) return "centerMedia";
  if (overlay.matches(BOTTOM_SHEET_OVERLAY_SELECTOR)) return "bottomSheet";
  if (overlay.matches(FULL_SCREEN_SHEET_OVERLAY_SELECTOR)) return "fullScreenSheet";
  if (overlay.matches(IMMERSIVE_EDITOR_OVERLAY_SELECTOR)) return "immersiveEditor";
  return null;
}

function addMotionClass(root: HTMLElement, selector: string, className: string): void {
  const element = root.querySelector(selector);
  if (element instanceof HTMLElement) element.classList.add(className);
}

function refreshGifFlip(overlay: HTMLElement): void {
  const modal = overlay.querySelector(".workout-gif-modal, .custom-builder-gif-modal");
  if (modal instanceof HTMLElement) applyGifFlip(modal);
}

function applyGifFlip(modal: HTMLElement): void {
  if (!lastGifOrigin) {
    modal.dataset.flipOrigin = "false";
    return;
  }

  const modalRect = modal.getBoundingClientRect();
  if (modalRect.width <= 1 || modalRect.height <= 1) {
    modal.dataset.flipOrigin = "false";
    return;
  }

  const originCenterX = lastGifOrigin.left + lastGifOrigin.width / 2;
  const originCenterY = lastGifOrigin.top + lastGifOrigin.height / 2;
  const modalCenterX = modalRect.left + modalRect.width / 2;
  const modalCenterY = modalRect.top + modalRect.height / 2;

  modal.style.setProperty("--flip-x", `${originCenterX - modalCenterX}px`);
  modal.style.setProperty("--flip-y", `${originCenterY - modalCenterY}px`);
  modal.style.setProperty("--flip-scale-x", `${Math.max(0.08, lastGifOrigin.width / Math.max(1, modalRect.width))}`);
  modal.style.setProperty("--flip-scale-y", `${Math.max(0.08, lastGifOrigin.height / Math.max(1, modalRect.height))}`);
  modal.dataset.flipOrigin = "true";
}

function stabilizeGifFlipAfterMediaLoad(modal: HTMLElement): void {
  const image = modal.querySelector("img");
  if (!(image instanceof HTMLImageElement)) return;

  if (image.complete && image.naturalWidth > 0) {
    window.requestAnimationFrame(() => applyGifFlip(modal));
    return;
  }

  image.addEventListener("load", () => {
    window.requestAnimationFrame(() => applyGifFlip(modal));
  }, { once: true });
}

function setLayerState(layer: HTMLElement, state: "enter" | "open" | "exit"): void {
  layer.dataset.motionState = state;
  layer.querySelectorAll(".motion-surface").forEach((surface) => {
    if (surface instanceof HTMLElement) surface.dataset.motionState = state;
  });
}

function updateScrollLock(): void {
  const hasLockingOverlay = Boolean(document.querySelector(SCROLL_LOCK_OVERLAY_SELECTOR));

  if (hasLockingOverlay && !scrollLockSnapshot) {
    scrollLockSnapshot = normalizeSnapshot(readScrollStyle());
    writeScrollStyle({ overflow: "hidden", touchAction: "none", overscrollBehavior: "none" });
    return;
  }

  if (!hasLockingOverlay && scrollLockSnapshot) {
    writeScrollStyle(scrollLockSnapshot);
    scrollLockSnapshot = null;
  }

  if (!document.querySelector(OVERLAY_SELECTOR)) forceUnlockIfMotionLeftPageLocked();
}

function scheduleScrollUnlockCheck(): void {
  window.requestAnimationFrame(updateScrollLock);
  window.setTimeout(updateScrollLock, 0);
  window.setTimeout(updateScrollLock, EXIT_DURATION_MS + 32);
}

function forceUnlockIfMotionLeftPageLocked(): void {
  if (scrollLockSnapshot) return;
  const current = readScrollStyle();
  if (current.overflow !== "hidden" && current.touchAction !== "none" && current.overscrollBehavior !== "none") return;
  writeScrollStyle(startupScrollStyle ?? { overflow: "", touchAction: "", overscrollBehavior: "" });
}

function normalizeSnapshot(snapshot: ScrollLockSnapshot): ScrollLockSnapshot {
  if (snapshot.overflow === "hidden" && snapshot.touchAction === "none" && snapshot.overscrollBehavior === "none") {
    return startupScrollStyle ?? { overflow: "", touchAction: "", overscrollBehavior: "" };
  }

  return snapshot;
}

function readScrollStyle(): ScrollLockSnapshot {
  return {
    overflow: document.body.style.overflow,
    touchAction: document.body.style.touchAction,
    overscrollBehavior: document.documentElement.style.overscrollBehavior
  };
}

function writeScrollStyle(style: ScrollLockSnapshot): void {
  document.body.style.overflow = style.overflow;
  document.body.style.touchAction = style.touchAction;
  document.documentElement.style.overscrollBehavior = style.overscrollBehavior;
}

export {};
