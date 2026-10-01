import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

const TAPS_NEEDED = 5;
const WITHIN_MS = 3000;

// Two ways for staff to reach the admin PIN screen:
// - Touch: five taps within three seconds in the invisible top-left square.
// - Keyboard: Ctrl + Alt + A (for staff who use a keyboard or switch device).
// Both are hidden from visitors on purpose; the PIN is the real protection.
export default function HiddenAdminTrigger() {
  const taps = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        navigate("/admin");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  const onPointerDown = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < WITHIN_MS), now];
    if (taps.current.length >= TAPS_NEEDED) {
      taps.current = [];
      navigate("/admin");
    }
  };

  return <div aria-hidden="true" onPointerDown={onPointerDown} className="fixed left-0 top-0 z-40 h-24 w-24" />;
}
