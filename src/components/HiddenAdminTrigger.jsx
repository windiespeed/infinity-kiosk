import { useRef } from "react";
import { useNavigate } from "react-router";

const TAPS_NEEDED = 5;
const WITHIN_MS = 3000;

// An invisible square in the top-left corner. Five taps within three seconds opens the
// admin PIN screen. It is hidden from screen readers and keyboard focus on purpose;
// the PIN is the real protection.
export default function HiddenAdminTrigger() {
  const taps = useRef([]);
  const navigate = useNavigate();

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
