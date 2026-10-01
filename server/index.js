// Local kiosk server. Serves the built app, the content file, and media.
// No database: content lives in data/content.json, media in data/media/.
import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile, rename, mkdir, readdir, unlink } from "node:fs/promises";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const DIST_DIR = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT) || 5050;
const HOST = process.env.HOST || "127.0.0.1";
const MAX_BACKUPS = 20;
const SESSION_MINUTES = 30;

const app = express();
app.use(express.json({ limit: "5mb" }));

// ---------- Admin auth ----------
// Sessions live in memory; restarting the server logs everyone out (fine for a kiosk).
const sessions = new Map(); // token -> expiry timestamp

function checkPin(pin) {
  const stored = process.env.ADMIN_PIN_HASH;
  if (!stored) {
    console.warn("ADMIN_PIN_HASH is not set. Using development PIN 1234.");
    return pin === "1234";
  }
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(String(pin), salt, expected.length);
  return timingSafeEqual(expected, actual);
}

function requireAdmin(req, res, next) {
  const token = req.get("Authorization")?.replace("Bearer ", "");
  const expiry = token && sessions.get(token);
  if (!expiry || expiry < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ error: "Sign in again to continue." });
  }
  sessions.set(token, Date.now() + SESSION_MINUTES * 60_000);
  next();
}

app.post("/api/auth", (req, res) => {
  if (!checkPin(req.body?.pin ?? "")) {
    return res.status(401).json({ error: "That PIN isn't correct." });
  }
  const token = randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_MINUTES * 60_000);
  res.json({ token });
});

app.post("/api/logout", (req, res) => {
  sessions.delete(req.get("Authorization")?.replace("Bearer ", ""));
  res.json({ ok: true });
});

// ---------- Content ----------
app.get("/api/content", async (_req, res) => {
  try {
    res.type("json").send(await readFile(CONTENT_FILE, "utf8"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not read content.json." });
  }
});

function validateContent(c) {
  if (!c || typeof c !== "object") return "Content must be an object.";
  for (const key of ["eras", "events", "media", "questions"]) {
    if (!Array.isArray(c[key])) return `Content is missing the "${key}" list.`;
  }
  return null;
}

app.put("/api/content", requireAdmin, async (req, res) => {
  const problem = validateContent(req.body);
  if (problem) return res.status(400).json({ error: problem });

  try {
    // 1. Back up the current file. 2. Write to a temp file. 3. Rename over the original.
    // A crash mid-save can never leave a half-written content.json.
    await mkdir(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await writeFile(path.join(BACKUP_DIR, `content-${stamp}.json`), await readFile(CONTENT_FILE));
    const tmp = `${CONTENT_FILE}.tmp`;
    await writeFile(tmp, JSON.stringify(req.body, null, 2));
    await rename(tmp, CONTENT_FILE);

    const backups = (await readdir(BACKUP_DIR)).sort();
    for (const old of backups.slice(0, Math.max(0, backups.length - MAX_BACKUPS))) {
      await unlink(path.join(BACKUP_DIR, old));
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save content. Nothing was changed." });
  }
});

// Media upload (used by backup import in the browser). One raw file per request.
// TODO (media issue): generate thumb / display / zoom sizes with `sharp`.
app.post(
  "/api/media/:name",
  requireAdmin,
  express.raw({ type: () => true, limit: "2gb" }),
  async (req, res) => {
    const name = req.params.name;
    if (!/^[\w][\w.-]{0,199}$/.test(name)) return res.status(400).json({ error: "Unsafe file name." });
    try {
      await mkdir(path.join(DATA_DIR, "media"), { recursive: true });
      const tmp = path.join(DATA_DIR, "media", `${name}.tmp`);
      await writeFile(tmp, req.body);
      await rename(tmp, path.join(DATA_DIR, "media", name));
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Could not save ${name}.` });
    }
  }
);

// ---------- Static files ----------
app.use("/media", express.static(path.join(DATA_DIR, "media"), { maxAge: "1h" }));
app.use(express.static(DIST_DIR));
// Any other path returns the app, so routes like /era/apollo work after a refresh.
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) return next();
  res.sendFile(path.join(DIST_DIR, "index.html"), (err) => {
    if (err) res.status(404).send("App not built yet. Run `npm run build`, or use `npm run dev`.");
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Kiosk server running at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
});
