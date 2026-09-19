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

  // Hard reload — used when the SW itself takes over (always safe to do).
  function forceReload() {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  }

  // Soft reload — only when no form field is focused and no modal is open.
  function safeReload() {
    if (reloading) return;
    const el = document.activeElement;
    if (el && el.matches("input,textarea,select,[contenteditable]")) return;
    if (document.querySelector("[data-fm-modal]")) return;
    reloading = true;
    window.location.reload();
  }

  async function check(reg) {
    try { await reg.update(); } catch {}

    // If a new SW installed and is waiting, send SKIP_WAITING (belt-and-suspenders
    // alongside skipWaiting() in the SW's own install handler).
    if (reg.waiting && navigator.serviceWorker.controller) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    // Version-stamp check: if the server has a newer build, soft-reload.
    try {
      const res = await fetch("/version.json", { cache: "no-store" });
      if (res.ok) {
        const { build } = await res.json();
        if (build !== __APP_BUILD__) safeReload();
      }
    } catch {}
  }

  navigator.serviceWorker.register("/sw.js").then((reg) => {
    // When the SW takes control (after skipWaiting + clients.claim),
    // always do a hard reload — the new SW is already serving new assets.
    navigator.serviceWorker.addEventListener("controllerchange", forceReload);

    check(reg);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check(reg);
    });

    setInterval(() => check(reg), 15 * 60 * 1000);
  });
}
