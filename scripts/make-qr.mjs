// Makes printable QR codes for the certificate page: one per era, plus one for the
// whole-timeline challenge. Printed codes carry no date, so the certificate shows
// the day it's scanned.
//
// Run: npm run qr                                  (uses the address in Admin > Settings, or the default)
//      npm run qr -- --site https://mscoding.org/kiosk
//
// Writes qr-codes/<era>.svg and qr-codes/print.html (open it in a browser and print).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import { certificateLink, certificateSite } from "../src/lib/certificate.js";

const content = JSON.parse(readFileSync("data/content.json", "utf8"));
const flag = process.argv.indexOf("--site");
const site = certificateSite(flag > -1 ? process.argv[flag + 1] : content.settings?.certificateSite);

const codes = [
  { id: "timeline", title: "Timeline Challenge (all eras)", url: certificateLink(site) },
  ...[...content.eras]
    .sort((a, b) => a.order - b.order)
    .map((era) => ({ id: era.id, title: era.title, url: certificateLink(site, { eraId: era.id }) })),
];

const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

rmSync("qr-codes", { recursive: true, force: true });
mkdirSync("qr-codes");
const cards = codes.map(({ id, title, url }) => {
  const svg = renderToStaticMarkup(
    createElement(QRCodeSVG, { value: url, size: 600, level: "M", marginSize: 4, title: `Certificate: ${title}` }),
  );
  writeFileSync(`qr-codes/${id}.svg`, `<?xml version="1.0" encoding="UTF-8"?>\n${svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')}\n`);
  console.log(`qr-codes/${id}.svg  ${url}`);
  return `<figure><img src="${id}.svg" alt="QR code for ${escape(title)}"><figcaption><strong>${escape(title)}</strong><br>${escape(url)}</figcaption></figure>`;
});

writeFileSync(
  "qr-codes/print.html",
  `<!doctype html>
<meta charset="utf-8">
<title>Certificate QR codes</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 1cm; }
  main { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1cm; }
  figure { margin: 0; text-align: center; break-inside: avoid; }
  img { width: 7cm; height: 7cm; }
  figcaption { font-size: 11pt; word-break: break-all; }
</style>
<h1>Certificate QR codes</h1>
<main>
${cards.join("\n")}
</main>
`,
);
console.log("Open qr-codes/print.html in a browser to print them all.");
