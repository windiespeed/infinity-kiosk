import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ContentContext = createContext(null);

// Loads data/content.json from the local server once and shares it with every screen.
export function ContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/content");
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      setContent(await res.json());
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => ({ content, error, reload, ...helpers(content) }), [content, error, reload]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  return useContext(ContentContext);
}

function helpers(content) {
  if (!content) return {};
  const published = content.events.filter((e) => e.published !== false);
  const byDate = (a, b) => a.date.sort.localeCompare(b.date.sort);

  return {
    eras: [...content.eras].sort((a, b) => a.order - b.order),
    eraById: (id) => content.eras.find((e) => e.id === id),
    eventsForEra: (eraId) => published.filter((e) => e.eraIds.includes(eraId)).sort(byDate),
    eventById: (id) => published.find((e) => e.id === id),
    mediaById: (id) => content.media.find((m) => m.id === id),
    questionsForEvent: (id) => content.questions.filter((q) => q.eventId === id),
  };
}
