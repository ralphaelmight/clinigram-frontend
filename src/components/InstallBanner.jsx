import { useEffect, useState } from 'react';
import { X, ArrowDownToLine } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

// Unobtrusive "Install app" pill — appears after 12s, retreats after 30s if
// ignored, dismissed for 14 days on ✕ tap, hidden in standalone/native.
const DISMISS_KEY = 'cg_install_dismissed_at';
const DISMISS_DAYS = 14;
const SHOW_DELAY_MS = 12000;
const AUTO_HIDE_MS = 30000;

function dismissedRecently() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return !!t && Date.now() - t < DISMISS_DAYS * 864e5;
  } catch { return false; }
}

export default function InstallBanner() {
  const { isIOS, isMobile, installed, canInstall, promptInstall } = usePwaInstall();
  const [visible, setVisible] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const iosSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  const isStandalone = typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
  const eligible = !isStandalone && !installed && isMobile && (canInstall || iosSafari) && !dismissedRecently();

  useEffect(() => {
    if (!eligible) { setVisible(false); return; }
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [eligible]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [visible]);

  function dismiss(e) {
    e?.stopPropagation();
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setVisible(false);
  }

  async function activate() {
    if (canInstall) {
      try { await promptInstall(); } catch {}
    } else {
      setShowIOSSteps(true);
    }
    setVisible(false);
  }

  if (showIOSSteps) {
    return (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(26,26,46,0.6)', display: 'flex', alignItems: 'flex-end' }}
        onClick={() => setShowIOSSteps(false)}
      >
        <div
          style={{ background: '#f2f4f8', borderRadius: '20px 20px 0 0', padding: '24px 20px calc(32px + env(safe-area-inset-bottom, 0px))', width: '100%', boxShadow: '0 -8px 32px rgba(26,26,46,0.18)' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontWeight: 800, fontSize: 17, color: '#1a1a2e', marginBottom: 14 }}>Add to Home Screen</div>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, margin: '0 0 10px' }}>
            1. Tap the <strong>Share</strong> icon <span style={{ fontSize: 18 }}>⎙</span> at the bottom of Safari
          </p>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, margin: '0 0 22px' }}>
            2. Scroll down and tap <strong>"Add to Home Screen"</strong>
          </p>
          <button onClick={() => setShowIOSSteps(false)} style={{ width: '100%', padding: '14px', background: '#e93223', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
            Got it
          </button>
        </div>
      </div>
    );
  }

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.75rem)', zIndex: 60, animation: 'slideUp 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 999, background: 'rgba(26,26,46,0.92)', color: '#fff', paddingLeft: 12, paddingRight: 6, paddingTop: 5, paddingBottom: 5, boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>
        <button onClick={activate} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 4px', fontFamily: 'inherit' }}>
          <ArrowDownToLine size={14} strokeWidth={2.5} style={{ color: '#5db2b6', flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Install app</span>
        </button>
        <button onClick={dismiss} aria-label="Not now" style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}>
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
