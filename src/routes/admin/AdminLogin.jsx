import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useKiosk } from "../../store/useKiosk.js";
import { buttonClass } from "../../lib/ui.js";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Enter"];

// Reached by tapping the top-left corner five times. The PIN is checked by the local
// server against the hash in .env; it never appears in the app's code.
export default function AdminLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const update = useKiosk((s) => s.update);
  const navigate = useNavigate();

  const submit = async () => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Sign-in failed.");
      setPin("");
      return;
    }
    update({ adminToken: data.token });
    navigate("/admin/dashboard", { replace: true });
  };

  const press = (key) => {
    setError("");
    if (key === "Clear") setPin("");
    else if (key === "Enter") submit();
    else if (pin.length < 8) setPin(pin + key);
  };

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col justify-end p-10">
      <h1 className="text-5xl">Staff sign-in</h1>
      <p className="mt-4 text-2xl" aria-live="polite">
        {pin ? "•".repeat(pin.length) : "Enter PIN"}
      </p>
      {error && <p role="alert" className="mt-2 text-danger">{error}</p>}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <button key={key} onClick={() => press(key)} className={buttonClass(key === "Enter" ? "primary" : "secondary", "text-3xl")}>
            {key}
          </button>
        ))}
      </div>
      <Link to="/" className={buttonClass("secondary", "mt-6")}>Cancel</Link>
    </div>
  );
}
