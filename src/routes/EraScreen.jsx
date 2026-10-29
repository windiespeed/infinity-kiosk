import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useContent } from "../hooks/useContent.jsx";
import EventPanel from "../components/EventPanel.jsx";
import CardImage from "../components/CardImage.jsx";
import { buttonClass } from "../lib/ui.js";
import { eraYears } from "../lib/format.js";
import GoldRule from "../components/GoldRule.jsx";
import StarMarker from "../components/StarMarker.jsx";

// One era: title on top, its events as a timeline in the lower part of the screen,
// previous/next era buttons at the sides. /era/:eraId/event/:eventId opens the panel.
export default function EraScreen() {
  const { eraId, eventId } = useParams();
  const navigate = useNavigate();
  const { eras, eraById, eventsForEra, eventCover, mediaUrl } = useContent();
  const trackRef = useRef(null);
  const scrollerRef = useRef(null);
  const lastOpened = useRef(null);
  const [more, setMore] = useState({ left: false, right: false });

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

  // Which ends of the event row are hidden. Swiping scrolls it on the touch screen; these
  // drive the "more" buttons for mouse users and as a hint that there is more to see.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () =>
      setMore({
        left: el.scrollLeft > 4,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [eraId]);

  const scrollEvents = (direction) => {
    const el = scrollerRef.current;
    el?.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  if (!era) return <Navigate to="/timeline" replace />;
  const eventPath = (ev) => `/era/${era.id}/event/${ev.id}`;

  return (
    <div className="flex min-h-full flex-col justify-between gap-6 px-10 py-6">
      <header>
        <p className="font-display text-2xl font-bold text-accent">{eraYears(era)}</p>
        <h1 className="mt-1 text-5xl">{era.title}</h1>
        <GoldRule className="mt-5" />
        <p className="mt-4 max-w-[50ch] font-display text-2xl text-accent">{era.subtitle}</p>
        {era.overview && (
          <p className="mt-2 max-w-[90ch] text-base text-text-muted">
            {era.overview}
          </p>
        )}
      </header>

      <div className="flex items-center gap-4">
        {prevEra ? (
          <Link to={`/era/${prevEra.id}`} aria-label={`Previous era: ${prevEra.title}`} className={buttonClass("secondary", "shrink-0")}>‹</Link>
        ) : <span className="w-14 shrink-0" />}

        <div className="relative min-w-0 flex-1">
        <div ref={scrollerRef} className="overflow-x-auto">
          <ol ref={trackRef} className="relative flex flex-col gap-4 pt-2 pb-4 md:min-w-max md:flex-row md:justify-between">
            <span aria-hidden="true" className="absolute left-0 right-0 top-[1.5625rem] hidden h-0.5 bg-accent/70 md:block" />
            {events.map((ev) => (
              <li key={ev.id} className="relative md:pt-10">
                <StarMarker className="absolute left-1/2 top-[1.125rem] hidden size-9 -translate-1/2 md:block" />
                <Link
                  to={eventPath(ev)}
                  data-event-id={ev.id}
                  aria-current={ev.id === eventId ? "true" : undefined}
                  className={`relative flex min-h-36 w-full flex-col justify-end overflow-hidden rounded-2xl panel text-center transition-colors md:w-60 ${ev.id === eventId ? "border-2 border-highlight" : "border border-accent/25 hover:border-accent"
                    }`}
                >
                  {eventCover(ev) && <CardImage src={mediaUrl(eventCover(ev))} />}
                  <span className="relative flex flex-col items-center gap-1 px-5 py-3">
                    {ev.tags?.includes("mississippi") && (
                      <span className="rounded-md border border-accent px-2 text-sm font-bold uppercase tracking-wider text-accent">Mississippi</span>
                    )}
                    <span className="font-display text-3xl font-bold text-accent">{ev.date.display}</span>
                    <span className="text-base font-bold">{ev.shortTitle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        {more.left && (
          <button
            type="button"
            onClick={() => scrollEvents(-1)}
            aria-label="Show earlier events"
            className={buttonClass("primary", "absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full px-0 text-2xl shadow-lg")}
          >‹</button>
        )}
        {more.right && (
          <button
            type="button"
            onClick={() => scrollEvents(1)}
            aria-label="Show later events"
            className={buttonClass("primary", "absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full px-0 text-2xl shadow-lg")}
          >›</button>
        )}
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
