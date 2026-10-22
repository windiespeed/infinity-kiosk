// Builds the public companion site for GitHub Pages into dist/.
// Run: npm run build:pages   (the "Companion site" workflow runs it on every change to main)
//
// It's the same app in read-only companion mode (VITE_COMPANION=true): content and photos
// come from data/content.json and data/media/, and the admin screens can't sign in or save.
import { execSync } from "node:child_process";
import { copyFileSync } from "node:fs";

process.env.VITE_COMPANION = "true";
process.env.PAGES_BASE ??= "/infinity-kiosk/";
// Runs the usual content and contrast checks first, then vite build.
execSync("npm run build", { stdio: "inherit" });
// GitHub Pages serves 404.html for unknown paths, so deep links like /era/apollo still open the app.
copyFileSync("dist/index.html", "dist/404.html");
console.log(`Companion site built in dist/ for ${process.env.PAGES_BASE}`);
