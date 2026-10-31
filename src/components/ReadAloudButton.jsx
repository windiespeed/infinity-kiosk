import { useEffect, useState } from "react";
import { speak, stop } from "../lib/speech.js";

// Round play/stop button that reads `text` aloud. Used by the event panel and the quiz.
// Speech stops when the button goes away (the panel closes, the visitor moves on, or
// the kiosk starts over), so the next visitor never hears the last one's event.
export default function ReadAloudButton({ text, label, stopLabel }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => () => void stop(), []);

  async function toggle() {
    if (isSpeaking) {
      await stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    try {
      await speak(text);
    } catch (error) {
      console.error("Unable to read aloud:", error);
    } finally {
      setIsSpeaking(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="group relative grid size-14 shrink-0 place-items-center rounded-full border border-highlight/40 bg-gradient-to-br from-surface to-bg shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-highlight motion-reduce:transition-none"
      aria-label={isSpeaking ? stopLabel : label}
      aria-pressed={isSpeaking}
      title={isSpeaking ? "Stop reading" : "Read aloud"}
    >
      {/* Glowing outer ring */}
      <span
        aria-hidden="true"
        className={`absolute -inset-1 rounded-full border-2 border-highlight/60 transition-opacity duration-300 ${
          isSpeaking ? "animate-pulse opacity-100" : "opacity-40"
        }`}
      />
      {/* Play / stop symbol */}
      <span aria-hidden="true" className="relative h-6 w-6">
        <span
          className={`absolute inset-0 bg-text transition-all duration-300 ${
            isSpeaking ? "scale-75 rounded-sm" : "[clip-path:polygon(22%_6%,50%_24%,50%_76%,22%_94%)]"
          }`}
        />
        <span
          className={`absolute inset-0 bg-text transition-all duration-300 ${
            isSpeaking ? "scale-75 rounded-sm" : "[clip-path:polygon(50%_24%,90%_50%,90%_50%,50%_76%)]"
          }`}
        />
      </span>
    </button>
  );
}
