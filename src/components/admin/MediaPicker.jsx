import { useDialog } from "../../hooks/useDialog.js";
import { buttonClass } from "../../lib/ui.js";
import MediaGrid, { mediaLabel } from "./MediaGrid.jsx";

// Full-screen dialog for choosing a media item for an event. Background videos
// (welcome screen only, no captions) aren't offered.
// Calls onPick(item), or onClose() to cancel.
export default function MediaPicker({ title = "Choose a photo", only = "image", onPick, onClose }) {
  const ref = useDialog(onClose);
  return (
    <div className="fixed inset-0 z-50 bg-bg/95 p-8">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        className="mx-auto flex h-full max-w-7xl flex-col rounded-2xl border border-text-muted/25 panel"
      >
        <div className="flex items-center justify-between gap-4 p-6">
          <h2 id="picker-title" className="text-3xl">{title}</h2>
          <button data-autofocus onClick={onClose} className={buttonClass("secondary")}>Cancel</button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <MediaGrid only={only} noBackground searchId="picker-search">
            {(item) => (
              <button onClick={() => onPick(item)} className={buttonClass("primary", "w-full")}>
                Choose<span className="sr-only"> {mediaLabel(item)}</span>
              </button>
            )}
          </MediaGrid>
        </div>
      </div>
    </div>
  );
}
