import { useEffect } from "react";

interface ScrollLockSnapshot {
  bodyOverflow: string;
  bodyTouchAction: string;
  rootOverscrollBehavior: string;
}

let lockCount = 0;
let snapshot: ScrollLockSnapshot | null = null;

export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return;

    lockCount += 1;

    if (lockCount === 1) {
      snapshot = {
        bodyOverflow: document.body.style.overflow,
        bodyTouchAction: document.body.style.touchAction,
        rootOverscrollBehavior: document.documentElement.style.overscrollBehavior
      };

      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.documentElement.style.overscrollBehavior = "none";
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0 && snapshot) {
        document.body.style.overflow = snapshot.bodyOverflow;
        document.body.style.touchAction = snapshot.bodyTouchAction;
        document.documentElement.style.overscrollBehavior = snapshot.rootOverscrollBehavior;
        snapshot = null;
      }
    };
  }, [locked]);
}
