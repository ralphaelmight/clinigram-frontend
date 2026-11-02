import "./index.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/poppins/latin-800.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { applyA11y } from "./utils/a11y.js";

// Apply saved accessibility prefs before first paint (no flash of unstyled content).
applyA11y();

// Block pinch-to-zoom everywhere — iOS Safari ignores viewport user-scalable=no,
// so we cancel the native gesture in JS to get true app-like behaviour.
["gesturestart", "gesturechange", "gestureend"].forEach((evt) =>
  document.addEventListener(evt, (e) => e.preventDefault(), { passive: false })
);

// Capture the PWA install prompt as early as possible (Chrome/Android fires it
// before React mounts).
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__cgInstallPrompt = e;
});
window.addEventListener("appinstalled", () => {
  window.__cgInstallPrompt = null;
  window.__cgInstalled = true;
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ── PWA auto-update (production only) ──────────────────────────────────────
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  let reloading = false;

  function forceReload() {
    if (reloading) return;
    reloading = true;
    // location.replace bypasses the browser's back-cache.
    window.location.replace(window.location.href.split("?")[0] + "?_r=" + Date.now());
  }

  async function checkVersion() {
    try {
      // Timestamp param bypasses both browser HTTP cache AND SW cache.
      const res = await fetch("/version.json?_=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        const { build } = await res.json();
        if (build !== __APP_BUILD__) forceReload();
      }
    } catch {}
  }

  async function checkSW(reg) {
    try { await reg.update(); } catch {}
    if (reg.waiting) {
      // SW is already waiting — activate it now.
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    await checkVersion();
  }

  // Check version immediately on load (before SW is ready).
  checkVersion();

  // SW → page: the service worker messages all clients after it activates.
  // This is the most reliable signal on iOS where controllerchange can be missed.
  navigator.serviceWorker.addEventListener("message", (e) => {
    if (e.data?.type === "SW_ACTIVATED") forceReload();
  });

  navigator.serviceWorker.register("/sw.js").then((reg) => {
    // controllerchange fires when a new SW takes over — reload immediately.
    navigator.serviceWorker.addEventListener("controllerchange", forceReload);

    // Check on registration.
    checkSW(reg);

    // Check whenever the user brings the app to the foreground (tab/window focus
    // or switching back to the PWA from another app).
    const onResume = () => checkSW(reg);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onResume();
    });
    window.addEventListener("focus", onResume);

    // Background heartbeat — catches the case where the app is left open for hours.
    setInterval(() => checkSW(reg), 5 * 60 * 1000);
  });
}
