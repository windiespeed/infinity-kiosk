import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { useKiosk } from "../store/useKiosk.js";
import { useContent } from "../hooks/useContent.jsx";
import { buttonClass } from "../lib/ui.js";
import { COMPANION_URL } from "../lib/config.js";
import QuizQuestion from "../components/QuizQuestion.jsx";

const HOLD_MS = 2 * 60 * 1000;

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

// Select one random question from each era that has available questions.
function questionsForTimeline(questions, eras, eventById) {
  return eras.flatMap((era) => {
    const eraQuestions = questions.filter((question) => {
      const event = eventById(question.eventId);
      return event?.eraIds?.includes(era.id);
    });

    return eraQuestions.length > 0 ? [randomItem(eraQuestions)] : [];
  });
}

/** Timeline challenge landing page and quiz. */
export function QuizHome() {
  const { content, eras, eventById } = useContent();
  const navigate = useNavigate();
  const [challengeQuestions, setChallengeQuestions] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);

  if (!content || !eras || !eventById) {
    return (
      <div className="p-6 sm:p-10" role="status">
        Loading quiz questions…
      </div>
    );
  }

  const availableQuestions = questionsForTimeline(
    content.questions ?? [],
    eras,
    eventById
  );

  function startChallenge() {
    // Pick the questions when the visitor starts, rather than on every render.
    const selectedQuestions = questionsForTimeline(
      content.questions ?? [],
      eras,
      eventById
    );

    if (selectedQuestions.length === 0) return;

    setChallengeQuestions(selectedQuestions);
    setQuestionIndex(0);
  }

  function nextQuestion() {
    if (questionIndex + 1 < challengeQuestions.length) {
      setQuestionIndex((index) => index + 1);
      return;
    }

    navigate("/quiz/complete", {
      state: { completed: true },
    });
  }

  if (challengeQuestions) {
    const question = challengeQuestions[questionIndex];

    return (
      <QuizQuestion
        key={question.id ?? question.prompt}
        question={question}
        questionNumber={questionIndex + 1}
        totalQuestions={challengeQuestions.length}
        onNext={nextQuestion}
        isLastQuestion={questionIndex === challengeQuestions.length - 1}
      />
    );
  }

  return (
    <main className="p-6 sm:p-10">
      <h1 className="text-4xl font-bold sm:text-6xl">
        Test your knowledge
      </h1>

      <p className="mt-4 max-w-3xl text-xl text-text-muted">
        The timeline challenge asks one randomly selected question from each
        era that has questions. Answer every question correctly to finish the
        challenge and continue to the certificate page.
      </p>

      {availableQuestions.length > 0 ? (
        <>
          <p className="mt-4 text-lg">
            {availableQuestions.length} question
            {availableQuestions.length === 1 ? "" : "s"} available in this
            challenge.
          </p>

          <button
            type="button"
            className={buttonClass("primary", "mt-8 text-xl")}
            onClick={startChallenge}
          >
            Start the timeline challenge
          </button>
        </>
      ) : (
        <p className="mt-8 rounded-xl border-2 border-highlight p-4">
          No quiz questions are available yet. Add questions linked to
          published events to get started.
        </p>
      )}

      {import.meta.env.DEV && (
        <button
          type="button"
          className={buttonClass("secondary", "mt-6 text-lg")}
          onClick={() =>
            navigate("/quiz/complete", {
              state: { completed: true },
            })
          }
        >
          DEV: skip to certificate screen
        </button>
      )}
    </main>
  );
}

/** Quiz questions for an individual event. */
export function EventQuiz() {
  const { eventId } = useParams();
  const { content, eventById, questionsForEvent } = useContent();
  const navigate = useNavigate();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!content || !eventById || !questionsForEvent) {
    return (
      <main className="p-6 sm:p-10" role="status">
        Loading quiz questions…
      </main>
    );
  }

  const event = eventById(eventId);
  const questions = questionsForEvent(eventId);

  if (!event) {
    return (
      <main className="p-6 sm:p-10">
        <h1 className="text-3xl font-bold">Event not found</h1>
        <Link
          to="/quiz"
          className={buttonClass("primary", "mt-6 text-xl")}
        >
          Back to the timeline challenge
        </Link>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="p-6 sm:p-10">
        <h1 className="text-3xl font-bold">
          Test yourself: {event.shortTitle}
        </h1>
        <p className="mt-4 text-xl text-text-muted">
          There are no questions for this event yet.
        </p>
        <button
          type="button"
          className={buttonClass("primary", "mt-6 text-xl")}
          onClick={() => navigate(-1)}
        >
          Back to the event
        </button>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="p-6 sm:p-10">
        <h1 className="text-4xl font-bold sm:text-6xl">You finished!</h1>

        <p className="mt-4 text-xl text-text-muted">
          You answered every question about {event.shortTitle} correctly.
        </p>

        <div className="mt-8 flex flex-col items-start gap-4">
          <button
            type="button"
            className={buttonClass("primary", "text-xl")}
            onClick={() => navigate(-1)}
          >
            Back to the event
          </button>

          <Link
            to="/quiz"
            className={buttonClass("secondary", "text-xl")}
          >
            Go to the timeline challenge
          </Link>
        </div>
      </main>
    );
  }

  const question = questions[questionIndex];

  return (
    <main>
      <div className="px-6 pt-6 sm:px-10">
        <p className="text-lg text-text-muted">
          Test yourself: {event.shortTitle}
        </p>
      </div>

      <QuizQuestion
        key={question.id ?? question.prompt}
        question={question}
        questionNumber={questionIndex + 1}
        totalQuestions={questions.length}
        onNext={() => {
          if (questionIndex + 1 < questions.length) {
            setQuestionIndex((index) => index + 1);
          } else {
            setFinished(true);
          }
        }}
        isLastQuestion={questionIndex === questions.length - 1}
      />
    </main>
  );
}

// TODO (certificate issue): show a large QR code (qrcode.react) linking to the
// companion site's certificate page, e.g. https://COMPANION/certificate?d=2026-10-30&c=timeline
// Pause the idle timer here or give it extra time.
export function QuizComplete() {
  const location = useLocation();
  const completed = Boolean(location.state?.completed);
  const addBusy = useKiosk((state) => state.addBusy);
  const removeBusy = useKiosk((state) => state.removeBusy);

  // Local date as YYYY-MM-DD, fixed when the screen first shows.
  const [date] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

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

  const companionUrl = COMPANION_URL.replace(/\/+$/, "");
  const url = `${companionUrl}/certificate?d=${date}&c=timeline`;
  const shortAddress = companionUrl.replace(/^https?:\/\//, "");

  return (
    <main className="flex flex-col items-center p-6 text-center sm:p-10">
      <h1 className="text-4xl font-bold sm:text-6xl">
        You finished the challenge!
      </h1>

      <p className="mt-6 max-w-3xl text-2xl sm:text-3xl">
        Scan with your phone&apos;s camera.
      </p>

      <p className="mt-2 max-w-3xl text-lg text-text-muted sm:text-xl">
        The code opens a page on your phone where you can type your name and
        save your certificate as a picture. Your name is never typed on this
        screen or stored.
      </p>

      <div className="mt-8 max-w-full bg-white p-4 sm:p-6">
        <QRCodeSVG
          value={url}
          size={420}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
          marginSize={4}
          role="img"
          aria-label={`QR code. Scan it with your phone camera to open the certificate page at ${shortAddress}`}
          style={{ display: "block", maxWidth: "100%", height: "auto" }}
        />
      </div>

      <p className="mt-6 break-all text-xl sm:text-2xl">
        {shortAddress}
      </p>
    </main>
  );
}