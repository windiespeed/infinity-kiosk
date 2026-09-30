import { useKiosk } from "../store/useKiosk.js";
import { useDialog } from "../hooks/useDialog.js";
import { buttonClass } from "../lib/ui.js";

function Toggle({ label, pressed, onPress, disabled, note }) {
  return (
    <button
      aria-pressed={pressed}
      onClick={onPress}
      disabled={disabled}
      className={buttonClass(pressed ? "era" : "secondary", "w-full justify-between text-left")}
    >
      <span>
        {label}
        {note && <span className="block text-sm font-normal">{note}</span>}
      </span>
      <span aria-hidden="true">{pressed ? "On" : "Off"}</span>
    </button>
  );
}

export default function A11yPanel() {
  const s = useKiosk();
  const close = () => s.update({ a11yOpen: false });
  const ref = useDialog(close);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-bg/70" onClick={close}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-title"
        onClick={(e) => e.stopPropagation()}
        className="mb-4 w-full max-w-4xl rounded-2xl border-2 border-text-muted bg-surface p-6"
      >
        <h2 id="a11y-title" tabIndex={-1} data-autofocus className="text-3xl">Accessibility</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Larger text"
            pressed={s.textSize === "large"}
            onPress={() => s.update({ textSize: s.textSize === "large" ? "normal" : "large" })}
          />
          <Toggle
            label="High contrast"
            pressed={s.contrast === "high"}
            onPress={() => s.update({ contrast: s.contrast === "high" ? "default" : "high" })}
          />
          <Toggle label="Reduce motion" pressed={s.reduceMotion} onPress={() => s.toggle("reduceMotion")} />
          <Toggle
            label="Move content lower"
            pressed={s.reach}
            onPress={() => s.toggle("reach")}
          />
          {/* TODO (audio issue): read screen content aloud with window.speechSynthesis */}
          <Toggle label="Read aloud" note="Coming soon" pressed={false} disabled onPress={() => {}} />
        </div>
        <button onClick={close} className={buttonClass("primary", "mt-6 w-full")}>
          Done
        </button>
      </div>
    </div>
  );
}
