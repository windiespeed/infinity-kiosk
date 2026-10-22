import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In development, Vite serves the app on :5173 and forwards API and media
// requests to the local Express server on :5050 (started by `npm run dev`).
// `npm run build:pages` sets PAGES_BASE so the app works under
// https://<user>.github.io/infinity-kiosk/ instead of at the site root.
export default defineConfig({
  base: process.env.PAGES_BASE ?? "/",
  plugins: [react(), tailwindcss()],
  server: {
    watch: { ignored: ["**/data/**"] },
    proxy: {
      "/api": "http://127.0.0.1:5050",
      "/media": "http://127.0.0.1:5050",
    },
  },
});
