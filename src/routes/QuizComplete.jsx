import { useEffect, useState } from "react";
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
export default function QuizComplete() {
  const location = useLocation();
  const completed = Boolean(location.state?.completed);
  const { content, eraById } = useContent();
  const addBusy = useKiosk((state) => state.addBusy);
  const removeBusy = useKiosk((state) => state.removeBusy);

  // Fixed when the screen first shows.
  const [date] = useState(() => todayIso());

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
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-6 p-6 text-center landscape:flex-row landscape:gap-10 landscape:text-left">
      <div className="max-w-2xl landscape:flex-1">
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

      {/* The white box is a square as tall as the space allows, and never wider than 45% of the screen. */}
      <div className="aspect-square w-[min(80vw,24rem)] shrink-0 bg-white p-3 landscape:h-full landscape:max-h-[45vw] landscape:w-auto">
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
  );
}
