import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
} from "react-router";
import { useContent } from "../hooks/useContent.jsx";
import { buttonClass } from "../lib/ui.js";
import QuizQuestion from "../components/QuizQuestion.jsx";
import RocketLaunch from "../components/RocketLaunch.jsx";

// An era quiz asks this many of that era's questions (or all of them, if fewer).
const ERA_QUIZ_LENGTH = 5;

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// A question belongs to the era of the event it is linked to.
function questionsForEra(questions, eraId, eventById) {
  return questions.filter((question) =>
    eventById(question.eventId)?.eraIds?.includes(eraId)
  );
}

// Select one random question from each era that has available questions.
function questionsForTimeline(questions, eras, eventById) {
  return eras.flatMap((era) => {
    const eraQuestions = questionsForEra(questions, era.id, eventById);
    return eraQuestions.length > 0 ? [randomItem(eraQuestions)] : [];
  });
}

/**
 * Runs a quiz: a start screen, then one question at a time, then the rocket
 * launch and the certificate screen. pickQuestions is called when the visitor
 * presses Start, so every visitor gets a fresh random set.
 */
function QuizRun({ title, intro, startLabel, pickQuestions, eraId, children }) {
  const navigate = useNavigate();
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);

  const available = pickQuestions().length;

  function start() {
    const selectedQuestions = pickQuestions();
    if (selectedQuestions.length === 0) return;

    setQuizQuestions(selectedQuestions);
    setQuestionIndex(0);
  }

  function nextQuestion() {
    if (questionIndex + 1 < quizQuestions.length) {
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
            // No eraId means the whole timeline challenge.
            state: eraId ? { completed: true, eraId } : { completed: true },
          })
        }
      />
    );
  }

  if (quizQuestions) {
    const question = quizQuestions[questionIndex];

    return (
      <QuizQuestion
        key={question.id ?? question.prompt}
        title={title}
        question={question}
        questionNumber={questionIndex + 1}
        totalQuestions={quizQuestions.length}
        onNext={nextQuestion}
        isLastQuestion={questionIndex === quizQuestions.length - 1}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-6 p-6 text-center sm:p-10">
      <h1 className="text-4xl font-bold sm:text-6xl">{title}</h1>

      <p className="max-w-4xl text-xl text-text-muted">{intro}</p>

      {available > 0 ? (
        <button
          type="button"
          className={buttonClass("primary", "text-2xl")}
          onClick={start}
        >
          {startLabel}: {available} question{available === 1 ? "" : "s"}
        </button>
      ) : (
        <p className="rounded-xl border-2 border-highlight p-4">
          No quiz questions are available yet.
        </p>
      )}

      {children}
    </div>
  );
}

/** The timeline challenge: one question from every era. */
export function QuizHome() {
  const { content, eras, eventById } = useContent();

  if (!content || !eras || !eventById) {
    return (
      <div className="p-6 sm:p-10" role="status">
        Loading quiz questions…
      </div>
    );
  }

  return (
    <QuizRun
      title="Timeline challenge"
      intro="One question from every era, from the first rockets to Artemis. Answer them all to earn your certificate."
      startLabel="Start the challenge"
      pickQuestions={() =>
        questionsForTimeline(content.questions ?? [], eras, eventById)
      }
    >
      <nav aria-label="Era quizzes" className="mt-6">
        <p className="text-lg text-text-muted">Or take the quiz for one era:</p>
        <ul className="mt-3 flex flex-wrap justify-center gap-3">
          {eras.map((era) => (
            <li key={era.id}>
              <Link
                to={`/quiz/era/${era.id}`}
                className={buttonClass("secondary")}
              >
                {era.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </QuizRun>
  );
}

/** An era quiz: only questions about that era's events. */
export function EraQuiz() {
  const { eraId } = useParams();
  const { content, eraById, eventById } = useContent();

  if (!content || !eraById || !eventById) {
    return (
      <div className="p-6 sm:p-10" role="status">
        Loading quiz questions…
      </div>
    );
  }

  const era = eraById(eraId);
  if (!era) return <Navigate to="/quiz" replace />;

  return (
    <QuizRun
      // Another era's quiz starts fresh.
      key={era.id}
      title={`${era.title} quiz`}
      intro="Questions about the events in this era. Answer them all to earn your certificate."
      startLabel="Start the quiz"
      eraId={era.id}
      pickQuestions={() =>
        shuffled(
          questionsForEra(content.questions ?? [], era.id, eventById)
        ).slice(0, ERA_QUIZ_LENGTH)
      }
    >
      <Link to="/quiz" className={buttonClass("secondary", "mt-6")}>
        Take the whole timeline challenge instead
      </Link>
    </QuizRun>
  );
}
