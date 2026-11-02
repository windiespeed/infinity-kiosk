// Helpers for the admin media library: file names, ids, shrinking photos,
// saving files in pieces, and finding where a media item is used.

export const MAX_PHOTO_SIDE = 2560; // longest side, in pixels, of photos saved to the kiosk
export const BIG_VIDEO_BYTES = 300 * 1024 * 1024;
const READ_PIECE = 4 * 1024 * 1024;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4"];

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/\.[^.]*$/, "") // drop the extension
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "file";

// "Apollo 11 Launch (1).JPG" -> "apollo-11-launch-1.jpg", made unique against `taken`.
export function cleanFileName(original, taken, ext = original.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? "bin") {
  const base = slug(original);
  let name = `${base}.${ext}`;
  for (let n = 2; taken.has(name); n++) name = `${base}-${n}.${ext}`;
  return name;
}

// Every file name already in use (media files, posters, captions).
export function takenFileNames(content) {
  return new Set(content.media.flatMap((m) => [m.file, m.poster, m.captionsFile].filter(Boolean)));
}

// "img-apollo-11-launch" / "vid-stennis-overview", unique among media ids.
export function newMediaId(fileName, type, content) {
  const base = `${type === "video" ? "vid" : "img"}-${slug(fileName)}`;
  let id = base;
  for (let n = 2; content.media.some((m) => m.id === id); n++) id = `${base}-${n}`;
  return id;
}

// Photos bigger than MAX_PHOTO_SIDE are shrunk in the browser (JPEG, quality 0.85),
// so the kiosk never has to load huge photos. Smaller photos are kept as they are.
// Returns { blob, ext, resized }.
export async function preparePhoto(file) {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= MAX_PHOTO_SIDE) {
    bitmap.close();
    return { blob: file, ext: null, resized: false };
  }
  const scale = MAX_PHOTO_SIDE / longest;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't shrink the photo."))), "image/jpeg", 0.85)
  );
  return { blob, ext: "jpg", resized: true };
}

// Saves a file (or blob) to the kiosk's media folder, reading it in pieces so a
// large video is never in memory all at once. onProgress gets 0..1.
export async function saveMediaFile(store, blob, name, session, onProgress) {
  const writer = await store.openMediaWriter(name, session);
  for (let offset = 0; offset < blob.size; offset += READ_PIECE) {
    await writer.write(new Uint8Array(await blob.slice(offset, offset + READ_PIECE).arrayBuffer()));
    onProgress?.(Math.min(1, (offset + READ_PIECE) / blob.size));
  }
  await writer.close();
  onProgress?.(1);
}

// Where a media item is used: events showing it (an era's card shows its first event's photo),
// and whether it's the welcome screen video.
export function mediaUsage(content, id) {
  return {
    events: content.events.filter((ev) => ev.mediaIds.includes(id)),
    attract: content.settings.attractVideo === id,
  };
}

export const isUsed = (usage) => usage.events.length > 0 || usage.attract;

export const formatBytes = (bytes) =>
  bytes >= 1024 * 1024 * 1024
    ? `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
    : `${Math.max(1, Math.round(bytes / 1024 / 1024))} MB`;
