import { useState } from "react";
import { useContent } from "../../hooks/useContent.jsx";
import { inputClass } from "./Field.jsx";

// A media item's small picture: the photo, or a video's poster with a "Video" tag.
export function MediaThumb({ item, className = "" }) {
  const { mediaUrl } = useContent();
  const src = item.type === "video" ? (item.poster ? mediaUrl({ file: item.poster }) : null) : mediaUrl(item);
  return (
    <span className={`relative block aspect-video overflow-hidden rounded-lg bg-bg ${className}`}>
      {src && <img src={src} alt="" loading="lazy" draggable="false" className="size-full object-cover" />}
      {item.type === "video" && (
        <span className="absolute left-2 top-2 rounded bg-bg/90 px-2 text-sm font-bold">Video</span>
      )}
    </span>
  );
}

export const mediaLabel = (item) => item.caption || item.alt || item.file;

// Searchable grid of media. `children(item)` draws each card's buttons.
// `only` limits it to "image" or "video" items.
export default function MediaGrid({ only, children, searchId = "media-search" }) {
  const { content } = useContent();
  const [query, setQuery] = useState("");

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const items = content.media.filter((m) => {
    if (only && (m.type ?? "image") !== only) return false;
    const text = [m.id, m.file, m.caption, m.alt, m.credit].join(" ").toLowerCase();
    return words.every((w) => text.includes(w));
  });

  return (
    <div>
      <label htmlFor={searchId} className="block font-bold">Search media</label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Words from the caption, alt text, credit or file name"
        className={`${inputClass} max-w-2xl`}
      />
      <p aria-live="polite" className="mt-2 text-text-muted">
        {items.length} of {content.media.length} shown
      </p>
      <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
        {items.map((item) => (
          <li key={item.id} className="panel flex flex-col gap-3 rounded-xl p-3">
            <MediaThumb item={item} />
            <p className="line-clamp-2">{mediaLabel(item)}</p>
            <div className="mt-auto flex flex-wrap gap-2">{children(item)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
