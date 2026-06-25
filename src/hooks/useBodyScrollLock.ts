import { useEffect } from "react";

export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;

    const bodyOverflow = document.body.style.overflow;
    const bodyTouchAction = document.body.style.touchAction;
    const rootOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.body.style.touchAction = bodyTouchAction;
      document.documentElement.style.overscrollBehavior = rootOverscroll;
    };
  }, [active]);
}
