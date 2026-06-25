import { useEffect, useState } from "react";

export type MotionPresenceState = "enter" | "open" | "exit";

export interface MotionPresence {
  shouldRender: boolean;
  motionState: MotionPresenceState;
}

export function useMotionPresence(isOpen: boolean, exitDurationMs = 220): MotionPresence {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [motionState, setMotionState] = useState<MotionPresenceState>(isOpen ? "open" : "exit");

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setMotionState("enter");

      let secondFrame = 0;
      const firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => setMotionState("open"));
      });

      return () => {
        window.cancelAnimationFrame(firstFrame);
        window.cancelAnimationFrame(secondFrame);
      };
    }

    if (!shouldRender) return;

    setMotionState("exit");
    const timeout = window.setTimeout(() => setShouldRender(false), exitDurationMs);

    return () => window.clearTimeout(timeout);
  }, [isOpen, shouldRender, exitDurationMs]);

  return { shouldRender, motionState };
}
