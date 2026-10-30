import { useDialog } from "../../hooks/useDialog.js";
import { buttonClass } from "../../lib/ui.js";

// "Are you sure?" for admin actions that can't be undone, like deleting.
// Cancel has the focus first, so a stray Enter never confirms by accident.
export default function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }) {
  const ref = useDialog(onCancel);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-8">
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={message ? "confirm-desc" : undefined}
        className="mb-[10vh] w-full max-w-3xl rounded-2xl border border-text-muted/25 panel p-8"
      >
        <h2 id="confirm-title" className="text-3xl">{title}</h2>
        {message && <p id="confirm-desc" className="mt-3 text-text-muted">{message}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-4">
          <button data-autofocus onClick={onCancel} className={buttonClass("secondary")}>Cancel</button>
          <button onClick={onConfirm} className={buttonClass("primary")}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
