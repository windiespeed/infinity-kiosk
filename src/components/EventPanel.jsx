import { Link } from "react-router";
import { useContent } from "../hooks/useContent.jsx";
import { useDialog } from "../hooks/useDialog.js";
import { buttonClass } from "../lib/ui.js";

// Slides up over the era screen so visitors keep their place on the timeline.
// Everything needed to understand the event is here, so it makes sense to someone
// who walks up and sees only this panel.
export default function EventPanel({ event, era, prev, next, onClose, onGo }) {
  const { mediaById, mediaUrl, questionsForEvent } = useContent();
  const ref = useDialog(onClose);
  const images = event.mediaIds.map(mediaById).filter(Boolean);
  const hasQuiz = questionsForEvent(event.id).length > 0;

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-bg/70" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full flex-col rounded-t-3xl border-t-2 border-accent bg-surface [animation:panel-up_250ms_ease-out]"
      >
        {/* tabIndex lets keyboard users scroll long event text with the arrow keys. */}
        <div className="overflow-y-auto px-8 pt-8" tabIndex={0} role="region" aria-label="Event details">
          <p className="font-display text-xl font-bold text-accent">
            {event.date.display} · {era.title}
            {event.date.status !== "historical" && (
              <span className="ml-3 rounded-lg border-2 border-highlight px-2 text-highlight">
                {event.date.status === "planned" ? "Planned" : "Ongoing"}
              </span>
            )}
          </p>
          <h2 id="event-title" tabIndex={-1} data-autofocus className="mt-2 text-5xl">
            {event.title}
          </h2>
          <p className="mt-4 max-w-[60ch] text-xl">{event.summary}</p>
          {event.body.split("\n\n").map((para, i) => (
            <p key={i} className="mt-4 max-w-[60ch]">{para}</p>
          ))}

          {/* TODO (image viewer issue): open images full-screen with zoom */}
          {images.length > 0 && (
            <ul className="mt-6 flex gap-4 overflow-x-auto pb-4">
              {images.map((img) => (
                <li key={img.id} className="w-[28rem] max-w-full shrink-0">
                  <img src={mediaUrl(img)} alt={img.alt} className="aspect-video w-full rounded-xl object-cover" />
                  <p className="mt-2 text-sm text-text-muted">{img.caption} {img.credit && `(${img.credit})`}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-bg px-8 py-4">
          <button disabled={!prev} onClick={() => onGo(prev)} className={buttonClass("secondary")}>
            ‹ Previous event
          </button>
          <div className="flex flex-wrap gap-3">
            {hasQuiz && (
              <Link to={`/quiz/event/${event.id}`} className={buttonClass("era")}>
                Test yourself
              </Link>
            )}
            <button onClick={onClose} className={buttonClass("primary")}>
              Close
            </button>
          </div>
          <button disabled={!next} onClick={() => onGo(next)} className={buttonClass("secondary")}>
            Next event ›
          </button>
        </div>
      </div>
    </div>
  );
}
