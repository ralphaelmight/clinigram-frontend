import { useEffect, useRef, useState } from 'react';

// Pull-to-refresh for the FM's bounded scroll containers (each tab has its own
// overflow-y:auto viewport inside .fm-main). Engages only when the active tab's
// container is scrolled to the very top and the finger moves clearly downward.
//
//   const { pull, refreshing } = usePullToRefresh(async () => { await reload(); });
//   <PullToRefresh pull={pull} refreshing={refreshing} />
export function usePullToRefresh(onRefresh, { threshold = 70 } = {}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => { refreshingRef.current = refreshing; }, [refreshing]);

  useEffect(() => {
    let startY = null;
    let active = false;

    const getScrollEl = () =>
      document.querySelector('.fm-main > div:not([hidden]):not(.fm-bottom-nav)');

    const setP = (v) => { pullRef.current = v; setPull(v); };

    const onStart = (e) => {
      const el = getScrollEl();
      if (el && el.scrollTop <= 0 && !refreshingRef.current) {
        startY = e.touches[0].clientY;
        active = true;
      } else {
        active = false;
      }
    };
    const onMove = (e) => {
      if (!active || startY == null) return;
      const dy = e.touches[0].clientY - startY;
      const el = getScrollEl();
      if (dy > 0 && el && el.scrollTop <= 0) {
        setP(Math.min(dy * 0.5, threshold + 28));
      } else {
        setP(0);
      }
    };
    const onEnd = async () => {
      if (!active) return;
      active = false;
      startY = null;
      if (pullRef.current >= threshold && !refreshingRef.current) {
        setRefreshing(true);
        setP(threshold);
        try { await onRefreshRef.current?.(); } catch {}
        setRefreshing(false);
        setP(0);
      } else {
        setP(0);
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [threshold]);

  return { pull, refreshing };
}
