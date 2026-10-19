import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";

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

function draw(canvas, name, dateText) {
  const ctx = canvas.getContext("2d");
  const accent = cssVar("--color-accent", "#c8552b");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 16;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  ctx.textAlign = "center";
  ctx.fillStyle = "#111111";
  ctx.font = "bold 84px Georgia, serif";
  ctx.fillText("Certificate of Completion", W / 2, 260);


  ctx.font = "40px Georgia, serif";
  ctx.fillText("This certifies that", W / 2, 400);

  // Shrink the name until it fits
  const display = name.trim() || "Your name";
  let size = 120;
  ctx.font = `bold ${size}px Georgia, serif`;
  while (ctx.measureText(display).width > W - 300 && size > 40) {
    size -= 4;
    ctx.font = `bold ${size}px Georgia, serif`;
  }
  ctx.fillStyle = name.trim() ? accent : "#999999";
  ctx.fillText(display, W / 2, 570);

  ctx.fillStyle = "#111111";
  ctx.font = "40px Georgia, serif";
  ctx.fillText("completed the Timeline Challenge", W / 2, 700);
  ctx.fillText("Mississippi and the Space Age", W / 2, 765);
  if (dateText) ctx.fillText(dateText, W / 2, 900);
  // Logo goes here once Windie confirms it may be used.
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

  const dateText = useMemo(() => {
    const d = parseDate(params.get("d"));
    return d ? d.toLocaleDateString(undefined, { dateStyle: "long" }) : "";
  }, [params]);

  // The canvas only exists on the certificate view, so redraw when that view opens
  useEffect(() => {
    if (created && canvasRef.current) draw(canvasRef.current, fullName, dateText);
  }, [created, fullName, dateText]);

  // Move screen-reader focus to the heading when the view changes
  useEffect(() => {
    headingRef.current?.focus();
  }, [created]);

  const alt = `Certificate for ${fullName}${dateText ? `, completed ${dateText}` : ""}`;

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
      <main className="mx-auto max-w-xl p-4">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl">Get your certificate</h1>
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
          <button type="submit" className="w-full rounded-lg bg-accent p-4 text-lg font-bold">
            Create certificate
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">Your certificate</h1>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={alt}
        className="h-auto w-full border"
      >
        {alt}
      </canvas>
      <p className="sr-only">{alt}</p>

      <button type="button" onClick={save} className="mt-4 w-full rounded-lg bg-accent p-4 text-lg font-bold">
        Save certificate as image
      </button>
      <button type="button" onClick={() => setCreated(false)} className="mt-3 w-full p-3 text-lg underline">
        Change name
      </button>
      <p role="status" aria-live="polite" className="mt-2 min-h-6 text-center">{status}</p>
    </main>
  );
}