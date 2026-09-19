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

  function forceReload() {
    if (reloading) return;
    reloading = true;
    // Use location.replace so the reload bypasses the browser's back-cache.
    window.location.replace(window.location.href.split("?")[0] + "?_r=" + Date.now());
  }

  async function checkVersion() {
    try {
      const res = await fetch("/version.json", { cache: "no-store" });
      if (res.ok) {
        const { build } = await res.json();
        if (build !== __APP_BUILD__) forceReload();
      }
    } catch {}
  }

  async function checkSW(reg) {
    try { await reg.update(); } catch {}
    if (reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    await checkVersion();
  }

  // Check version immediately on load (before SW is ready).
  checkVersion();

  navigator.serviceWorker.register("/sw.js").then((reg) => {
    navigator.serviceWorker.addEventListener("controllerchange", forceReload);

    checkSW(reg);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkSW(reg);
    });

    setInterval(() => checkSW(reg), 15 * 60 * 1000);
  });
}
