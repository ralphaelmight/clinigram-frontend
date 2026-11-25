// Stops one tap (or an impatient second tap) from saving the same thing twice.
//
// A React "busy" state alone is not enough: two taps can both arrive before the screen has
// redrawn with the button disabled. The ref below flips instantly, in the same moment as the
// first tap, so the second tap is ignored.
import React, { useRef, useState } from "react";

export function useTapLock(onClick) {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const run = (e) => {
    if (locked.current) return;
    const result = onClick?.(e);
    // Only actions that talk to the server return a promise; plain screen taps are never locked.
    if (!result || typeof result.then !== "function") return;
    locked.current = true;
    setPending(true);
    const release = () => { locked.current = false; setPending(false); };
    result.then(release, (err) => { release(); console.error(err); });
  };
  return [pending, run];
}

export function Spinner() {
  return <span className="fm-spinner" aria-hidden="true" />;
}

// A plain <button> with the double-tap lock and a spinner while it is working.
export function TapButton({ onClick, disabled, children, style, ...rest }) {
  const [pending, run] = useTapLock(onClick);
  return (
    <button
      {...rest} onClick={run} disabled={disabled || pending} aria-busy={pending}
      style={pending ? { ...style, opacity: 0.6, cursor: "wait" } : style}
    >
      {pending && <Spinner />}
      {children}
    </button>
  );
}

// Small "Saved" confirmation, so staff know the record went in and don't enter it again.
export function showSaved(text = "Saved") {
  if (typeof document === "undefined") return;
  document.querySelector(".fm-toast")?.remove();
  const el = document.createElement("div");
  el.className = "fm-toast";
  el.setAttribute("role", "status");
  el.textContent = `✓ ${text}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}
