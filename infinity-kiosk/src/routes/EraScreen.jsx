import { useEffect, useRef } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useContent } from "../hooks/useContent.jsx";
import EventPanel from "../components/EventPanel.jsx";
import { buttonClass } from "../lib/ui.js";
import { eraYears } from "../lib/format.js";

// One era: title on top, its events as a timeline in the lower part of the screen,
// previous/next era buttons at the sides. /era/:eraId/event/:eventId opens the panel.
export default function EraScreen() {
  const { eraId, eventId } = useParams();
  const navigate = useNavigate();
  const { eras, eraById, eventsForEra } = useContent();
  const trackRef = useRef(null);
  const lastOpened = useRef(null);

  const era = eraById(eraId);
  const events = era ? eventsForEra(era.id) : [];
  const index = events.findIndex((e) => e.id === eventId);
  const openEvent = index >= 0 ? events[index] : null;
  const eraIndex = eras.findIndex((e) => e.id === eraId);
  const prevEra = eras[eraIndex - 1];
  const nextEra = eras[eraIndex + 1];

  // When the panel closes, put focus back on the event point that opened it.
  useEffect(() => {
    if (eventId) {
      lastOpened.current = eventId;
    } else if (lastOpened.current) {
      trackRef.current?.querySelector(`[data-event-id="${lastOpened.current}"]`)?.focus();
      lastOpened.current = null;
    }
  }, [eventId]);

  if (!era) return <Navigate to="/timeline" replace />;
  const eventPath = (ev) => `/era/${era.id}/event/${ev.id}`;

  return (
    <div className="flex h-full flex-col justify-between p-10">
      <header>
        <p className="text-2xl text-text-muted">{eraYears(era)}</p>
        <h1 className="text-7xl">{era.title}</h1>
        <p className="mt-3 max-w-[50ch] text-2xl">{era.subtitle}</p>
      </header>

      <div className="flex items-center gap-4">
        {prevEra ? (
          <Link to={`/era/${prevEra.id}`} aria-label={`Previous era: ${prevEra.title}`} className={buttonClass("secondary", "shrink-0")}>‹</Link>
        ) : <span className="w-14 shrink-0" />}

        <div className="min-w-0 flex-1 overflow-x-auto">
          <ol ref={trackRef} className="relative flex flex-col md:min-w-max gap-4 py-2 md:flex-row md:justify-between">
            <span aria-hidden="true" className="absolute left-0 right-0 top-1/2 hidden h-1 bg-text-muted md:block" />
            {events.map((ev) => (
              <li key={ev.id} className="relative">
                <Link
                  to={eventPath(ev)}
                  data-event-id={ev.id}
                  aria-current={ev.id === eventId ? "true" : undefined}
                  className={buttonClass("secondary", `w-full min-h-28 flex-col md:w-60 ${ev.id === eventId ? "border-highlight" : ""}`)}
                >
                  <span className="font-display text-3xl">{ev.date.display}</span>
                  <span className="text-base">{ev.shortTitle}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        {nextEra ? (
          <Link to={`/era/${nextEra.id}`} aria-label={`Next era: ${nextEra.title}`} className={buttonClass("secondary", "shrink-0")}>›</Link>
        ) : <span className="w-14 shrink-0" />}
      </div>

      {openEvent && (
        <EventPanel
          event={openEvent}
          era={era}
          prev={events[index - 1]}
          next={events[index + 1]}
          onClose={() => navigate(`/era/${era.id}`)}
          onGo={(ev) => navigate(eventPath(ev), { replace: true })}
        />
      )}
    </div>
  );
}
