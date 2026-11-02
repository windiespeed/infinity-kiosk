import { useEffect, useRef, useState } from "react";
import { useNavigate, Link, Navigate } from "react-router";
import { useKiosk } from "../../store/useKiosk.js";
import { useContent } from "../../hooks/useContent.jsx";
import { formatRecoveryCode, isValidPin, RECOVERY_CODE_LENGTH } from "../../lib/pin.js";
import { buttonClass } from "../../lib/ui.js";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Enter"];

// Reached by tapping the top-left corner five times.
// On the kiosk's first launch there is no PIN yet, so this screen asks staff
// to create one (entered twice). After that it's a normal sign-in.
// On the kiosk, setting a PIN also shows a one-time recovery code. "Forgot the PIN?"
// takes that code and lets staff choose a new PIN without losing any content.
export default function AdminLogin() {
  const { store } = useContent();
  const token = useKiosk((s) => s.adminToken);
  const update = useKiosk((s) => s.update);
  const navigate = useNavigate();
  // loading | signin | setup | confirm | recover (enter recovery code) | code (show the new code)
  const [mode, setMode] = useState("loading");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [recoveryCode, setRecoveryCode] = useState(""); // the code entered in "recover", then used in setup
  const [newCode, setNewCode] = useState(""); // the code to show staff once
  const [newPin, setNewPin] = useState(""); // signs in after the code is shown
  const [canRecover, setCanRecover] = useState(false); // a recovery code exists
  const maxLength = mode === "recover" ? RECOVERY_CODE_LENGTH : 8;
  const inputRef = useRef(null);

  useEffect(() => {
    store.hasPin().then((has) => setMode(has ? "signin" : "setup"));
    store.hasRecoveryCode().then(setCanRecover);
  }, [store]);

  // Put the cursor in the PIN field on arrival and whenever the step changes,
  // so keyboard users can type right away.
  useEffect(() => {
    if (!["loading", "code"].includes(mode)) inputRef.current?.focus();
  }, [mode]);

  // Already signed in: go straight to the dashboard.
  if (token) return <Navigate to="/admin/dashboard" replace />;

  const signIn = async (value) => {
    const session = await store.signIn(value);
    if (!session) {
      setError("That PIN isn't correct.");
      setPin("");
      return;
    }
    update({ adminToken: session });
    navigate("/admin/dashboard", { replace: true });
  };

  // After a PIN is set on the kiosk: make a new recovery code and show it once.
  const finishSetup = async (value) => {
    if (store.kind !== "device") return signIn(value);
    setNewPin(value);
    setNewCode(await store.newRecoveryCode());
    setPin("");
    setMode("code");
  };

  const submit = async () => {
    if (mode === "signin") return signIn(pin);
    if (mode === "recover") {
      const ok = pin.length === RECOVERY_CODE_LENGTH && (await store.checkRecoveryCode(pin));
      setPin("");
      if (!ok) return setError("That recovery code isn't right.");
      setRecoveryCode(pin);
      return setMode("setup");
    }
    if (mode === "setup") {
      if (!isValidPin(pin)) return setError("Use 4 to 8 digits.");
      setFirstPin(pin);
      setPin("");
      return setMode("confirm");
    }
    if (mode === "confirm") {
      if (pin !== firstPin) {
        setError("Those PINs didn't match. Start again.");
        setPin("");
        setFirstPin("");
        return setMode("setup");
      }
      if (recoveryCode) {
        if (!(await store.resetPin(recoveryCode, pin))) {
          setRecoveryCode("");
          setPin("");
          setError("That recovery code isn't right.");
          return setMode("recover");
        }
      } else {
        await store.setPin(pin);
      }
      return finishSetup(pin);
    }
  };

  const press = (key) => {
    setError("");
    if (key === "Clear") setPin("");
    else if (key === "Enter") submit();
    else if (pin.length < maxLength) setPin(pin + key);
  };

  const heading = {
    loading: "Staff sign-in",
    signin: "Staff sign-in",
    setup: recoveryCode ? "Choose a new staff PIN" : "Create a staff PIN",
    confirm: "Enter the PIN again",
    recover: "Enter the recovery code",
    code: "Write down this recovery code",
  }[mode];

  if (mode === "code") {
    return (
      <div className="mx-auto flex h-full max-w-xl flex-col justify-end p-10">
        <h1 className="text-5xl">{heading}</h1>
        <p className="mt-3 text-text-muted">
          If the PIN is ever forgotten, this code lets staff choose a new one without losing any content. Keep it
          somewhere safe, away from the kiosk. It is shown only now, and works once.
        </p>
        <p className="mt-6 rounded-xl border-2 border-accent p-6 text-center font-display text-5xl tracking-widest">
          {formatRecoveryCode(newCode)}
        </p>
        <button
          autoFocus
          onClick={() => {
            setNewCode("");
            signIn(newPin);
          }}
          className={buttonClass("primary", "mt-6")}
        >
          I've written it down
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col justify-end p-10">
      <h1 className="text-5xl">{heading}</h1>
      {mode === "setup" && (
        <p className="mt-3 text-text-muted">
          {recoveryCode
            ? "Choose 4 to 8 digits. You'll get a new recovery code next."
            : "This kiosk has no PIN yet. Choose 4 to 8 digits and store it somewhere safe."}
        </p>
      )}
      {mode === "recover" && (
        <p className="mt-3 text-text-muted">
          The {RECOVERY_CODE_LENGTH}-digit code shown when the PIN was set. Then you choose a new PIN.
        </p>
      )}
      {/* A real field, so physical keyboards can type the PIN and press Enter.
          inputMode="none" keeps Android's on-screen keyboard closed on the kiosk,
          where staff use the large keypad below instead. */}
      <label htmlFor="pin" className="mt-6 block text-text-muted">{mode === "recover" ? "Recovery code" : "Staff PIN"}</label>
      <input
        id="pin"
        ref={inputRef}
        type="password"
        inputMode="none"
        autoComplete="off"
        maxLength={maxLength}
        value={pin}
        disabled={mode === "loading"}
        aria-describedby={error ? "pin-error" : undefined}
        onChange={(e) => {
          setError("");
          setPin(e.target.value.replace(/\D/g, "").slice(0, maxLength));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        className="mt-2 min-h-14 w-full rounded-xl border-2 border-text-muted bg-bg px-4 text-3xl tracking-[0.5em] text-text"
      />
      {error && <p id="pin-error" role="alert" className="mt-2 text-danger">{error}</p>}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <button
            key={key}
            onClick={() => press(key)}
            disabled={mode === "loading"}
            className={buttonClass(key === "Enter" ? "primary" : "secondary", "text-3xl")}
          >
            {key}
          </button>
        ))}
      </div>
      {mode === "signin" && canRecover && (
        <button
          onClick={() => {
            setError("");
            setPin("");
            setMode("recover");
          }}
          className={buttonClass("secondary", "mt-6")}
        >
          Forgot the PIN?
        </button>
      )}
      <Link to="/" className={buttonClass("secondary", "mt-3")}>Cancel</Link>
    </div>
  );
}
