import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useContent } from "../hooks/useContent.jsx";
import { achievementText, todayIso } from "../lib/certificate.js";
import logoUrl from "../assets/infinity-logo-white.png";

const W = 1600;
const H = 1131;

function parseDate(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d ?? "");
  if (!m) return null;
  const date = new Date(+m[1], +m[2] - 1, +m[3]);
  return Number.isNaN(date.getTime()) ? null : date;
}

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// The logo and Montserrat must be ready before drawing, or the canvas uses a fallback font.
let assetsReady;
function loadAssets() {
  assetsReady ??= Promise.all([
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null); // draw without the logo rather than not at all
      img.src = logoUrl;
    }),
    document.fonts?.load("700 64px Montserrat"),
    document.fonts?.load("400 40px Montserrat"),
    document.fonts?.load("italic 400 36px Montserrat"),
  ]).then(([logo]) => logo);
  return assetsReady;
}

// Gold four-point star, like the timeline markers on the wall.
function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const len = i % 2 === 0 ? r : r * 0.28;
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
  }
  ctx.closePath();
  ctx.fill();
}

function spaced(ctx, px) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
}

// Wall style: charcoal-to-slate background, gold frame, headings and stars, white logo.
function draw(canvas, logo, name, line, dateText) {
  const ctx = canvas.getContext("2d");
  const gold = cssVar("--color-accent", "#D9B15C");
  const muted = cssVar("--color-text-muted", "#B4C4DC");

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, cssVar("--color-bg", "#1E1F23"));
  bg.addColorStop(1, cssVar("--color-bg-glow", "#38475E"));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = gold;
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 2;
  ctx.strokeRect(62, 62, W - 124, H - 124);
  ctx.fillStyle = gold;
  for (const [x, y] of [[62, 62], [W - 62, 62], [62, H - 62], [W - 62, H - 62]]) star(ctx, x, y, 30);

  if (logo) {
    const lw = 400;
    const lh = (logo.height / logo.width) * lw;
    ctx.drawImage(logo, (W - lw) / 2, 110, lw, lh);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = gold;
  ctx.font = "700 68px Montserrat, sans-serif";
  spaced(ctx, 6);
  ctx.fillText("CERTIFICATE OF COMPLETION", W / 2, 380);
  spaced(ctx, 0);

  ctx.fillStyle = muted;
  ctx.font = "400 38px Montserrat, sans-serif";
  ctx.fillText("This certifies that", W / 2, 460);

  // Shrink the name until it fits
  const display = name.trim() || "Your name";
  let size = 110;
  ctx.font = `700 ${size}px Montserrat, sans-serif`;
  while (ctx.measureText(display).width > W - 320 && size > 40) {
    size -= 4;
    ctx.font = `700 ${size}px Montserrat, sans-serif`;
  }
  ctx.fillStyle = name.trim() ? "#FFFFFF" : muted;
  ctx.fillText(display, W / 2, 600);

  ctx.fillStyle = gold;
  ctx.fillRect(W / 2 - 360, 640, 720, 3);
  star(ctx, W / 2, 641, 16);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "400 42px Montserrat, sans-serif";
  ctx.fillText(line, W / 2, 730);

  ctx.fillStyle = gold;
  ctx.font = "italic 400 36px Montserrat, sans-serif";
  ctx.fillText("Mississippi and the Space Age", W / 2, 800);

  ctx.fillStyle = muted;
  ctx.font = "400 34px Montserrat, sans-serif";
  if (dateText) ctx.fillText(dateText, W / 2, 960);
}

export default function Certificate() {
  const [params] = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [created, setCreated] = useState(false); // false = form, true = certificate only
  const [status, setStatus] = useState("");
  const canvasRef = useRef(null);
  const headingRef = useRef(null);
  const firstId = useId();
  const lastId = useId();

  const fullName = [firstName, lastName].map((s) => s.trim()).filter(Boolean).join(" ");

  // ?era=<eraId> names the era quiz; no era (or one that no longer exists) means the whole timeline.
  const { eraById } = useContent();
  const line = achievementText(eraById(params.get("era") ?? ""));

  // Printed QR codes have no date, so they use the day the phone opens the page.
  const dateText = useMemo(() => {
    const d = parseDate(params.get("d")) ?? parseDate(todayIso());
    return d.toLocaleDateString(undefined, { dateStyle: "long" });
  }, [params]);

  // The canvas only exists on the certificate view, so redraw when that view opens
  useEffect(() => {
    if (!created) return undefined;
    let current = true;
    loadAssets().then((logo) => {
      if (current && canvasRef.current) draw(canvasRef.current, logo, fullName, line, dateText);
    });
    return () => {
      current = false;
    };
  }, [created, fullName, line, dateText]);

  // Move screen-reader focus to the heading when the view changes
  useEffect(() => {
    headingRef.current?.focus();
  }, [created]);

  const alt = `Certificate of completion: ${fullName} ${line}, ${dateText}`;

  function handleSubmit(e) {
    e.preventDefault();
    if (!fullName) return;
    setStatus("");
    setCreated(true);
  }

  async function save() {
    const canvas = canvasRef.current;
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return setStatus("Sorry, the image could not be created.");
    const file = new File([blob], "certificate.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My certificate" });
        return setStatus("Shared.");
      } catch (err) {
        if (err.name === "AbortError") return; // closed the share sheet
        // otherwise fall through to download
      }
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "certificate.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setStatus("Certificate downloaded.");
  }

  if (!created) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl">Get your certificate</h1>
        <p className="mt-2 text-lg">Congratulations! You {line}. Type your name to make your certificate.</p>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
          <div>
            <label htmlFor={firstId} className="block text-lg">First name</label>
            <input
              id={firstId}
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              maxLength={30}
              required
              className="mt-1 w-full rounded-lg border-2 p-3 text-lg"
            />
          </div>
          <div>
            <label htmlFor={lastId} className="block text-lg">Last name</label>
            <input
              id={lastId}
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              maxLength={30}
              required
              className="mt-1 w-full rounded-lg border-2 p-3 text-lg"
            />
          </div>
          <p className="text-sm text-text-muted">Your name stays on this phone. It is never sent anywhere.</p>
          <button type="submit" className="w-full rounded-lg bg-accent p-4 text-lg font-bold text-on-accent">
            Create certificate
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">Your certificate</h1>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={alt}
        className="h-auto w-full"
      >
        {alt}
      </canvas>
      <p className="sr-only">{alt}</p>

      <button type="button" onClick={save} className="mt-4 w-full rounded-lg bg-accent p-4 text-lg font-bold text-on-accent">
        Save certificate as image
      </button>
      <button type="button" onClick={() => setCreated(false)} className="mt-3 w-full p-3 text-lg underline">
        Change name
      </button>
      <p role="status" aria-live="polite" className="mt-2 min-h-6 text-center">{status}</p>
    </div>
  );
}