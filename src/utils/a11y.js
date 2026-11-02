// Lightweight accessibility preferences — persisted per device, applied as
// classes on <html> before first paint so there's no flash of unstyled content.
const KEY = 'a11y_prefs';

export function getA11y() {
  try {
    return { smallText: false, highContrast: false, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { smallText: false, highContrast: false };
  }
}

export function applyA11y(prefs = getA11y()) {
  const el = document.documentElement;
  el.classList.toggle('a11y-small', !!prefs.smallText);
  el.classList.toggle('a11y-contrast', !!prefs.highContrast);
}

export function setA11y(patch) {
  const next = { ...getA11y(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  applyA11y(next);
  return next;
}
