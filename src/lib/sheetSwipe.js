// Swipe a pop-up panel down to close it, like a phone app. The swipe only works from the grab bar
// and title at the top, so scrolling through a long form can never close it by accident.
import { useRef } from "react";
import { haptic } from "./haptics";

const CLOSE_AFTER_PX = 110;

export function useSheetSwipe(onClose) {
  const start = useRef(null);
  const moved = useRef(0);
  const panelOf = (e) => e.currentTarget.closest(".fm-sheet");

  const settle = (e) => {
    const panel = panelOf(e);
    if (panel) {
      panel.style.transition = "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)";
      panel.style.transform = "";
    }
    start.current = null;
    moved.current = 0;
  };

  return {
    onTouchStart: (e) => { start.current = e.touches[0].clientY; moved.current = 0; },
    onTouchMove: (e) => {
      if (start.current === null) return;
      moved.current = Math.max(0, e.touches[0].clientY - start.current);
      const panel = panelOf(e);
      if (!panel) return;
      panel.style.animation = "none";
      panel.style.transition = "none";
      panel.style.transform = moved.current ? `translateY(${moved.current}px)` : "";
    },
    onTouchEnd: (e) => {
      const close = moved.current > CLOSE_AFTER_PX;
      settle(e);
      if (close) { haptic("light"); onClose?.(); }
    },
    onTouchCancel: settle,
    style: { touchAction: "none" },
  };
}
