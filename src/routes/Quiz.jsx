import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";
import { useContent } from "../hooks/useContent.jsx";
import { buttonClass } from "../lib/ui.js";
import QuizQuestion from "../components/QuizQuestion.jsx";
import RocketLaunch from "../components/RocketLaunch.jsx";

// "Back to the event" goes up to the event, like the bottom bar's Back button,
// not back in browser history (which may belong to the previous visitor).
const eventPath = (event) => `/era/${event.eraIds[0]}/event/${event.id}`;

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
  const [isLaunching, setIsLaunching] = useState(false);

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

    setIsLaunching(true);
  }
  if (isLaunching) {
    return (
      <RocketLaunch
        onComplete={() =>
          navigate("/quiz/complete", {
            state: { completed: true },
          })
        }
      />
    );
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
        isTimelineChallenge={true}
      />
    );
  }

  return (
    <div className="p-6 sm:p-10">
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
    </div>
  );
}

/** Quiz questions for an individual event. */
export function EventQuiz() {
  const { eventId } = useParams();
  const { content, eventById, questionsForEvent } = useContent();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!content || !eventById || !questionsForEvent) {
    return (
      <div className="p-6 sm:p-10" role="status">
        Loading quiz questions…
      </div>
    );
  }

  const event = eventById(eventId);
  const questions = questionsForEvent(eventId);

  if (!event) {
    return (
      <div className="p-6 sm:p-10">
        <h1 className="text-3xl font-bold">Event not found</h1>
        <Link
          to="/quiz"
          className={buttonClass("primary", "mt-6 text-xl")}
        >
          Back to the timeline challenge
        </Link>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 sm:p-10">
        <h1 className="text-3xl font-bold">
          Test yourself: {event.shortTitle}
        </h1>
        <p className="mt-4 text-xl text-text-muted">
          There are no questions for this event yet.
        </p>
        <Link to={eventPath(event)} className={buttonClass("primary", "mt-6 text-xl")}>
          Back to the event
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="p-6 sm:p-10">
        <h1 className="text-4xl font-bold sm:text-6xl">You finished!</h1>

        <p className="mt-4 text-xl text-text-muted">
          You answered every question about {event.shortTitle} correctly.
        </p>

        <div className="mt-8 flex flex-col items-start gap-4">
          <Link to={eventPath(event)} className={buttonClass("primary", "text-xl")}>
            Back to the event
          </Link>

          <Link
            to="/quiz"
            className={buttonClass("secondary", "text-xl")}
          >
            Go to the timeline challenge
          </Link>
        </div>
      </div>
    );
  }

  const question = questions[questionIndex];

  return (
    <div>
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
    </div>
  );
}
