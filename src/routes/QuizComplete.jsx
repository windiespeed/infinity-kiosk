import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { useKiosk } from "../store/useKiosk.js";
import { useContent } from "../hooks/useContent.jsx";
import { certificateLink, quizName, todayIso } from "../lib/certificate.js";

const HOLD_MS = 2 * 60 * 1000;

// After a quiz: a QR code to the certificate page on the visitor's phone.
// Arrives with state { completed: true, eraId } (no eraId = the whole-timeline challenge).
// The idle timer is held for HOLD_MS so visitors have time to scan it.
// Sized to the space above the bottom bar so nothing needs scrolling on the kiosk.
// Text follows the screen height, times 1.25 with Larger text (the QR matches its height).
// In a very short space (Larger text plus Move content lower) it shrinks to fit (cqh) and
// the explanation paragraph is left out.
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export default function QuizComplete() {
  const location = useLocation();
  const completed = Boolean(location.state?.completed);
  const { content, eraById } = useContent();
  const addBusy = useKiosk((state) => state.addBusy);
  const removeBusy = useKiosk((state) => state.removeBusy);
  const largeText = useKiosk((state) => state.textSize === "large");

  // Fixed when the screen first shows.
  const [date] = useState(() => todayIso());

  // In landscape the QR code is a square as tall as the text beside it,
  // but never taller than the space above the bottom bar.
  const rootRef = useRef(null);
  const textRef = useRef(null);
  const [qrSize, setQrSize] = useState(0);
  useEffect(() => {
    const root = rootRef.current;
    const text = textRef.current;
    if (!root || !text) return undefined;
    const measure = () => {
      const style = getComputedStyle(root);
      const space = root.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      setQrSize(Math.min(text.offsetHeight, space));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(text);
    return () => observer.disconnect();
  }, [completed]);
  const landscape = useMediaQuery("(orientation: landscape)");

  useEffect(() => {
    if (!completed) return undefined;

    let released = false;

    const release = () => {
      if (!released) {
        released = true;
        removeBusy();
      }
    };

    addBusy();

    const timer = setTimeout(release, HOLD_MS);

    return () => {
      clearTimeout(timer);
      release();
    };
  }, [completed, addBusy, removeBusy]);

  if (!completed) {
    return <Navigate to="/quiz" replace />;
  }

  const era = location.state?.eraId ? eraById(location.state.eraId) : null;
  const url = certificateLink(content.settings?.certificateSite, { date, eraId: era?.id });
  const shortAddress = url.replace(/^https?:\/\//, "").replace(/\/certificate.*$/, "");

  return (
    <div
      ref={rootRef}
      className="flex h-full min-h-0 items-center justify-center p-6 [container-type:size]"
      style={{ "--text-scale": largeText ? 1.25 : 1 }}
    >
      <div className="flex flex-col items-center gap-6 text-center landscape:flex-row landscape:gap-10 landscape:text-left">
        <div ref={textRef} className={`max-w-2xl ${largeText ? "landscape:max-w-[60vw]" : "landscape:max-w-[48vw]"}`}>
          <h1 className="text-[min(clamp(1.75rem,calc(5.5vh*var(--text-scale)),4.5rem),12cqh)] font-bold">
            {`You finished ${quizName(era)}!`}
          </h1>

          <p className="mt-[2.5vh] text-[min(clamp(1.25rem,calc(4vh*var(--text-scale)),2.75rem),8cqh)]">
            Scan with your phone&apos;s camera to get your certificate.
          </p>

          <p className="mt-[1.5vh] text-[clamp(1rem,calc(2.8vh*var(--text-scale)),1.85rem)] text-text-muted [@container(max-height:520px)]:hidden">
            The code opens a page on your phone where you can type your name and
            save your certificate as a picture. Your name is never typed on this
            screen or stored.
          </p>

          <p className="mt-[2.5vh] break-all text-[min(clamp(1rem,calc(3vh*var(--text-scale)),2.1rem),6cqh)]">{shortAddress}</p>
        </div>

        <div
          className="aspect-square w-[min(80vw,24rem)] shrink-0 bg-white p-3"
          style={landscape && qrSize ? { width: qrSize, height: qrSize } : undefined}
        >
          <QRCodeSVG
            value={url}
            size={420}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
            marginSize={2}
            role="img"
            aria-label={`QR code. Scan it with your phone camera to open the certificate page at ${shortAddress}`}
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
