import { useEffect, useState } from 'react';

// Detects platform + whether the PWA can be installed, and exposes a one-tap
// install for Android/Chrome. iOS Safari has no programmatic install (Apple
// restriction) — the UI shows Add-to-Home-Screen steps instead.
export function usePwaInstall() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi/i.test(ua);
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

  const [prompt, setPrompt] = useState(typeof window !== 'undefined' ? window.__cgInstallPrompt || null : null);
  const [installed, setInstalled] = useState(
    typeof window !== 'undefined' ? !!window.__cgInstalled || isStandalone : false,
  );

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); window.__cgInstallPrompt = e; setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function promptInstall() {
    const p = prompt || window.__cgInstallPrompt;
    if (!p) return 'unavailable';
    p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setPrompt(null);
    window.__cgInstallPrompt = null;
    return outcome;
  }

  const platform = isIOS ? 'ios' : isAndroid ? 'android' : isMobile ? 'mobile' : 'desktop';
  return { platform, isIOS, isAndroid, isMobile, installed, canInstall: !!prompt, promptInstall };
}
