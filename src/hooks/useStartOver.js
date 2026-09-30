import { useNavigate } from "react-router";
import { useKiosk } from "../store/useKiosk.js";

// Returns the kiosk to the welcome screen and clears the visitor's settings.
// Used by the Start over button and by the idle timer, so both behave the same.
export function useStartOver() {
  const navigate = useNavigate();
  const resetVisitor = useKiosk((s) => s.resetVisitor);
  return () => {
    resetVisitor();
    navigate("/", { replace: true });
  };
}
