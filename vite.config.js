import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In development, Vite serves the app on :5173 and forwards API and media
// requests to the local Express server on :5050 (started by `npm run dev`).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: { ignored: ["**/data/**"] },
    proxy: {
      "/api": "http://127.0.0.1:5050",
      "/media": "http://127.0.0.1:5050",
    },
  },
});
