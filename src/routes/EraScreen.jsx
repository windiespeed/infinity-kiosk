import { useEffect, useRef } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useContent } from "../hooks/useContent.jsx";
import EventPanel from "../components/EventPanel.jsx";
import { buttonClass } from "../lib/ui.js";
import { eraYears } from "../lib/format.js";
import GoldRule from "../components/GoldRule.jsx";

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
        <p className="font-display text-2xl font-bold text-accent">{eraYears(era)}</p>
        <h1 className="mt-1 text-7xl">{era.title}</h1>
        <GoldRule className="mt-5" />
        <p className="mt-5 max-w-[50ch] font-serif text-3xl text-accent">{era.subtitle}</p>
        {era.overview && (
          <p className="mt-3 max-w-[65ch] text-lg text-text-muted">
            {era.overview}
          </p>
        )}
      </header>

      <div className="flex items-center gap-4">
        {prevEra ? (
          <Link to={`/era/${prevEra.id}`} aria-label={`Previous era: ${prevEra.title}`} className={buttonClass("secondary", "shrink-0")}>‹</Link>
        ) : <span className="w-14 shrink-0" />}

        <div className="min-w-0 flex-1 overflow-x-auto">
          <ol ref={trackRef} className="relative flex flex-col gap-4 py-2 md:min-w-max md:flex-row md:justify-between">
            <span aria-hidden="true" className="absolute left-0 right-0 top-[1.5625rem] hidden h-0.5 bg-accent/70 md:block" />
            {events.map((ev) => (
              <li key={ev.id} className="relative md:pt-10">
                <span aria-hidden="true" className="absolute left-1/2 top-2 hidden size-5 -translate-x-1/2 rounded-full border-4 border-bg bg-accent md:block" />
                <Link
                  to={eventPath(ev)}
                  data-event-id={ev.id}
                  aria-current={ev.id === eventId ? "true" : undefined}
                  className={`flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 panel px-5 py-3 text-center transition-colors md:w-60 ${ev.id === eventId ? "border-highlight" : "border-accent/50 hover:border-accent"
                    }`}
                >
                  <span className="font-display text-3xl font-bold text-accent">{ev.date.display}</span>
                  <span className="text-base font-bold">{ev.shortTitle}</span>
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
