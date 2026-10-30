import { useState } from "react";
import { useContent } from "../../hooks/useContent.jsx";
import { useAdminSave, useUnsavedChanges } from "../../hooks/useAdmin.js";
import { IDLE_MAX, IDLE_MIN, settingsProblems } from "../../lib/content.js";
import { isValidPin } from "../../lib/pin.js";
import { buttonClass } from "../../lib/ui.js";
import Field, { inputClass } from "../../components/admin/Field.jsx";

const toForm = (s) => ({
  idleSeconds: String(s.idleSeconds),
  warningSeconds: String(s.warningSeconds),
  credits: s.credits ?? "",
  attractVideo: s.attractVideo ?? "",
});

// An empty field must not read as 0 (that would show the idle prompt nonstop).
const wholeNumber = (text) => (/^\d+$/.test(text.trim()) ? Number(text) : NaN);

// Kiosk settings and the staff PIN.
export default function Settings() {
  const { content } = useContent();
  const { save, status, setStatus, saving } = useAdminSave();
  const [saved, setSaved] = useState(() => toForm(content.settings));
  const [form, setForm] = useState(saved);
  const [problems, setProblems] = useState({});

  useUnsavedChanges(JSON.stringify(form) !== JSON.stringify(saved));

  const videos = content.media.filter((m) => m.type === "video");
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const settings = {
      ...content.settings,
      idleSeconds: wholeNumber(form.idleSeconds),
      warningSeconds: wholeNumber(form.warningSeconds),
      credits: form.credits.trim(),
      attractVideo: form.attractVideo || null,
    };
    const found = settingsProblems(settings, content);
    setProblems(found);
    if (Object.keys(found).length) {
      setStatus("Fix the highlighted fields, then save again.");
      document.getElementById(`set-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    if (await save({ ...content, settings }, "Settings saved.")) {
      const values = toForm(settings);
      setSaved(values);
      setForm(values);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-10">
      <h1 className="text-5xl">Settings</h1>

      <form onSubmit={submit} noValidate className="panel mt-8 rounded-xl p-6">
        <h2 className="text-3xl">Kiosk</h2>

        <div className="flex flex-wrap gap-6">
          <div className="w-80">
            <Field
              id="set-idleSeconds"
              label="Seconds before “Are you still exploring?”"
              hint={`${IDLE_MIN} to ${IDLE_MAX}.`}
              error={problems.idleSeconds}
            >
              {(props) => (
                <input {...props} inputMode="numeric" value={form.idleSeconds} onChange={set("idleSeconds")} className={inputClass} />
              )}
            </Field>
          </div>
          <div className="w-80">
            <Field
              id="set-warningSeconds"
              label="Seconds of warning before starting over"
              hint="At least 5."
              error={problems.warningSeconds}
            >
              {(props) => (
                <input {...props} inputMode="numeric" value={form.warningSeconds} onChange={set("warningSeconds")} className={inputClass} />
              )}
            </Field>
          </div>
        </div>

        <Field id="set-credits" label="Credits" hint="Shown on the About screen." error={problems.credits}>
          {(props) => <textarea {...props} rows={3} value={form.credits} onChange={set("credits")} className={inputClass} />}
        </Field>

        <Field
          id="set-attractVideo"
          label="Welcome screen video"
          hint={
            videos.length
              ? "Plays on the welcome screen. With none, the welcome screen shows its photos."
              : "No videos yet. Add one in the media library to use it here."
          }
          error={problems.attractVideo}
        >
          {(props) => (
            <select {...props} value={form.attractVideo} onChange={set("attractVideo")} className={inputClass}>
              <option value="">No video</option>
              {videos.map((m) => (
                <option key={m.id} value={m.id}>{m.caption || m.id}</option>
              ))}
            </select>
          )}
        </Field>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={saving} className={buttonClass("primary")}>Save settings</button>
          <p aria-live="polite" className="text-text-muted">{status}</p>
        </div>
      </form>

      <ChangePin />
    </div>
  );
}

function ChangePin() {
  const { store } = useContent();
  const [pins, setPins] = useState({ current: "", next: "", again: "" });
  const [problems, setProblems] = useState({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  // On the dev server the PIN comes from .env, so it can't be changed here.
  if (store.kind !== "device") {
    return (
      <section className="panel mt-10 rounded-xl p-6">
        <h2 className="text-3xl">Staff PIN</h2>
        <p className="mt-3 text-text-muted">
          The PIN can be changed here on the kiosk. On the development server it comes from the <code>.env</code>{" "}
          file: run <code>npm run hash-pin</code> and put the result in <code>ADMIN_PIN_HASH</code>.
        </p>
      </section>
    );
  }

  const set = (key) => (e) => setPins({ ...pins, [key]: e.target.value.replace(/\D/g, "").slice(0, 8) });

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!pins.current) found.current = "Enter the current PIN.";
    if (!isValidPin(pins.next)) found.next = "Use 4 to 8 digits.";
    else if (pins.again !== pins.next) found.again = "The two new PINs don't match.";
    if (!found.current) {
      setBusy(true);
      if (!(await store.signIn(pins.current))) found.current = "That isn't the current PIN.";
      setBusy(false);
    }
    setProblems(found);
    if (Object.keys(found).length) {
      setStatus("");
      document.getElementById(`pin-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await store.setPin(pins.next);
      setPins({ current: "", next: "", again: "" });
      setStatus("PIN changed. Use the new PIN from now on.");
    } catch (err) {
      setStatus(err.message || "The PIN wasn't changed.");
    } finally {
      setBusy(false);
    }
  };

  const pinField = (key, label, error) => (
    <div className="w-72">
      <Field id={`pin-${key}`} label={label} error={error}>
        {(props) => (
          <input
            {...props}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            value={pins[key]}
            onChange={set(key)}
            className={`${inputClass} tracking-[0.3em]`}
          />
        )}
      </Field>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="panel mt-10 rounded-xl p-6">
      <h2 className="text-3xl">Change the staff PIN</h2>
      <p className="mt-3 text-text-muted">4 to 8 digits. It can't be recovered, so keep it somewhere safe.</p>
      <div className="flex flex-wrap gap-6">
        {pinField("current", "Current PIN", problems.current)}
        {pinField("next", "New PIN", problems.next)}
        {pinField("again", "New PIN again", problems.again)}
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className={buttonClass("primary")}>Change PIN</button>
        <p aria-live="polite" className="text-text-muted">{status}</p>
      </div>
    </form>
  );
}
