import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { writeFileSync, mkdirSync } from "fs";

const BUILD_ID = String(Date.now());

function versionPlugin() {
  return {
    name: "emit-version-json",
    apply: "build",
    closeBundle() {
      mkdirSync("dist", { recursive: true });
      writeFileSync("dist/version.json", JSON.stringify({ build: BUILD_ID }));
    },
  };
}

export default defineConfig({
  define: {
    __APP_BUILD__: JSON.stringify(BUILD_ID),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          icons: ["lucide-react"],
        },
      },
    },
  },
  plugins: [
    react(),
    versionPlugin(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectRegister: null, // we register in main.jsx
      manifest: {
        name: "Clinigram Facility Manager",
        short_name: "Clinigram",
        description: "Healthcare facility management for Clinigram Healthcare",
        theme_color: "#EC1C24",
        background_color: "#EC1C24",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff2}"],
        globIgnores: ["**/version.json"], // never precache; always fetch fresh
      },
    }),
  ],
});
