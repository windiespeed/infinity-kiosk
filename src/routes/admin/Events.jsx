import { useState } from "react";
import { Link } from "react-router";
import { useContent } from "../../hooks/useContent.jsx";
import { needsReview } from "../../lib/content.js";
import { buttonClass } from "../../lib/ui.js";
import { inputClass } from "../../components/admin/Field.jsx";

const byDate = (a, b) => a.date.sort.localeCompare(b.date.sort);

// Small text tags beside an event's title. Words, not just color, carry the meaning.
export function EventTags({ ev }) {
  return (
    <>
      {ev.published === false && <span className="rounded border border-text-muted px-2 text-sm font-bold">Hidden</span>}
      {needsReview(ev) && (
        <span className="rounded border border-highlight px-2 text-sm font-bold text-highlight">Needs review</span>
      )}
    </>
  );
}

// Event list, grouped by era. Events in more than one era appear under each.
export default function Events() {
  const { content, eras } = useContent();
  const [query, setQuery] = useState("");

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (ev) =>
    words.every((w) => [ev.id, ev.title, ev.shortTitle, ev.date.display, ev.summary].join(" ").toLowerCase().includes(w));
  const shown = content.events.filter(matches);
  const reviewCount = content.events.filter((ev) => needsReview(ev)).length;

  return (
    <div className="mx-auto max-w-5xl p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl">Events</h1>
          <p className="mt-3 text-text-muted">
            {content.events.length} events
            {reviewCount > 0 && `, ${reviewCount} planned or ongoing ${reviewCount === 1 ? "needs" : "need"} review`}.
          </p>
        </div>
        <Link to="/admin/events/new" className={buttonClass("primary")}>Add an event</Link>
      </div>

      <label htmlFor="event-search" className="mt-8 block font-bold">Search events</label>
      <input
        id="event-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Words from the title, date or summary"
        className={`${inputClass} max-w-2xl`}
      />
      <p aria-live="polite" className="mt-2 text-text-muted">{shown.length} of {content.events.length} shown</p>

      {eras.map((era) => {
        const events = shown.filter((ev) => ev.eraIds.includes(era.id)).sort(byDate);
        if (!events.length) return null;
        return (
          <section key={era.id} className="mt-10">
            <h2 className="text-3xl">{era.title}</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {events.map((ev) => (
                <li key={ev.id} className="panel flex flex-wrap items-center gap-4 rounded-xl p-4">
                  <span className="w-40 shrink-0 font-bold text-accent">{ev.date.display}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block">{ev.title}</span>
                    <span className="mt-1 flex flex-wrap gap-2">
                      <EventTags ev={ev} />
                    </span>
                  </span>
                  <Link to={`/admin/events/${encodeURIComponent(ev.id)}`} className={buttonClass("secondary")}>
                    Edit<span className="sr-only"> {ev.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
