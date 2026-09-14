import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/poppins/latin-800.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ── PWA auto-update (production only) ──────────────────────────────────────
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  let reloading = false;

  // Don't reload while a form field has focus or a sheet/modal is open.
  function isSafeToReload() {
    if (document.activeElement?.matches("input,textarea,select,[contenteditable]"))
      return false;
    if (document.querySelector("[data-fm-modal]")) return false;
    return true;
  }

  function tryReload() {
    if (reloading || !isSafeToReload()) return;
    reloading = true;
    window.location.reload();
  }

  async function check(reg) {
    try { await reg.update(); } catch {}

    // A new SW is waiting — ask it to activate when the page is ready
    if (reg.waiting && navigator.serviceWorker.controller) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    // Version-stamp check: compare server build against what this bundle knows
    try {
      const res = await fetch("/version.json", { cache: "no-store" });
      if (res.ok) {
        const { build } = await res.json();
        if (build !== __APP_BUILD__) tryReload();
      }
    } catch {}
  }

  navigator.serviceWorker.register("/sw.js").then((reg) => {
    // When the new SW takes control, reload once (guard prevents loops)
    navigator.serviceWorker.addEventListener("controllerchange", tryReload);

    check(reg);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check(reg);
    });

    setInterval(() => check(reg), 15 * 60 * 1000);
  });
}
