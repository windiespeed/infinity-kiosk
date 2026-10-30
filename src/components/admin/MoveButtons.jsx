import { buttonClass } from "../../lib/ui.js";

// Up / down buttons for reordering a list (eras, event photos, quiz questions).
// Buttons instead of drag and drop, so it works by touch, keyboard and switch.
export default function MoveButtons({ index, count, label, onMove }) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onMove(index, index - 1)}
        disabled={index === 0}
        aria-label={`Move ${label} up`}
        className={buttonClass("secondary", "px-4")}
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => onMove(index, index + 1)}
        disabled={index === count - 1}
        aria-label={`Move ${label} down`}
        className={buttonClass("secondary", "px-4")}
      >
        ↓
      </button>
    </div>
  );
}

// Returns a copy of `list` with the item at `from` moved to `to`.
export function moveItem(list, from, to) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
