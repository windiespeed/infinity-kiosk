// Copies the team's photos and videos from the shared Google Drive "Media" folder
// (synced to this computer by Google Drive for desktop) into data/media/, then lists
// any files content.json uses that are still missing.
//
//   npm run media:pull                         uses MEDIA_DRIVE_DIR from .env, or finds
//                                              "My Drive/Media" on its own
//   npm run media:pull -- "G:\My Drive\Media"  uses this folder once
//
// Only new or changed files are copied. Nothing in data/media/ is ever deleted, and
// subfolders (like Kiosk-Backups) are skipped.
import "dotenv/config";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { extname, join, resolve } from "node:path";

const MEDIA_DIR = resolve("data/media");
const MEDIA_TYPES = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".mp4", ".vtt"]);

// Where Google Drive for desktop usually puts "My Drive", on Windows and on a Mac.
function guessDriveFolder() {
  const candidates = [];
  for (const letter of "GHIJKLMNOPQRSTUVWXYZ") candidates.push(`${letter}:\\My Drive\\Media`);
  const cloud = join(homedir(), "Library", "CloudStorage");
  if (existsSync(cloud)) {
    for (const name of readdirSync(cloud)) {
      if (name.startsWith("GoogleDrive")) candidates.push(join(cloud, name, "My Drive", "Media"));
    }
  }
  return candidates.find((dir) => existsSync(dir));
}

const source = process.argv[2] || process.env.MEDIA_DRIVE_DIR || guessDriveFolder();
if (!source || !existsSync(source)) {
  console.error(
    source
      ? `Can't find the Media folder at: ${source}`
      : "Can't find the team's Media folder on this computer.",
  );
  console.error(
    "Install Google Drive for desktop, add the shared Media folder to My Drive, then either\n" +
      "set MEDIA_DRIVE_DIR in .env to that folder or run:  npm run media:pull -- \"<path to Media>\"",
  );
  process.exit(1);
}

mkdirSync(MEDIA_DIR, { recursive: true });
let copied = 0;
let current = 0;
for (const name of readdirSync(source)) {
  const from = join(source, name);
  if (!statSync(from).isFile() || !MEDIA_TYPES.has(extname(name).toLowerCase())) continue;
  const to = join(MEDIA_DIR, name);
  const src = statSync(from);
  if (existsSync(to)) {
    const dest = statSync(to);
    if (dest.size === src.size && dest.mtimeMs >= src.mtimeMs) {
      current++;
      continue;
    }
  }
  copyFileSync(from, to);
  console.log(`  copied  ${name}`);
  copied++;
}
console.log(`From ${source}: ${copied} copied, ${current} already up to date.`);

// Which files does content.json point to that aren't in data/media/ yet?
const content = JSON.parse(readFileSync("data/content.json", "utf8"));
const wanted = new Set();
for (const item of content.media ?? []) {
  for (const key of ["file", "poster", "captionsFile"]) if (item[key]) wanted.add(item[key]);
}
const missing = [...wanted].filter((file) => !existsSync(join(MEDIA_DIR, file)));
if (missing.length) {
  console.log(`\ncontent.json uses ${missing.length} file(s) that aren't in data/media/ yet:`);
  for (const file of missing) console.log(`  missing  ${file}`);
  console.log("Add them to the Drive Media folder under exactly these names, then run this again.");
} else {
  console.log("Every file content.json uses is in data/media/.");
}
