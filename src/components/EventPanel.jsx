import { Link } from "react-router";
import { useState } from "react";
import { useContent } from "../hooks/useContent.jsx";
import { useDialog } from "../hooks/useDialog.js";
import { buttonClass } from "../lib/ui.js";
import ImageViewer from "./ImageViewer.jsx";
import { useKiosk } from "../store/useKiosk.js";
import { speak, stop } from "../lib/speech.js";

// Slides up over the era screen so visitors keep their place on the timeline.
// Everything needed to understand the event is here, so it makes sense to someone
// who walks up and sees only this panel.
export default function EventPanel({ event, era, prev, next, onClose, onGo }) {
  const { mediaById, mediaUrl, questionsForEvent } = useContent();
  const ref = useDialog(onClose);
  const closeEvent = () => {
    stop();
    onClose();
  };

  const goToEvent = (target) => {
    stop();
    onGo(target);
  };

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const images = event.mediaIds.map(mediaById).filter(Boolean);
  const hasQuiz = questionsForEvent(event.id).length > 0;

  const openViewer = (index) => {
    setSelectedImageIndex(index);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
  };

  const readAloud = useKiosk((s) => s.readAloud);

  const [isSpeaking, setIsSpeaking] = useState(false);

  async function toggleEventSpeech() {
    if (isSpeaking) {
      await stop();
      setIsSpeaking(false);
      return;
    }

    const text = `${event.title}. ${event.summary}. ${event.body}`;

    setIsSpeaking(true);

    try {
      await speak(text);
    } catch (error) {
      console.error("Unable to read event aloud:", error);
    } finally {
      setIsSpeaking(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end bg-bg/70"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeEvent();
        }
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full flex-col rounded-t-3xl border-t-2 border-accent bg-surface [animation:panel-up_250ms_ease-out]"
      >
        {/* tabIndex lets keyboard users scroll long event text with the arrow keys. */}
        <div
          className="overflow-y-auto px-8 pt-8"
          tabIndex={0}
          role="region"
          aria-label="Event details"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Your existing date, era, and status-tag content stays here. */}
              <p className="font-display text-xl font-bold text-accent">
                {event.date.display} · {era.title}
                {event.date.status !== "historical" && (
                  <span className="ml-3 rounded-lg border-2 border-highlight px-2 text-highlight">
                    {event.date.status === "planned"
                      ? "Planned"
                      : "Ongoing"}
                  </span>
                )}
                {event.tags?.includes("mississippi") && (
                  <span className="ml-3 rounded-lg border-2 border-accent px-2">Mississippi</span>
                )}
              </p>
            </div>

            {/* The read-aloud button goes here. */}
            {readAloud && (
              <button
                type="button"
                onClick={toggleEventSpeech}
                className="group relative grid size-14 shrink-0 place-items-center rounded-full border border-highlight/40 bg-gradient-to-br from-surface to-bg shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-highlight motion-reduce:transition-none"
                aria-label={isSpeaking ? "Stop reading event" : "Read event aloud"}
                aria-pressed={isSpeaking}
                title={isSpeaking ? "Stop reading" : "Read event aloud"}
              >
                <span
                  aria-hidden="true"
                  className={`absolute -inset-1 rounded-full border-2 border-highlight/60 ${isSpeaking ? "animate-pulse opacity-100" : "opacity-40"
                    }`}
                />
                <span aria-hidden="true" className="relative h-6 w-6">
                  <span
                    className={`absolute inset-0 bg-text ${isSpeaking
                      ? "scale-75 rounded-sm"
                      : "[clip-path:polygon(22%_6%,50%_24%,50%_76%,22%_94%)]"
                      }`}
                  />
                  <span
                    className={`absolute inset-0 bg-text ${isSpeaking
                      ? "scale-75 rounded-sm"
                      : "[clip-path:polygon(50%_24%,90%_50%,90%_50%,50%_76%)]"
                      }`}
                  />
                </span>
              </button>
            )}
          </div>

          <h2
            id="event-title"
            tabIndex={-1}
            data-autofocus
            className="mt-2 text-5xl"
          >
            {event.title}
          </h2>



          <p className="mt-4 max-w-[60ch] text-xl">
            {event.summary}
          </p>

          {event.body.split("\n\n").map((para, i) => (
            <p key={i} className="mt-4 max-w-[60ch]">
              {para}
            </p>
          ))}

          {/* DONE by Joshua Craven: event images open in a full-screen viewer with zoom. */}
          {images.length > 0 && (
            <ul className="mt-6 flex gap-4 overflow-x-auto pb-4">
              {images.map((img, index) => (
                <li
                  key={img.id}
                  className="w-[28rem] max-w-full shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => openViewer(index)}
                    className="block w-full rounded-xl focus:outline-none focus:ring-4 focus:ring-accent"
                    aria-label={`Open ${img.alt ||
                      img.caption ||
                      "image"
                      } full-screen`}
                  >
                    <img
                      src={mediaUrl(img)}
                      alt={img.alt}
                      className="aspect-video w-full rounded-xl bg-bg object-contain"
                    />
                  </button>

                  <p className="mt-2 text-sm text-text-muted">
                    {img.caption}{" "}
                    {img.credit && `(${img.credit})`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-bg px-8 py-4">
          <button
            disabled={!prev}
            onClick={() => goToEvent(prev)}
            className={buttonClass("secondary")}
          >
            ‹ Previous event
          </button>

          <div className="flex flex-wrap gap-3">
            {hasQuiz && (
              <Link
                to={`/quiz/event/${event.id}`}
                onClick={stop}
                className={buttonClass("era")}
              >
                Test yourself
              </Link>
            )}

            <button
              onClick={closeEvent}
              className={buttonClass("primary")}
            >
              Close
            </button>
          </div>

          <button
            disabled={!next}
            onClick={() => goToEvent(next)}
            className={buttonClass("secondary")}
          >
            Next event ›
          </button>
        </div>
      </div>

      {viewerOpen && (
        <ImageViewer
          images={images}
          initialIndex={selectedImageIndex}
          mediaUrl={mediaUrl}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}