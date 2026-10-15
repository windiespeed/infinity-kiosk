// Builds src/assets/starfield.svg: stars at random spots, sizes and brightness.
// A fixed seed keeps the same sky on every run. Change SEED for a new sky,
// or COUNT for more or fewer stars, then run: node scripts/make-starfield.mjs
import { writeFileSync } from "node:fs";

const SEED = 1966;   // year of the first Stennis test firing
const COUNT = 260;
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

const stars = [];
for (let i = 0; i < COUNT; i++) {
  const x = (rand() * W).toFixed(1);
  const y = (rand() * H).toFixed(1);
  // Most stars are tiny; a few are bigger and brighter.
  const roll = rand();
  const r = roll < 0.7 ? 0.6 + rand() * 0.5 : roll < 0.94 ? 1.1 + rand() * 0.6 : 1.7 + rand() * 0.8;
  const opacity = (r < 1.1 ? 0.3 + rand() * 0.35 : 0.55 + rand() * 0.4).toFixed(2);
  // About one star in six is a warm, champagne color.
  const fill = rand() < 0.17 ? "#FFE9C8" : "#FFFFFF";
  stars.push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${fill}" opacity="${opacity}"/>`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">\n${stars.join("\n")}\n</svg>\n`;
writeFileSync(new URL("../src/assets/starfield.svg", import.meta.url), svg);
console.log(`Wrote ${COUNT} stars to src/assets/starfield.svg`);
