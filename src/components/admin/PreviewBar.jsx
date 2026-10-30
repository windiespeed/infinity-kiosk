import { useNavigate } from "react-router";
import { useKiosk } from "../../store/useKiosk.js";
import { buttonClass } from "../../lib/ui.js";

// Shown on visitor screens while staff are signed in (for example after Preview in
// the event editor), so it's clear hidden events are showing and how to get back.
export default function PreviewBar() {
  const previewReturn = useKiosk((s) => s.previewReturn);
  const navigate = useNavigate();
  return (
    <div role="status" className="relative z-40 flex items-center justify-between gap-4 border-b border-highlight bg-surface px-6 py-2">
      <p>
        <span className="font-bold">Staff preview.</span> Hidden events are showing until you exit admin.
      </p>
      <button onClick={() => navigate(previewReturn ?? "/admin/dashboard")} className={buttonClass("primary")}>
        Back to admin
      </button>
    </div>
  );
}
