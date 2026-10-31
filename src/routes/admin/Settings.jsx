import { useEffect, useState } from "react";
import { useContent } from "../../hooks/useContent.jsx";
import { useAdminSave, useUnsavedChanges } from "../../hooks/useAdmin.js";
import {
  ADMIN_IDLE_DEFAULT,
  ADMIN_IDLE_MAX,
  ADMIN_IDLE_MIN,
  IDLE_MAX,
  IDLE_MIN,
  settingsProblems,
} from "../../lib/content.js";
import { formatRecoveryCode, isValidPin } from "../../lib/pin.js";
import { buttonClass } from "../../lib/ui.js";
import Field, { inputClass } from "../../components/admin/Field.jsx";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import { kioskLockStatus, lockKiosk, removeKioskLock, unlockKiosk } from "../../lib/kioskLock.js";

const toForm = (s) => ({
  idleSeconds: String(s.idleSeconds),
  warningSeconds: String(s.warningSeconds),
  adminIdleMinutes: String(s.adminIdleMinutes ?? ADMIN_IDLE_DEFAULT),
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
      adminIdleMinutes: wholeNumber(form.adminIdleMinutes),
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

        <div className="w-80">
          <Field
            id="set-adminIdleMinutes"
            label="Minutes before staff are signed out"
            hint={`${ADMIN_IDLE_MIN} to ${ADMIN_IDLE_MAX}. Counts from the last touch in admin; a warning shows for the last minute.`}
            error={problems.adminIdleMinutes}
          >
            {(props) => (
              <input
                {...props}
                inputMode="numeric"
                value={form.adminIdleMinutes}
                onChange={set("adminIdleMinutes")}
                className={inputClass}
              />
            )}
          </Field>
        </div>

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
      <RecoveryCode />
      <KioskLockPanel />
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
      <p className="mt-3 text-text-muted">4 to 8 digits. Keep it somewhere safe.</p>
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

// The recovery code lets staff choose a new PIN on the sign-in screen if the PIN is
// forgotten. Kiosks set up before recovery codes existed have none until one is made here.
function RecoveryCode() {
  const { store } = useContent();
  const [has, setHas] = useState(null);
  const [asking, setAsking] = useState(false);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (store.kind === "device") store.hasRecoveryCode().then(setHas);
  }, [store]);

  if (store.kind !== "device") return null;

  const make = async () => {
    setAsking(false);
    try {
      setCode(await store.newRecoveryCode());
      setHas(true);
      setStatus("");
    } catch (err) {
      setStatus(err.message || "No new code was made.");
    }
  };

  // The dialog sits outside the panel: its backdrop blur would trap the dialog's fixed position.
  return (
    <>
      <section className="panel mt-10 rounded-xl p-6" aria-labelledby="recovery-title">
        <h2 id="recovery-title" className="text-3xl">Recovery code</h2>
        <p className="mt-3 text-text-muted">
          If the PIN is forgotten, staff tap “Forgot the PIN?” on the sign-in screen and enter this code to choose a new
          PIN. No content is lost. Each code works once.
        </p>
        {code ? (
          <>
            <p className="mt-4">Write this down and keep it away from the kiosk. It won't be shown again.</p>
            <p className="mt-3 inline-block rounded-xl border-2 border-accent px-6 py-4 font-display text-4xl tracking-widest">
              {formatRecoveryCode(code)}
            </p>
            <div>
              <button onClick={() => setCode("")} className={buttonClass("primary", "mt-4")}>
                I've written it down
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 font-bold">
              {has === null ? "" : has ? "This kiosk has a recovery code." : "This kiosk has no recovery code yet."}
            </p>
            <button onClick={() => (has ? setAsking(true) : make())} className={buttonClass("secondary", "mt-4")}>
              {has ? "Make a new recovery code" : "Make a recovery code"}
            </button>
          </>
        )}
        <p aria-live="polite" className="mt-2 text-text-muted">{status}</p>
      </section>

      {asking && (
        <ConfirmDialog
          title="Make a new recovery code?"
          message="The old code will stop working."
          confirmLabel="Make a new code"
          onConfirm={make}
          onCancel={() => setAsking(false)}
        />
      )}
    </>
  );
}

// The kiosk lock keeps visitors in the app (docs/KIOSK-LOCK.md). Staff unlock it here
// to install an update or change Android settings; it locks again on "Lock again" or
// the next restart.
function KioskLockPanel() {
  const [lock, setLock] = useState(null);
  const [asking, setAsking] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    kioskLockStatus().then(setLock);
  }, []);

  if (!lock) return null;

  const run = async (action, done) => {
    setAsking(false);
    try {
      await action();
      // Android takes a moment to switch lock task mode on or off.
      setTimeout(() => kioskLockStatus().then(setLock), 500);
      setStatus(done);
    } catch (err) {
      setStatus(err.message || "That didn't work.");
    }
  };

  const state = !lock.deviceOwner
    ? "The kiosk lock isn't set up on this kiosk. Visitors can still swipe in Android's bars. Setting it up needs a computer: see docs/KIOSK-LOCK.md."
    : lock.maintenance
      ? "Unlocked for maintenance. Android works normally until you lock it again or the kiosk restarts."
      : "Locked. Visitors can't leave the app.";

  return (
    <>
      <section className="panel mt-10 rounded-xl p-6" aria-labelledby="lock-title">
        <h2 id="lock-title" className="text-3xl">Kiosk lock</h2>
        <p className="mt-3 font-bold">{state}</p>
        {lock.deviceOwner && (
          <div className="mt-4 flex flex-wrap gap-4">
            {lock.maintenance ? (
              <button onClick={() => run(lockKiosk, "Locked again.")} className={buttonClass("primary")}>
                Lock again
              </button>
            ) : (
              <button
                onClick={() => run(unlockKiosk, "Unlocked. Press Home to reach Android's apps and settings.")}
                className={buttonClass("secondary")}
              >
                Unlock for maintenance
              </button>
            )}
            <button onClick={() => setAsking(true)} className={buttonClass("secondary")}>
              Remove the kiosk lock
            </button>
          </div>
        )}
        <p aria-live="polite" className="mt-2 text-text-muted">{status}</p>
      </section>

      {asking && (
        <ConfirmDialog
          title="Remove the kiosk lock?"
          message="Visitors will be able to leave the app. Turning the lock back on needs a computer and the setup in docs/KIOSK-LOCK.md. To install an update, use Unlock for maintenance instead."
          confirmLabel="Remove the lock"
          onConfirm={() => run(removeKioskLock, "The kiosk lock is removed.")}
          onCancel={() => setAsking(false)}
        />
      )}
    </>
  );
}
