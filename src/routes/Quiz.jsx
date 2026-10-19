import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { useKiosk } from "../store/useKiosk.js"; // check this path
import { useContent } from "../hooks/useContent.jsx";
import { COMPANION_URL } from "../lib/config.js";


const HOLD_MS = 2 * 60 * 1000;

// TODO (quiz issue): build the quiz component.
// - Event quiz: questionsForEvent(eventId)
// - Timeline challenge: one random question per era
// - Wrong answers show the explanation and allow another try (no timers)
// - Feedback uses an icon + text, announced with aria-live, never color alone
// - On finishing the challenge, go to /quiz/complete (QR certificate)
// export function QuizHome() {
//   return (
//     <div className="p-10">
//       <h1 className="text-6xl">Test your knowledge</h1>
//       <p className="mt-4 text-2xl text-text-muted">
//         The timeline challenge asks one question from each era. Finish it to get a certificate on your phone.
//       </p>
//       <p className="mt-8 rounded-xl border-2 border-highlight p-4">Quiz coming soon (starter placeholder).</p>
//     </div>
//   );
// }

/** Uncomment this to use the dev button for testing the certificate */
export function QuizHome() {
  const navigate = useNavigate();
  return (
    <div className="p-10">
      <h1 className="text-6xl">Test your knowledge</h1>
      <p className="mt-4 text-2xl text-text-muted">
        The timeline challenge asks one question from each era. Finish it to get a certificate on your phone.
      </p>
      <p className="mt-8 rounded-xl border-2 border-highlight p-4">Quiz coming soon (starter placeholder).</p>

      {import.meta.env.DEV && (
        <button
          type="button"
          className="mt-6 rounded-xl border-2 p-4"
          onClick={() => navigate("/quiz/complete", { state: { completed: true } })}
        >
          DEV: skip to certificate screen
        </button>
      )}
    </div>
  );
}

export function EventQuiz() {
  const { eventId } = useParams();
  const { eventById, questionsForEvent } = useContent();
  const event = eventById(eventId);
  const questions = questionsForEvent(eventId);

  return (
    <div className="p-10">
      <h1 className="text-6xl">Test yourself: {event?.shortTitle}</h1>
      <p className="mt-4 text-text-muted">This event has {questions.length} question(s) ready.</p>
      <p className="mt-8 rounded-xl border-2 border-highlight p-4">Quiz coming soon (starter placeholder).</p>
    </div>
  );
}

// TODO (certificate issue): show a large QR code (qrcode.react) linking to the
// companion site's certificate page, e.g. https://COMPANION/certificate?d=2026-10-30&c=timeline
// Pause the idle timer here or give it extra time.



export function QuizComplete() {
  const location = useLocation();
  const completed = Boolean(location.state?.completed);
  const addBusy = useKiosk((s) => s.addBusy);
  const removeBusy = useKiosk((s) => s.removeBusy);

  // Local date as YYYY-MM-DD, fixed when the screen first shows
  const [date] = useState(() => new Date().toLocaleDateString("en-CA"));

  useEffect(() => {
    if (!completed) return;
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        removeBusy();
      }
    };
    addBusy();
    const timer = setTimeout(release, HOLD_MS); // idle timer may take over after 2 min
    return () => {
      clearTimeout(timer);
      release(); // always release when leaving the screen
    };
  }, [completed, addBusy, removeBusy]);

  if (!completed) return <Navigate to="/quiz" replace />;

  const url = `${COMPANION_URL}/certificate?d=${date}&c=timeline`;
  const shortAddress = COMPANION_URL.replace(/^https?:\/\//, "");

  return (
    <div className="flex flex-col items-center p-10 text-center">
      <h1 className="text-6xl">You finished the challenge!</h1>
      <p className="mt-6 max-w-3xl text-3xl">
        Scan with your phone's camera
      </p>
      <p className="mt-2 max-w-3xl text-xl text-text-muted">
        The code opens a page on your phone where you can type your name and save your certificate as a picture.
        Your name is never typed on this screen or stored.
      </p>

      <div className="mt-8 bg-white p-6">
        <QRCodeSVG
          value={url}
          size={420}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
          marginSize={4}
          role="img"
          aria-label={`QR code. Scan it with your phone camera to open the certificate page at ${shortAddress}`}
        />
      </div>

      <p className="mt-6 text-2xl">{shortAddress}</p>
    </div>
  );
}
