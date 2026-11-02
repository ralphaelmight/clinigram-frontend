import { useEffect } from 'react';

// Updates <meta name="theme-color"> to tint the OS status bar to match the
// current screen. Restores the previous value on unmount, so Sheets/modals can
// darken it temporarily without leaving the wrong color behind.
export function useThemeColor(color) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return undefined;
    const prev = meta.getAttribute('content');
    meta.setAttribute('content', color);
    return () => meta.setAttribute('content', prev || '#f2f4f8');
  }, [color]);
}
