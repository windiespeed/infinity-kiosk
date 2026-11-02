import { useNavigate } from "react-router";
import { useKiosk } from "../store/useKiosk.js";
import { stop } from "../lib/speech.js";

// Returns the kiosk to the welcome screen and clears the visitor's settings.
// Used by the Start over button and by the idle timer, so both behave the same.
// Any read-aloud speech stops too, so the next visitor starts in silence.
export function useStartOver() {
  const navigate = useNavigate();
  const resetVisitor = useKiosk((s) => s.resetVisitor);
  return () => {
    stop();
    resetVisitor();
    navigate("/", { replace: true });
  };
}
