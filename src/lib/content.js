// Rules for content.json, shared by the app, the dev server and the build check.
// Plain JavaScript with no imports, so Node can use it too.
//
// Every save and every backup import is checked here first. Content the screens
// can't display (a missing field, a list that isn't a list) would crash the app,
// and on the kiosk that crash would come back after every restart.
//
// The *Problems functions check one item at a time and return { field: "message" },
// so the admin forms can show each message next to its field. An empty object means
// the item is fine. validateContent runs the same checks over the whole file.

// Media file names must be plain names: no folders, no "..".
export const SAFE_NAME = /^[\w][\w.-]{0,199}$/;

// Allowed range for settings.idleSeconds (the admin dashboard uses the same limits).
export const IDLE_MIN = 30;
export const IDLE_MAX = 600;

// Allowed range for settings.adminIdleMinutes, the admin sign-out time.
export const ADMIN_IDLE_MIN = 5;
export const ADMIN_IDLE_MAX = 30;
export const ADMIN_IDLE_DEFAULT = 10;

// The timeline point label has room for about this many characters.
export const SHORT_TITLE_MAX = 28;

// The event panel's photo carousel holds at most this many photos and videos.
export const EVENT_MEDIA_MAX = 3;

export const EVENT_STATUSES = ["historical", "planned", "ongoing"];

// Planned and ongoing events go out of date, so staff check them every 90 days.
export const REVIEW_DAYS = 90;
export function needsReview(ev, now = new Date()) {
  if (!["planned", "ongoing"].includes(ev.date?.status)) return false;
  if (!ev.reviewedAt) return true;
  return now - new Date(`${ev.reviewedAt}T00:00:00`) > REVIEW_DAYS * 24 * 60 * 60 * 1000;
}

const isObject = (v) => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const isText = (v) => typeof v === "string" && v.trim() !== "";
const isNumber = (v) => typeof v === "number" && Number.isFinite(v);

export function eraProblems(era) {
  const p = {};
  if (!isText(era.title)) p.title = "Enter a title.";
  if (!isNumber(era.order)) p.order = "Order must be a number.";
  if (!isNumber(era.startYear)) p.startYear = "Enter a start year.";
  if (era.endYear != null) {
    if (!isNumber(era.endYear)) p.endYear = "End year must be a number, or blank for Today.";
    else if (isNumber(era.startYear) && era.endYear < era.startYear) p.endYear = "End year can't be before the start year.";
  }
  return p;
}

// `c` is the whole content, used to check that eras and media the event points to exist.
export function eventProblems(ev, c) {
  const p = {};
  if (!Array.isArray(ev.eraIds) || !ev.eraIds.length || !ev.eraIds.every(isText)) {
    p.eraIds = "Pick at least one era.";
  } else if (c && ev.eraIds.some((id) => !c.eras.some((era) => era.id === id))) {
    p.eraIds = `Unknown era: ${ev.eraIds.filter((id) => !c.eras.some((era) => era.id === id)).join(", ")}.`;
  }
  if (!isObject(ev.date)) {
    p.date = 'Needs a date with "sort" and "display".';
  } else {
    if (!isText(ev.date.sort)) p.dateSort = "Enter a sort date.";
    else if (!/^-?\d{4}-\d{2}-\d{2}$/.test(ev.date.sort)) p.dateSort = "Use YYYY-MM-DD, like 1969-07-20.";
    if (!isText(ev.date.display)) p.dateDisplay = 'Enter the date to show, like "1969".';
    if (ev.date.status != null && !EVENT_STATUSES.includes(ev.date.status)) {
      p.status = `Status must be ${EVENT_STATUSES.join(", ")}.`;
    }
  }
  if (ev.reviewedAt != null && !/^\d{4}-\d{2}-\d{2}$/.test(ev.reviewedAt)) p.reviewedAt = "Review date must be YYYY-MM-DD.";
  if (!isText(ev.title)) p.title = "Enter a title.";
  if (!isText(ev.shortTitle)) p.shortTitle = "Enter a short title.";
  else if (ev.shortTitle.length > SHORT_TITLE_MAX) p.shortTitle = `Use ${SHORT_TITLE_MAX} characters or fewer.`;
  if (typeof ev.summary !== "string") p.summary = "Summary is missing.";
  if (typeof ev.body !== "string") p.body = "Body text is missing.";
  if (!Array.isArray(ev.mediaIds)) {
    p.mediaIds = 'Missing its "mediaIds" list.';
  } else if (ev.mediaIds.length > EVENT_MEDIA_MAX) {
    p.mediaIds = `Use ${EVENT_MEDIA_MAX} photos or videos at most.`;
  } else if (new Set(ev.mediaIds).size !== ev.mediaIds.length) {
    p.mediaIds = "The same photo is listed twice.";
  } else if (c) {
    const missing = ev.mediaIds.filter((id) => !c.media.some((m) => m.id === id));
    if (missing.length) p.mediaIds = `Not in the media library: ${missing.join(", ")}.`;
    const background = ev.mediaIds.filter((id) => c.media.some((m) => m.id === id && m.background));
    if (!missing.length && background.length) {
      p.mediaIds = `Background videos have no captions, so they can only be the welcome video: ${background.join(", ")}.`;
    }
  }
  return p;
}

