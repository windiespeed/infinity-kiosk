// Checks every color pairing in theme.css against WCAG 2.1 AA.
// Run: npm run check:contrast   (also runs automatically before every build)
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles/theme.css", import.meta.url), "utf8");

// Pairings the UI actually uses: [foreground, background, minimum ratio, what it is]
// 4.5 = normal text, 3 = UI components (button edges, focus rings, markers)
const PAIRS = [
  ["text", "bg", 4.5, "Body text on page"],
  ["text", "surface", 4.5, "Body text on panels"],
  ["text-muted", "bg", 4.5, "Captions on page"],
  ["text", "bg-glow", 4.5, "Body text on the lightest part of the page gradient"],
  ["text-muted", "bg-glow", 4.5, "Captions on the lightest part of the page gradient"],
  ["accent", "bg-glow", 4.5, "Gold years and subtitles on the page gradient"],
  ["accent", "surface", 4.5, "Gold years on panels"],
  ["text-muted", "surface", 4.5, "Captions on panels"],
  ["on-accent", "accent", 4.5, "Button label"],
  ["accent-outline", "bg", 3, "Button edge on page"],
  ["on-primary", "primary", 4.5, "Era segment label"],
  ["primary-outline", "bg", 3, "Era segment edge"],
  ["highlight", "bg", 3, "Focus ring / active marker on page"],
  ["highlight", "surface", 3, "Focus ring on panels"],
  ["success", "surface", 4.5, "Quiz 'correct' text"],
  ["danger", "surface", 4.5, "Quiz 'incorrect' text"],
];

const readTokens = (block) =>
  Object.fromEntries(
    [...block.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]])
  );

const block = (re) => (css.match(re) ?? [, ""])[1];
const base = readTokens(block(/@theme[^{]*{([^}]*)}/));
const themes = {
  default: base,
  "high contrast": { ...base, ...readTokens(block(/\[data-contrast="high"\]\s*{([^}]*)}/)) },
};

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

let failures = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n${name.toUpperCase()} THEME`);
  for (const [fg, bg, min, label] of PAIRS) {
    if (!t[fg] || !t[bg]) {
      console.log(`  MISSING  --color-${fg} or --color-${bg}`);
      failures++;
      continue;
    }
    const r = ratio(t[fg], t[bg]);
    const ok = r >= min;
    if (!ok) failures++;
    console.log(`  ${ok ? "pass" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1 (needs ${min})  ${label}  [${fg} on ${bg}]`);
  }
}

if (failures) {
  console.error(`\n${failures} pairing(s) fail WCAG AA. Adjust the hex values in theme.css.`);
  process.exit(1);
}
console.log("\nAll pairings pass WCAG AA.");
