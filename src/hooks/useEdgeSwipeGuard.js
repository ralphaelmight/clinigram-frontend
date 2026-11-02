import { useEffect } from 'react';

// Suppresses the browser's native edge-swipe-back / swipe-forward (iOS Safari
// navigates history when you drag from the very left/right edge). Only acts on
// gestures that BEGIN in the ~27px edge strip and move clearly horizontal, so
// vertical scrolling and inner horizontal scrollers are completely untouched.
const EDGE = 27;

export function useEdgeSwipeGuard() {
  useEffect(() => {
    let x = 0;
    let y = 0;
    let atEdge = false;

    const onStart = (e) => {
      const t = e.touches[0];
      x = t.clientX;
      y = t.clientY;
      atEdge = x <= EDGE || x >= window.innerWidth - EDGE;
    };
    const onMove = (e) => {
      if (!atEdge) return;
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - x);
      const dy = Math.abs(t.clientY - y);
      if (dx > dy && dx > 6) e.preventDefault();
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
    };
  }, []);
}
