import { useDialog } from "../hooks/useDialog.js";
import { buttonClass } from "../lib/ui.js";

export default function IdleModal({ remaining, onStay }) {
  const ref = useDialog(onStay);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-8">
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="idle-title"
        aria-describedby="idle-desc"
        className="mb-[10vh] w-full max-w-3xl rounded-2xl border-2 border-text-muted panel p-8 text-center"
      >
        <h2 id="idle-title" className="text-3xl">Are you still exploring?</h2>
        <p id="idle-desc" className="mt-3 text-text-muted" aria-live="polite">
          The screen will start over in {remaining} seconds.
        </p>
        <button data-autofocus onClick={onStay} className={buttonClass("primary", "mt-6")}>
          Keep exploring
        </button>
      </div>
    </div>
  );
}
