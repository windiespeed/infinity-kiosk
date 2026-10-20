// Checks data/content.json against the same rules the app uses before every save.
// Run: npm run check:content   (also runs automatically before every build)
// The file is bundled into the Android app as its first-launch content, so a
// mistake here would reach the kiosk.
import { readFileSync } from "node:fs";
import { validateContent } from "../src/lib/content.js";

let content;
try {
  content = JSON.parse(readFileSync(new URL("../data/content.json", import.meta.url), "utf8"));
} catch (err) {
  console.error(`data/content.json can't be read: ${err.message}`);
  process.exit(1);
}

const problem = validateContent(content);
if (problem) {
  console.error(`data/content.json: ${problem}`);
  process.exit(1);
}
console.log("data/content.json passes the content rules.");
