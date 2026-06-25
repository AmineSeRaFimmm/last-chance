import { useEffect, useState } from "react";

export type MotionState = "enter" | "open" | "exit";

export interface MotionOriginRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const DEFAULT_EXIT_DURATION_MS = 220;

export function getMotionOriginRect(element: Element): MotionOriginRect {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height
  };
}

export function useMotionPresence(isOpen: boolean, exitDurationMs = DEFAULT_EXIT_DURATION_MS) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [motionState, setMotionState] = useState<MotionState>(isOpen ? "enter" : "exit");

  useEffect(() => {
    let frameOne = 0;
    let frameTwo = 0;
    let timeout = 0;

    if (isOpen) {
      setShouldRender(true);
      setMotionState("enter");
      frameOne = requestAnimationFrame(() => {
        frameTwo = requestAnimationFrame(() => setMotionState("open"));
      });
    } else {
      setMotionState("exit");
      timeout = setTimeout(() => setShouldRender(false), exitDurationMs);
    }

    return () => {
      if (frameOne) cancelAnimationFrame(frameOne);
      if (frameTwo) cancelAnimationFrame(frameTwo);
      if (timeout) clearTimeout(timeout);
    };
  }, [isOpen, exitDurationMs]);

  return { shouldRender, motionState };
}

export function useRetainedMotionValue<T>(value: T | null | undefined, exitDurationMs = DEFAULT_EXIT_DURATION_MS) {
  const presence = useMotionPresence(value !== null && value !== undefined, exitDurationMs);
  const [retainedValue, setRetainedValue] = useState<T | null>(value ?? null);

  useEffect(() => {
    if (value !== null && value !== undefined) setRetainedValue(value);
  }, [value]);

  useEffect(() => {
    if (!presence.shouldRender && (value === null || value === undefined)) setRetainedValue(null);
  }, [presence.shouldRender, value]);

  return { ...presence, value: retainedValue };
}