export function mediaProblems(m) {
  const p = {};
  if (typeof m.file !== "string" || !SAFE_NAME.test(m.file)) p.file = "Missing or unsafe file name.";
  // Existing media entries without a type remain valid as images.
  if (m.type != null && !["image", "video"].includes(m.type)) {
    p.type = 'Unsupported type. Use "image" or "video".';
  }
  if (m.background != null && (typeof m.background !== "boolean" || m.type !== "video")) {
    p.background = "Only a video can be a background video.";
  }
  if (m.type === "video") {
    // A background video plays muted behind the welcome screen, so it needs no captions.
    if (!(m.background && m.captionsFile == null)) {
      if (!isText(m.captionsFile) || !SAFE_NAME.test(m.captionsFile)) p.captionsFile = "Add a captions file (.vtt).";
      else if (!/\.vtt$/i.test(m.captionsFile)) p.captionsFile = "The captions file must be a .vtt file.";
    }
    if (!isText(m.poster) || !SAFE_NAME.test(m.poster)) p.poster = "Add a poster image.";
  } else if (!isText(m.alt)) {
    p.alt = "Describe what the image shows.";
  }
  return p;
}

export function questionProblems(q, c) {
  const p = {};
  if (!isText(q.eventId)) p.eventId = "Not linked to an event.";
  else if (c && !c.events.some((ev) => ev.id === q.eventId)) p.eventId = `Event "${q.eventId}" doesn't exist.`;
  if (!isText(q.prompt)) p.prompt = "Enter the question.";
  if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 4) {
    p.choices = "Give 2 to 4 choices.";
  } else if (!q.choices.every(isText)) {
    p.choices = "Fill in every choice, or remove the empty one.";
  } else if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.choices.length) {
    p.correctIndex = "Mark one choice as correct.";
  }
  if (!isText(q.explanation)) p.explanation = "Explain the answer.";
  return p;
}

export function settingsProblems(s, c) {
  const p = {};
  if (!Number.isInteger(s.idleSeconds) || s.idleSeconds < IDLE_MIN || s.idleSeconds > IDLE_MAX) {
    p.idleSeconds = `Enter a whole number from ${IDLE_MIN} to ${IDLE_MAX}.`;
  }
  if (!Number.isInteger(s.warningSeconds) || s.warningSeconds < 5) {
    p.warningSeconds = "Enter a whole number of at least 5.";
  }
  if (s.adminIdleMinutes != null) {
    const n = s.adminIdleMinutes;
    if (!Number.isInteger(n) || n < ADMIN_IDLE_MIN || n > ADMIN_IDLE_MAX) {
      p.adminIdleMinutes = `Enter a whole number from ${ADMIN_IDLE_MIN} to ${ADMIN_IDLE_MAX}.`;
    }
  }
  // The attract video setting refers to a video media item's ID, not a filename.
  if (s.attractVideo != null) {
    const video = isText(s.attractVideo) && c?.media.find((m) => m.id === s.attractVideo);
    if (!video || video.type !== "video") p.attractVideo = "Pick a video from the media library, or none.";
  }
  return p;
}

const first = (problems) => Object.values(problems)[0] ?? null;

// Returns a sentence describing the first problem found, or null if the content is fine.
export function validateContent(c) {
  if (!isObject(c)) return "Content must be an object.";
  for (const key of ["eras", "events", "media", "questions"]) {
    if (!Array.isArray(c[key])) return `Content is missing the "${key}" list.`;
  }

  if (!isObject(c.settings)) return 'Content is missing its "settings".';
  const settings = first(settingsProblems(c.settings, c));
  if (settings) return `Settings: ${settings}`;

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

  const checks = [
    [c.eras, "Era", (era) => eraProblems(era)],
    [c.events, "Event", (ev) => eventProblems(ev, c)],
    [c.media, "Media item", (m) => mediaProblems(m)],
    [c.questions, "Question", (q) => questionProblems(q, c)],
  ];
  for (const [list, name, check] of checks) {
    for (const item of list) {
      const message = first(check(item));
      if (message) return `${name} "${item.id}": ${message}`;
    }
  }

  return null;
}
