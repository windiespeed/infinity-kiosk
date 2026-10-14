// Rules for content.json, shared by the app, the dev server and the build check.
// Plain JavaScript with no imports, so Node can use it too.
//
// Every save and every backup import is checked here first. Content the screens
// can't display (a missing field, a list that isn't a list) would crash the app,
// and on the kiosk that crash would come back after every restart.

// Media file names must be plain names: no folders, no "..".
export const SAFE_NAME = /^[\w][\w.-]{0,199}$/;

// Allowed range for settings.idleSeconds (the admin dashboard uses the same limits).
export const IDLE_MIN = 30;
export const IDLE_MAX = 600;

const isObject = (v) => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const isText = (v) => typeof v === "string" && v.trim() !== "";
const isNumber = (v) => typeof v === "number" && Number.isFinite(v);

// Returns a sentence describing the first problem found, or null if the content is fine.
export function validateContent(c) {
  if (!isObject(c)) return "Content must be an object.";
  for (const key of ["eras", "events", "media", "questions"]) {
    if (!Array.isArray(c[key])) return `Content is missing the "${key}" list.`;
  }

  const s = c.settings;
  if (!isObject(s)) return 'Content is missing its "settings".';
  if (!Number.isInteger(s.idleSeconds) || s.idleSeconds < IDLE_MIN || s.idleSeconds > IDLE_MAX) {
    return `settings.idleSeconds must be a whole number from ${IDLE_MIN} to ${IDLE_MAX}.`;
  }
  if (!Number.isInteger(s.warningSeconds) || s.warningSeconds < 5) {
    return "settings.warningSeconds must be a whole number of at least 5.";
  }

  const ids = (list, name) => {
    const seen = new Set();
    for (const [i, item] of list.entries()) {
      if (!isObject(item) || !isText(item.id)) return `${name} #${i + 1} has no id.`;
      if (seen.has(item.id)) return `Two ${name}s share the id "${item.id}".`;
      seen.add(item.id);
    }
    return null;
  };

  const problem =
    ids(c.eras, "era") || ids(c.events, "event") || ids(c.media, "media item") || ids(c.questions, "question");
  if (problem) return problem;

  for (const era of c.eras) {
    const where = `Era "${era.id}"`;
    if (!isText(era.title)) return `${where} has no title.`;
    if (!isNumber(era.order)) return `${where} needs a number for "order".`;
    if (!isNumber(era.startYear)) return `${where} needs a number for "startYear".`;
    if (era.endYear != null && !isNumber(era.endYear)) return `${where} has an "endYear" that isn't a number.`;
  }

  for (const ev of c.events) {
    const where = `Event "${ev.id}"`;
    if (!Array.isArray(ev.eraIds) || !ev.eraIds.length || !ev.eraIds.every(isText)) {
      return `${where} must belong to at least one era.`;
    }
    if (!isObject(ev.date) || !isText(ev.date.sort) || !isText(ev.date.display)) {
      return `${where} needs a date with "sort" and "display".`;
    }
    for (const key of ["title", "shortTitle"]) {
      if (!isText(ev[key])) return `${where} has no ${key}.`;
    }
    for (const key of ["summary", "body"]) {
      if (typeof ev[key] !== "string") return `${where} has no ${key} text.`;
    }
    if (!Array.isArray(ev.mediaIds)) return `${where} is missing its "mediaIds" list.`;
  }

  for (const m of c.media) {
    if (typeof m.file !== "string" || !SAFE_NAME.test(m.file)) {
      return `Media item "${m.id}" has a missing or unsafe file name.`;
    }
  }

  for (const q of c.questions) {
    if (!isText(q.eventId)) return `Question "${q.id}" isn't linked to an event.`;
  }

  return null;
}
