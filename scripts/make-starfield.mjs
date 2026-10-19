// Builds src/assets/starfield.svg: stars at random spots, sizes and brightness.
// A fixed seed keeps the same sky on every run. Change SEED for a new sky,
// or COUNT for more or fewer stars, then run: node scripts/make-starfield.mjs
import { writeFileSync } from "node:fs";

const SEED = 1966;   // year of the first Stennis test firing
const COUNT = 200;
const W = 1920;
const H = 1080;

// Small seeded random number generator (mulberry32).
let s = SEED;
function rand() {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// A second random sequence just for twinkling, so turning it up or down
// doesn't move any stars.
const TWINKLE_SHARE = 0.50;   // 0 = no twinkling, 1 = every star twinkles
let s2 = SEED * 7;
function twinkle() {
  s2 = (s2 + 0x6d2b79f5) | 0;
  let t = Math.imul(s2 ^ (s2 >>> 15), 1 | s2);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const GROUPS = 10;   // each group drifts its own way
const stars = Array.from({ length: GROUPS }, () => []);
for (let i = 0; i < COUNT; i++) {
  const x = (rand() * W).toFixed(1);
  const y = (rand() * H).toFixed(1);
  // Most stars are tiny; a few are bigger and brighter.
  const roll = rand();
  const r = roll < 0.7 ? 0.6 + rand() * 0.5 : roll < 0.94 ? 1.1 + rand() * 0.6 : 1.7 + rand() * 0.8;
  const opacity = (r < 1.1 ? 0.3 + rand() * 0.35 : 0.55 + rand() * 0.4).toFixed(2);
  // About one star in six is a warm, champagne color.
  const fill = rand() < 0.17 ? "#FFE9C8" : "#FFFFFF";
  // About one star in four twinkles: it dims and brightens on its own random timer.
  if (twinkle() < TWINKLE_SHARE) {
    const dim = (opacity * 0.25).toFixed(2);
    const dur = (2 + twinkle() * 4).toFixed(1);      // 2 to 6 seconds per twinkle
    const delay = (twinkle() * 6).toFixed(1);         // so they don't all start together
    stars[i % GROUPS].push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${fill}" opacity="${opacity}"><animate attributeName="opacity" values="${opacity};${dim};${opacity}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/></circle>`);
  } else {
    stars[i % GROUPS].push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${fill}" opacity="${opacity}"/>`);
  }
}

// Give each group a random direction, distance and speed. It glides out and back forever.
const groups = stars.map((group) => {
  const angle = rand() * Math.PI * 2;
  const dist = 30 + rand() * 50;          // pixels
  const secs = Math.round(20 + rand() * 30);
  const dx = (Math.cos(angle) * dist).toFixed(1);
  const dy = (Math.sin(angle) * dist).toFixed(1);
  return `<g>\n<animateTransform attributeName="transform" type="translate" values="0 0; ${dx} ${dy}; 0 0" dur="${secs}s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"/>\n${group.join("\n")}\n</g>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">\n${groups.join("\n")}\n</svg>\n`;
writeFileSync(new URL("../src/assets/starfield.svg", import.meta.url), svg);
console.log(`Wrote ${COUNT} stars to src/assets/starfield.svg`);