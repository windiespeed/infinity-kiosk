import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useKiosk } from "../../store/useKiosk.js";
import { useContent } from "../../hooks/useContent.jsx";
import { isValidPin } from "../../lib/pin.js";
import { buttonClass } from "../../lib/ui.js";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Enter"];

// Reached by tapping the top-left corner five times.
// On the kiosk's first launch there is no PIN yet, so this screen asks staff
// to create one (entered twice). After that it's a normal sign-in.
export default function AdminLogin() {
  const { store } = useContent();
  const update = useKiosk((s) => s.update);
  const navigate = useNavigate();
  const [mode, setMode] = useState("loading"); // loading | setup | confirm | signin
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    store.hasPin().then((has) => setMode(has ? "signin" : "setup"));
  }, [store]);

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

  const submit = async () => {
    if (mode === "signin") return signIn(pin);
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
      await store.setPin(pin);
      return signIn(pin);
    }
  };

  const press = (key) => {
    setError("");
    if (key === "Clear") setPin("");
    else if (key === "Enter") submit();
    else if (pin.length < 8) setPin(pin + key);
  };

  const heading = {
    loading: "Staff sign-in",
    signin: "Staff sign-in",
    setup: "Create a staff PIN",
    confirm: "Enter the PIN again",
  }[mode];

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col justify-end p-10">
      <h1 className="text-5xl">{heading}</h1>
      {mode === "setup" && (
        <p className="mt-3 text-text-muted">
          This kiosk has no PIN yet. Choose 4 to 8 digits and store it somewhere safe; it can't be recovered.
        </p>
      )}
      <p className="mt-4 text-2xl" aria-live="polite">
        {pin ? "•".repeat(pin.length) : "Enter PIN"}
      </p>
      {error && <p role="alert" className="mt-2 text-danger">{error}</p>}
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
      <Link to="/" className={buttonClass("secondary", "mt-6")}>Cancel</Link>
    </div>
  );
}
