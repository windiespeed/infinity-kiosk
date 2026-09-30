import { useParams } from "react-router";
import { useContent } from "../hooks/useContent.jsx";

// TODO (quiz issue): build the quiz component.
// - Event quiz: questionsForEvent(eventId)
// - Timeline challenge: one random question per era
// - Wrong answers show the explanation and allow another try (no timers)
// - Feedback uses an icon + text, announced with aria-live, never color alone
// - On finishing the challenge, go to /quiz/complete (QR certificate)
export function QuizHome() {
  return (
    <div className="p-10">
      <h1 className="text-6xl">Test your knowledge</h1>
      <p className="mt-4 text-2xl text-text-muted">
        The timeline challenge asks one question from each era. Finish it to get a certificate on your phone.
      </p>
      <p className="mt-8 rounded-xl border-2 border-highlight p-4">Quiz coming soon (starter placeholder).</p>
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
  return (
    <div className="p-10">
      <h1 className="text-6xl">You finished the challenge!</h1>
      <p className="mt-8 rounded-xl border-2 border-highlight p-4">QR certificate coming soon (starter placeholder).</p>
    </div>
  );
}
