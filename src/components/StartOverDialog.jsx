import { useDialog } from "../hooks/useDialog.js";
import { buttonClass } from "../lib/ui.js";

// Confirms before resetting, because starting over also turns off accessibility
// settings a visitor may depend on. "Keep exploring" gets focus so an accidental
// double tap doesn't reset.
export default function StartOverDialog({ onConfirm, onCancel }) {
  const ref = useDialog(onCancel);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-8" onClick={onCancel}>
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="restart-title"
        aria-describedby="restart-desc"
        onClick={(e) => e.stopPropagation()}
        className="mb-[10vh] w-full max-w-3xl rounded-2xl border-2 border-text-muted bg-surface p-8 text-center"
      >
        <h2 id="restart-title" className="text-4xl">Start over?</h2>
        <p id="restart-desc" className="mt-3 text-text-muted">
          This returns to the welcome screen and turns off any accessibility settings.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <button data-autofocus onClick={onCancel} className={buttonClass("secondary")}>
            Keep exploring
          </button>
          <button onClick={onConfirm} className={buttonClass("primary")}>
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}
