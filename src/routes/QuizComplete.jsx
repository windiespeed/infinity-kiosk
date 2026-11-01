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

  // Fixed when the screen first shows.
  const [date] = useState(() => todayIso());

  // In landscape the QR code is a square as tall as the text beside it.
  const textRef = useRef(null);
  const [textHeight, setTextHeight] = useState(0);
  useEffect(() => {
    const el = textRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(() => setTextHeight(el.offsetHeight));
    observer.observe(el);
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
    <div className="flex h-full min-h-0 items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 text-center landscape:flex-row landscape:gap-10 landscape:text-left">
        <div ref={textRef} className="max-w-2xl landscape:max-w-[48vw]">
          <h1 className="text-[clamp(1.75rem,5.5vh,3.75rem)] font-bold">
            {`You finished ${quizName(era)}!`}
          </h1>

          <p className="mt-[2.5vh] text-[clamp(1.25rem,4vh,2.25rem)]">
            Scan with your phone&apos;s camera to get your certificate.
          </p>

          <p className="mt-[1.5vh] text-[clamp(1rem,2.8vh,1.5rem)] text-text-muted">
            The code opens a page on your phone where you can type your name and
            save your certificate as a picture. Your name is never typed on this
            screen or stored.
          </p>

          <p className="mt-[2.5vh] break-all text-[clamp(1rem,3vh,1.75rem)]">{shortAddress}</p>
        </div>

        <div
          className="aspect-square w-[min(80vw,24rem)] shrink-0 bg-white p-3"
          style={landscape && textHeight ? { width: textHeight, height: textHeight } : undefined}
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
