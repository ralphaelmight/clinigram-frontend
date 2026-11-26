// The app updates itself by reloading. A reload in the middle of a form would wipe what was typed,
// so the update waits until nobody is working: no pop-up form open, no field being filled in, and
// no save still on its way. It then reloads within a few seconds.
import { hasPendingWrites } from "../api.js";

const RECHECK_MS = 3000;

export function isBusy(doc = document) {
  if (hasPendingWrites()) return true;
  if (doc.querySelector("[data-fm-modal]")) return true; // every pop-up form carries this mark
  const el = doc.activeElement;
  return Boolean(el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && el.value);
}

export function whenIdle(reload) {
  let timer = null;
  const attempt = () => {
    timer = null;
    if (isBusy()) timer = setTimeout(attempt, RECHECK_MS);
    else reload();
  };
  // Calling again while already waiting does nothing.
  return () => { if (!timer) attempt(); };
}
