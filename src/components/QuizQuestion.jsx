import { useEffect, useRef, useState } from "react";
import { buttonClass } from "../lib/ui.js";
import { useCompact, useKiosk } from "../store/useKiosk.js";
import { stop } from "../lib/speech.js";
import ReadAloudButton from "./ReadAloudButton.jsx";

// Laid out to fit the screen above the bottom bar with no scrolling: the
// question on top, the four answers in a 2 x 2 grid, and the result in a strip
// along the bottom that is always there, so nothing moves when it fills in.
export default function QuizQuestion({
  title,
  question,
  questionNumber,
  totalQuestions,
  onNext,
  isLastQuestion = false,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const resultRef = useRef(null);

  const readAloud = useKiosk((s) => s.readAloud);
  // Larger text / Move content lower: smaller type and a shorter result strip.
  const { compact, tight } = useCompact();
  const choicesText = question.choices.map((choice, index) => `Option ${index + 1}: ${choice}`).join(". ");

  const answered = selectedIndex !== null;
  const isCorrect = selectedIndex === question.correctIndex;

  useEffect(() => {
    if (answered) {
      resultRef.current?.focus();
    }
  }, [answered, selectedIndex]);

  function answerQuestion(index) {
    // Once a choice is selected, it cannot be selected again.
    if (selectedIndex === index || isCorrect) return;
    setSelectedIndex(index);
  }

  function continueQuiz() {
    stop();
    setSelectedIndex(null);
    onNext();
  }

  return (
    <section className={`mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-6 sm:px-10 ${compact ? "gap-[1vh] py-[1vh]" : "gap-[2.5vh] py-[2.5vh]"}`}>
      {/* With both Larger text and Move content lower, the progress bar alone shows
          how far along the visitor is (screen readers hear it from the bar). */}
      <div className={`flex items-center justify-between gap-4 ${tight && !readAloud ? "hidden" : ""}`}>
        <p className={`text-lg font-semibold text-text-muted ${tight ? "sr-only" : ""}`}>
          {title && <>{title} · </>}Question {questionNumber} of {totalQuestions}
        </p>

        {readAloud && (
          <ReadAloudButton
            text={`${question.prompt}. The choices are: ${choicesText}`}
            label="Read the question and answer choices aloud"
            stopLabel="Stop reading the question and answer choices"
          />
        )}
      </div>

      <div
        className="h-3 shrink-0 overflow-hidden rounded-full bg-surface/80"
        role="progressbar"
        aria-label={`Question ${questionNumber} of ${totalQuestions}`}
        aria-valuemin={0}
        aria-valuemax={totalQuestions}
        aria-valuenow={questionNumber}
      >
        <div
          className="h-full rounded-full bg-highlight"
          style={{
            width: `${(questionNumber / totalQuestions) * 100}%`,
          }}
        />
      </div>

      {/* Long questions step down a size so they stay on two lines. */}
      <h1 className={`font-bold ${compact ? "text-2xl" : `text-3xl ${question.prompt.length > 60 ? "" : "sm:text-4xl"}`}`}>
        {question.prompt}
      </h1>

      <div className={`grid flex-1 auto-rows-fr md:grid-cols-2 ${compact ? "gap-[1vh]" : "gap-[2vh]"}`}>
        {question.choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          const isWrong = isSelected && !isCorrect;
          const isRight = isSelected && isCorrect;

          return (
            <button
              key={`${question.id ?? question.prompt}-${index}`}
              type="button"
              className={buttonClass(
                "secondary",
                `h-full w-full justify-between text-left whitespace-normal ${tight ? "min-h-12" : "min-h-14"} ${compact ? "text-lg" : "text-xl"} ${isSelected ? "ring-2 ring-highlight" : ""
                }`
              )}
              onClick={() => answerQuestion(index)}
              disabled={isSelected || isCorrect}
              aria-pressed={isSelected}
            >
              <span>{choice}</span>
              {isRight && <span aria-hidden="true">✓</span>}
              {isWrong && <span aria-hidden="true">✕</span>}
            </button>
          );
        })}
      </div>

      <div
        ref={resultRef}
        tabIndex={-1}
        aria-live="polite"
        aria-atomic="true"
        className={`flex shrink-0 items-center gap-6 rounded-xl ${tight ? "min-h-[12vh]" : compact ? "min-h-[16vh]" : "min-h-[20vh]"} border-2 border-text-muted/50 px-6 py-4 focus:outline-none focus:ring-2 focus:ring-highlight`}
      >
        {!answered ? (
          <p className={`w-full text-center text-text-muted ${compact ? "text-lg" : "text-xl"}`}>
            Choose an answer.
          </p>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              {isCorrect ? (
                <h2 className="text-2xl font-bold text-success">
                  <span aria-hidden="true">✓ </span>
                  Correct
                </h2>
              ) : (
                <h2 className="text-2xl font-bold text-danger">
                  <span aria-hidden="true">✕ </span>
                  Not quite
                </h2>
              )}

              <p className={`mt-2 ${compact ? "text-base" : "text-lg"}`}>
                {question.explanation}
                {!isCorrect && " Choose another answer to try again."}
              </p>
            </div>

            {isCorrect && (
              <button
                type="button"
                className={buttonClass("primary", "shrink-0 text-xl")}
                onClick={continueQuiz}
              >
                {isLastQuestion ? "Ready to launch!" : "Next question"}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
