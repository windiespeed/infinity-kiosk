import { useEffect, useRef, useState } from "react";
import { useKiosk } from "../store/useKiosk.js";

// Watches for touches and key presses. After `idleSeconds` with no activity it shows
// a warning; after `warningSeconds` more it calls onReset. While anything is marked
// busy (for example a playing video), the kiosk never counts as idle.
export function useIdleTimer({ idleSeconds, warningSeconds, enabled, onReset }) {
  const [warning, setWarning] = useState(false);
  const [remaining, setRemaining] = useState(warningSeconds);
  const lastActivity = useRef(Date.now());
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;
  const busy = useKiosk((s) => s.busy);

  useEffect(() => {
    const markActive = () => {
      lastActivity.current = Date.now();
      setWarning(false);
    };
    const events = ["pointerdown", "keydown", "wheel"];
    events.forEach((e) => window.addEventListener(e, markActive, { capture: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, markActive, { capture: true }));
  }, []);

  useEffect(() => {
    lastActivity.current = Date.now();
    setWarning(false);
    if (!enabled) return;

    const tick = setInterval(() => {
      if (busy > 0) {
        lastActivity.current = Date.now();
        return;
      }
      const idle = (Date.now() - lastActivity.current) / 1000;
      if (idle >= idleSeconds + warningSeconds) {
        setWarning(false);
        lastActivity.current = Date.now();
        onResetRef.current();
      } else if (idle >= idleSeconds) {
        setWarning(true);
        setRemaining(Math.ceil(idleSeconds + warningSeconds - idle));
      }
    }, 500);
    return () => clearInterval(tick);
  }, [enabled, busy, idleSeconds, warningSeconds]);

  const stayHere = () => {
    lastActivity.current = Date.now();
    setWarning(false);
  };

  return { warning, remaining, stayHere };
}
