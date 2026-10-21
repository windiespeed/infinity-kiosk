import { useEffect, useRef, useState } from "react";
import { buttonClass } from "../lib/ui.js";

export default function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  onNext,
  isLastQuestion = false,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const resultRef = useRef(null);

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
    setSelectedIndex(null);
    onNext();
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 sm:p-10">
      <p className="text-lg font-semibold text-text-muted">
        Question {questionNumber} of {totalQuestions}
      </p>

      <div
        className="h-3 overflow-hidden rounded-full bg-surface/80"
        role="progressbar"
        aria-label="Quiz progress"
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

      <h1 className="text-3xl font-bold sm:text-5xl">
        {question.prompt}
      </h1>

      <div className="mt-2 flex flex-col gap-4">
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
                `w-full min-h-16 justify-between text-left text-xl whitespace-normal ${
                  isSelected ? "ring-2 ring-highlight" : ""
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

      {answered && (
        <div
          ref={resultRef}
          tabIndex={-1}
          aria-live="polite"
          aria-atomic="true"
          className="rounded-xl border-2 border-text-muted/50 p-5 focus:outline-none focus:ring-2 focus:ring-highlight"
        >
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

          <p className="mt-3 text-lg">{question.explanation}</p>

          {isCorrect ? (
            <button
              type="button"
              className={buttonClass("primary", "mt-5 w-full text-xl")}
              onClick={continueQuiz}
            >
              Next question
            </button>
          ) : (
            <p className="mt-4 text-base">
              Choose another answer to try again.
            </p>
          )}
        </div>
      )}
    </section>
  );
}