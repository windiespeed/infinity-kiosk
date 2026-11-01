import { useEffect, useState } from "react";
import { useContent } from "../hooks/useContent.jsx";
import { buttonClass } from "../lib/ui.js";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Enter"];

// Shown while content loads, or if it can't be loaded.
export default function PageStatus() {
  const { error, store } = useContent();
  if (error?.code === "content-rejected" && store?.kind === "device") return <UpdateNeeded error={error} />;
  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      {error ? (
        <div role="alert">
          <h1 className="text-4xl">Content could not load</h1>
          <p className="mt-3 text-text-muted">
            Check that the kiosk server is running, then restart the kiosk.
          </p>
          {error.message && <p className="mt-3 text-sm text-text-muted">{error.message}</p>}
        </div>
      ) : (
        <p aria-live="polite" className="text-text-muted">Loading…</p>
      )}
    </div>
  );
}

// The kiosk's saved content doesn't meet this version's content rules. That happens when
// a new version of the app is installed over content made for an older one. The app
// itself did update, but visitors can't use it until staff finish the update here:
// the staff PIN switches to the content built into this version (the old content is kept
// as a saved version on the kiosk; the PIN, recovery code and uploaded photos stay).
function UpdateNeeded({ error }) {
  const { store, reload } = useContent();
  const [hasPin, setHasPin] = useState(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    store.hasPin().then(setHasPin);
  }, [store]);

  const finish = async () => {
    setBusy(true);
    setProblem("");
    try {
      if (hasPin && !(await store.signIn(pin))) {
        setProblem("That PIN isn't correct.");
        setPin("");
        return;
      }
      await store.useBundledContent();
      await reload();
    } catch (err) {
      console.error(err);
      setProblem(err.message);
    } finally {
      setBusy(false);
    }
  };

  const press = (key) => {
    setProblem("");
    if (key === "Clear") setPin("");
    else if (key === "Enter") finish();
    else if (pin.length < 8) setPin(pin + key);
  };

  return (
    <div role="alert" className="mx-auto grid min-h-full max-w-7xl items-end gap-10 p-10 md:grid-cols-2">
      <div>
        <h1 className="text-4xl">This update isn't finished</h1>
        <p className="mt-3">
          A new version of the kiosk app was installed, but the content saved on this kiosk was made for an older
          version and can't be shown. Visitors can't use the kiosk until staff finish the update.
        </p>
        <p className="mt-2 text-sm text-text-muted">{error.message}</p>
        <h2 className="mt-6 text-2xl">Staff: finish the update</h2>
        <p className="mt-2 text-text-muted">
          {hasPin === false
            ? "Switch to the content that came with this version."
            : "Enter the staff PIN to switch to the content that came with this version."}{" "}
          The old content is kept as a saved version on the kiosk. The PIN, recovery code and uploaded photos stay.
          Afterwards, import a newer backup in admin if the kiosk had changes of its own.
        </p>
        <p className="mt-3 text-sm text-text-muted">
          PIN forgotten? Android Settings → Apps → Infinity Kiosk → Storage → Clear storage also finishes the update,
          but it erases everything saved on the kiosk, including the PIN. (It's not available while the kiosk lock is on.)
        </p>
      </div>

      <div>
        {hasPin && (
          <>
            <label htmlFor="update-pin" className="block text-text-muted">Staff PIN</label>
            {/* inputMode="none" keeps Android's keyboard closed; staff use the keypad below. */}
            <input
              id="update-pin"
              type="password"
              inputMode="none"
              autoComplete="off"
              maxLength={8}
              value={pin}
              disabled={busy}
              aria-describedby={problem ? "update-problem" : undefined}
              onChange={(e) => {
                setProblem("");
                setPin(e.target.value.replace(/\D/g, "").slice(0, 8));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  finish();
                }
              }}
              className="mt-2 min-h-14 w-full rounded-xl border-2 border-text-muted bg-bg px-4 text-3xl tracking-[0.5em] text-text"
            />
          </>
        )}
        {problem && <p id="update-problem" className="mt-2 text-danger">{problem}</p>}
        {hasPin ? (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {KEYS.map((key) => (
              <button
                key={key}
                onClick={() => press(key)}
                disabled={busy}
                className={buttonClass(key === "Enter" ? "primary" : "secondary", "text-2xl")}
              >
                {key}
              </button>
            ))}
          </div>
        ) : (
          hasPin === false && (
            <button onClick={finish} disabled={busy} className={buttonClass("primary", "w-full")}>
              Finish update
            </button>
          )
        )}
      </div>
    </div>
  );
}
