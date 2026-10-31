import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getStore, validateContent } from "../lib/store/index.js";
import { useKiosk } from "../store/useKiosk.js";

const ContentContext = createContext(null);

// Loads content once from the content store (dev server in a browser, the kiosk's
// own storage in the Android app) and shares it with every screen.
export function ContentProvider({ children }) {
  const [store, setStore] = useState(null);
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  // Signed-in staff also see hidden events, so they can preview them before publishing.
  const showHidden = useKiosk((s) => Boolean(s.adminToken));

  useEffect(() => {
    (async () => {
      try {
        const s = await getStore();
        setStore(s);
        setContent(await loadChecked(s));
      } catch (err) {
        console.error(err);
        setError(err);
      }
    })();
  }, []);

  const reload = useCallback(async () => {
    const s = await getStore();
    setContent(await loadChecked(s));
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ content, error, reload, store, ...helpers(content, store, showHidden) }),
    [content, error, reload, store, showHidden]
  );
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

// Content the screens can't show is reported as a load error instead of crashing them.
async function loadChecked(store) {
  const content = await store.loadContent();
  const problem = validateContent(content);
  if (problem) {
    const err = new Error(`The content can't be shown: ${problem}`);
    err.code = "content-rejected";
    throw err;
  }
  return content;
}

export function useContent() {
  return useContext(ContentContext);
}

function helpers(content, store, showHidden) {
  if (!content || !store) return {};
  const published = showHidden ? content.events : content.events.filter((e) => e.published !== false);
  const byDate = (a, b) => a.date.sort.localeCompare(b.date.sort);

  // Photo for an event card: the event's first photo (videos are skipped).
  const eventCover = (ev) =>
    (ev.mediaIds ?? []).map((id) => content.media.find((m) => m.id === id)).find((m) => m && m.type !== "video");

  // An era card shows the first photo of the era's earliest event that has one.
  // Only events visitors can see count, so the card looks the same in admin preview.
  const eraCoverEvent = (eraId) =>
    content.events
      .filter((e) => e.published !== false && e.eraIds.includes(eraId))
      .sort(byDate)
      .find((e) => eventCover(e));

  return {
    eras: [...content.eras].sort((a, b) => a.order - b.order),
    eraById: (id) => content.eras.find((e) => e.id === id),
    eventsForEra: (eraId) => published.filter((e) => e.eraIds.includes(eraId)).sort(byDate),
    eventById: (id) => published.find((e) => e.id === id),
    mediaById: (id) => content.media.find((m) => m.id === id),
    eventCover,
    eraCoverEvent,
    eraCover: (eraId) => {
      const ev = eraCoverEvent(eraId);
      return ev && eventCover(ev);
    },
    mediaUrl: (item) => store.mediaUrl(item),
    questionsForEvent: (id) => content.questions.filter((q) => q.eventId === id),
  };
}
