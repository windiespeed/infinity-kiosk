import { useState } from "react";
import { useSearchParams, Link } from "react-router";
import { useContent } from "../hooks/useContent.jsx";
import { buttonClass } from "../lib/ui.js";
import ImageViewer from "../components/ImageViewer.jsx";

// Every image, filterable by era. Each image links back to its event.
// DONE by Joshua Craven: tapping an image opens a full-screen viewer with zoom.
export default function Library() {
  const { content, eras, eventsForEra, mediaUrl } = useContent();
  const [params, setParams] = useSearchParams();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const eraFilter = params.get("era");

  // Pair each image with the first event that uses it.
  const events = eraFilter ? eventsForEra(eraFilter) : content.events;
  const items = [];
  const seen = new Set();

  for (const ev of events) {
    for (const id of ev.mediaIds) {
      const img = content.media.find((m) => m.id === id);

      if (img && !seen.has(id)) {
        seen.add(id);
        items.push({ img, ev });
      }
    }
  }

  const openViewer = (index) => {
    setSelectedImageIndex(index);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
  };

  const viewerImages = items.map(({ img }) => img);

  return (
    <div className="p-10">
      <h1 className="text-6xl">Image library</h1>

      <div
        role="group"
        aria-label="Filter by era"
        className="mt-6 flex flex-wrap gap-3"
      >
        <button
          aria-pressed={!eraFilter}
          onClick={() => setParams({})}
          className={buttonClass(
            !eraFilter ? "era" : "secondary"
          )}
        >
          All
        </button>

        {eras.map((era) => (
          <button
            key={era.id}
            aria-pressed={eraFilter === era.id}
            onClick={() =>
              setParams({ era: era.id })
            }
            className={buttonClass(
              eraFilter === era.id
                ? "era"
                : "secondary"
            )}
          >
            {era.title}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ img, ev }, index) => (
          <li
            key={img.id}
            className="panel rounded-2xl p-4"
          >
            <button
              type="button"
              onClick={() => openViewer(index)}
              className="block w-full rounded-xl focus:outline-none focus:ring-4 focus:ring-accent"
              aria-label={`Open ${
                img.alt ||
                img.caption ||
                "image"
              } full-screen`}
            >
              <img
                src={mediaUrl(img)}
                alt={img.alt}
                loading="lazy"
                className="aspect-video w-full rounded-xl object-cover"
              />
            </button>

            <p className="mt-3 text-base">
              {img.caption}
            </p>

            <Link
              to={`/era/${ev.eraIds[0]}/event/${ev.id}`}
              className={buttonClass(
                "secondary",
                "mt-3 w-full"
              )}
            >
              See this event
            </Link>
          </li>
        ))}
      </ul>

      {viewerOpen && (
        <ImageViewer
          images={viewerImages}
          initialIndex={selectedImageIndex}
          mediaUrl={mediaUrl}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}