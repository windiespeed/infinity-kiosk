// Backup files: one .zip holding content.json plus every media file.
// The same file is used to back up the kiosk AND to move content prepared
// on a laptop onto the kiosk. Both directions stream in pieces, so large
// videos never have to fit in memory at once.
import { Zip, ZipDeflate, Unzip, UnzipInflate } from "fflate";
import { SAFE_NAME, validateContent } from "./store/index.js";

const READ_CHUNK = 4 * 1024 * 1024;

export async function exportBackup(store, content) {
  const name = `infinity-kiosk-backup-${new Date().toISOString().slice(0, 10)}.zip`;
  const out = await store.openBackupWriter(name);
  const skipped = [];
  let pending = Promise.resolve();
  let failure = null;

  const zip = new Zip((err, chunk) => {
    if (err) failure = err;
    else pending = pending.then(() => out.write(chunk));
  });

  // Level 0 = no compression (photos and videos are already compressed),
  // but still a deflate stream, so the file can be read back in pieces.
  const add = (path) => {
    const entry = new ZipDeflate(path, { level: 0 });
    zip.add(entry);
    return entry;
  };

  add("content.json").push(new TextEncoder().encode(JSON.stringify(content, null, 2)), true);
  await pending;

  const files = [...new Set(content.media.map((m) => m.file))];
  for (const file of files) {
    const item = content.media.find((m) => m.file === file);
    let res;
    try {
      res = await fetch(store.mediaUrl(item));
      if (!res.ok || !res.body) throw new Error();
    } catch {
      skipped.push(file);
      continue;
    }
    const entry = add(`media/${file}`);
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      entry.push(value);
      await pending;
      if (failure) throw failure;
    }
    entry.push(new Uint8Array(0), true);
    await pending;
  }

  zip.end();
  await pending;
  if (failure) throw failure;
  const where = await out.close();
  return { where, skipped };
}

// Reads a backup in two passes. The first finds content.json and checks it, so a
// damaged or wrong zip is refused before any of the kiosk's media is replaced.
// The second writes the media files.
export async function importBackup(store, file, session, onProgress) {
  const content = await readBackupContent(file);
  const problem = validateContent(content);
  if (problem) throw new Error(problem);

  const written = [];
  let pending = Promise.resolve();
  let failure = null;

  const unzip = new Unzip((entry) => {
    const match = entry.name.match(/^media\/([^/]+)$/);
    if (!match || !SAFE_NAME.test(match[1])) return; // ignore anything else in the zip
    const name = match[1];
    let writer = null;
    entry.ondata = (err, data, final) => {
      if (err) return void (failure = err);
      pending = pending.then(async () => {
        writer ??= await store.openMediaWriter(name, session);
        if (data.length) await writer.write(data);
        if (final) {
          await writer.close();
          written.push(name);
        }
      });
    };
    entry.start();
  });
  unzip.register(UnzipInflate);

  for (let offset = 0; offset < file.size; offset += READ_CHUNK) {
    const bytes = new Uint8Array(await file.slice(offset, offset + READ_CHUNK).arrayBuffer());
    unzip.push(bytes, offset + READ_CHUNK >= file.size);
    await pending;
    if (failure) throw failure;
    onProgress?.(Math.min(1, (offset + READ_CHUNK) / file.size));
  }
  await pending;

  const missing = content.media.map((m) => m.file).filter((f) => !written.includes(f));
  return { content, mediaCount: written.length, missing };
}

// First pass: returns the parsed content.json. Exports put it first in the zip,
// so this usually stops after the first piece of the file.
async function readBackupContent(file) {
  let contentText = null;
  let failure = null;

  const unzip = new Unzip((entry) => {
    if (entry.name !== "content.json") return;
    const parts = [];
    entry.ondata = (err, data, final) => {
      if (err) return void (failure = err);
      parts.push(data);
      if (final) contentText = new TextDecoder().decode(concat(parts));
    };
    entry.start();
  });
  unzip.register(UnzipInflate);

  for (let offset = 0; offset < file.size && contentText === null; offset += READ_CHUNK) {
    const bytes = new Uint8Array(await file.slice(offset, offset + READ_CHUNK).arrayBuffer());
    unzip.push(bytes, offset + READ_CHUNK >= file.size);
    if (failure) throw failure;
  }

  if (!contentText) throw new Error("This file has no content.json, so it isn't a kiosk backup.");
  try {
    return JSON.parse(contentText);
  } catch {
    throw new Error("The backup's content.json is damaged.");
  }
}

function concat(parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}
