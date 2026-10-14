import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getStore, validateContent } from "../lib/store/index.js";

const ContentContext = createContext(null);

// Loads content once from the content store (dev server in a browser, the kiosk's
// own storage in the Android app) and shares it with every screen.
export function ContentProvider({ children }) {
  const [store, setStore] = useState(null);
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);

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
  }, []);

  const value = useMemo(
    () => ({ content, error, reload, store, ...helpers(content, store) }),
    [content, error, reload, store]
  );
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

// Content the screens can't show is reported as a load error instead of crashing them.
async function loadChecked(store) {
  const content = await store.loadContent();
  const problem = validateContent(content);
  if (problem) throw new Error(`The content can't be shown: ${problem}`);
  return content;
}

export function useContent() {
  return useContext(ContentContext);
}

function helpers(content, store) {
  if (!content || !store) return {};
  const published = content.events.filter((e) => e.published !== false);
  const byDate = (a, b) => a.date.sort.localeCompare(b.date.sort);

  return {
    eras: [...content.eras].sort((a, b) => a.order - b.order),
    eraById: (id) => content.eras.find((e) => e.id === id),
    eventsForEra: (eraId) => published.filter((e) => e.eraIds.includes(eraId)).sort(byDate),
    eventById: (id) => published.find((e) => e.id === id),
    mediaById: (id) => content.media.find((m) => m.id === id),
    mediaUrl: (item) => store.mediaUrl(item),
    questionsForEvent: (id) => content.questions.filter((q) => q.eventId === id),
  };
}
