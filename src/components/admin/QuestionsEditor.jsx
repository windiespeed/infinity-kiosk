import { useState } from "react";
import { useContent } from "../../hooks/useContent.jsx";
import { useAdminSave, useUnsavedChanges } from "../../hooks/useAdmin.js";
import { useDialog } from "../../hooks/useDialog.js";
import { questionProblems } from "../../lib/content.js";
import { buttonClass } from "../../lib/ui.js";
import Field, { inputClass } from "./Field.jsx";
import MoveButtons from "./MoveButtons.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import QuizQuestion from "../QuizQuestion.jsx";

const blankQuestion = { id: "", prompt: "", choices: ["", ""], correctIndex: null, explanation: "" };

// "q-apollo-11-3": the event id without "evt-", plus a number no question has yet.
function newQuestionId(eventId, questions) {
  const base = `q-${eventId.replace(/^evt-/, "")}`;
  let n = 1;
  while (questions.some((q) => q.id === `${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// Problem keys from questionProblems -> the field that shows them (and gets the focus).
const FIELD_FOR = {
  prompt: "q-prompt",
  choices: "q-choice-0",
  correctIndex: "q-correct-0",
  explanation: "q-explanation",
};

// Quiz questions for one event, edited on the event's screen. Each question saves
// on its own, separately from the event form above it.
export default function QuestionsEditor({ event }) {
  const { content } = useContent();
  const { save, status, setStatus, saving } = useAdminSave();
  const [form, setForm] = useState(null); // the question being edited, or null
  const [saved, setSaved] = useState(null);
  const [problems, setProblems] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [previewing, setPreviewing] = useState(null);

  const questions = content.questions.filter((q) => q.eventId === event.id);
  const dirty = form !== null && JSON.stringify(form) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const open = (q) => {
    const values = { ...blankQuestion, ...q, choices: [...q.choices] };
    setForm(values);
    setSaved(values);
    setProblems({});
    setStatus("");
  };
  const close = () => {
    setForm(null);
    setSaved(null);
    setProblems({});
  };

  // Reorders this event's questions, keeping every other question where it was.
  const move = (from, to) => {
    if (to < 0 || to >= questions.length) return;
    const slots = content.questions.map((q, i) => (q.eventId === event.id ? i : -1)).filter((i) => i >= 0);
    const next = [...content.questions];
    next[slots[from]] = questions[to];
    next[slots[to]] = questions[from];
    save({ ...content, questions: next }, "Moved the question.");
  };

  const setChoice = (i, value) => setForm({ ...form, choices: form.choices.map((c, j) => (j === i ? value : c)) });
  const addChoice = () => setForm({ ...form, choices: [...form.choices, ""] });
  const removeChoice = (i) => {
    let correctIndex = form.correctIndex;
    if (correctIndex === i) correctIndex = null;
    else if (correctIndex > i) correctIndex -= 1;
    setForm({ ...form, choices: form.choices.filter((_, j) => j !== i), correctIndex });
  };

  const build = () => ({
    ...content.questions.find((q) => q.id === form.id), // keeps any fields this form doesn't show
    id: form.id || newQuestionId(event.id, content.questions),
    eventId: event.id,
    prompt: form.prompt.trim(),
    choices: form.choices.map((c) => c.trim()),
    correctIndex: form.correctIndex,
    explanation: form.explanation.trim(),
  });

  const submit = async (e) => {
    e.preventDefault();
    const q = build();
    const found = questionProblems(q, content);
    setProblems(found);
    if (Object.keys(found).length) {
      setStatus("Fix the highlighted fields, then save the question again.");
      document.getElementById(FIELD_FOR[Object.keys(FIELD_FOR).find((key) => found[key])])?.focus();
      return;
    }
    const list = form.id ? content.questions.map((x) => (x.id === q.id ? q : x)) : [...content.questions, q];
    if (await save({ ...content, questions: list }, "Question saved.")) close();
  };

  const remove = async () => {
    const q = deleting;
    setDeleting(null);
    if (await save({ ...content, questions: content.questions.filter((x) => x.id !== q.id) }, "Question deleted.")) {
      if (form?.id === q.id) close();
    }
  };

  // The dialogs sit outside the panel: its backdrop blur would trap their fixed position inside it.
  return (
    <>
      <section className="panel mt-10 rounded-xl p-6" aria-labelledby="questions-title">
        <h2 id="questions-title" className="text-3xl">
          Quiz questions
        </h2>
        <p className="mt-2 text-text-muted">
          Visitors answer these after reading the event, and the timeline challenge picks from them too. Each question
          must make sense on its own, without reading other events.
        </p>

        {questions.length === 0 && <p className="mt-4">No questions yet.</p>}
        <ol className="mt-4 flex flex-col gap-3">
          {questions.map((q, i) => (
            <li key={q.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-text-muted/25 p-3">
              <MoveButtons index={i} count={questions.length} label={`question ${i + 1}`} onMove={move} />
              <span className="min-w-0 flex-1">
                <span className="block">{q.prompt}</span>
                <span className="block text-text-muted">Answer: {q.choices[q.correctIndex]}</span>
              </span>
              <button type="button" onClick={() => setPreviewing(q)} className={buttonClass("secondary")}>
                Preview<span className="sr-only"> question {i + 1}</span>
              </button>
              <button type="button" onClick={() => open(q)} disabled={saving} className={buttonClass("secondary")}>
                Edit<span className="sr-only"> question {i + 1}</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleting(q)}
                disabled={saving}
                className={buttonClass("secondary")}
              >
                Delete<span className="sr-only"> question {i + 1}</span>
              </button>
            </li>
          ))}
        </ol>

        {!form && (
          <button type="button" onClick={() => open(blankQuestion)} className={buttonClass("primary", "mt-4")}>
            Add a question
          </button>
        )}
        <p aria-live="polite" className="mt-4 text-text-muted">
          {status}
        </p>

        {form && (
          <form onSubmit={submit} noValidate className="mt-6 rounded-xl border border-text-muted/25 p-6">
            <h3 className="text-2xl">{form.id ? "Edit question" : "New question"}</h3>

            <Field id="q-prompt" label="Question" error={problems.prompt}>
              {(props) => (
                <textarea
                  {...props}
                  autoFocus
                  rows={2}
                  value={form.prompt}
                  onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                  className={inputClass}
                />
              )}
            </Field>

            <fieldset
              className="mt-6"
              aria-describedby={problems.choices || problems.correctIndex ? "q-choices-error" : undefined}
            >
              <legend className="font-bold">Choices (2 to 4). Mark the one correct answer.</legend>
              <ol className="mt-2 flex flex-col gap-3">
                {form.choices.map((choice, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-4">
                    <label className="flex min-h-14 items-center gap-2">
                      <input
                        id={`q-correct-${i}`}
                        type="radio"
                        name="correct"
                        checked={form.correctIndex === i}
                        onChange={() => setForm({ ...form, correctIndex: i })}
                        className="size-7"
                      />
                      Correct
                    </label>
                    <label htmlFor={`q-choice-${i}`} className="sr-only">
                      Choice {i + 1}
                    </label>
                    <input
                      id={`q-choice-${i}`}
                      value={choice}
                      onChange={(e) => setChoice(i, e.target.value)}
                      placeholder={`Choice ${i + 1}`}
                      className={`${inputClass} mt-0 min-w-0 flex-1`}
                    />
                    {form.choices.length > 2 && (
                      <button type="button" onClick={() => removeChoice(i)} className={buttonClass("secondary")}>
                        Remove<span className="sr-only"> choice {i + 1}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ol>
              {form.choices.length < 4 && (
                <button type="button" onClick={addChoice} className={buttonClass("secondary", "mt-3")}>
                  Add a choice
                </button>
              )}
              {(problems.choices || problems.correctIndex) && (
                <p id="q-choices-error" role="alert" className="mt-2 text-danger">
                  {problems.choices || problems.correctIndex}
                </p>
              )}
            </fieldset>

            <Field
              id="q-explanation"
              label="Explanation"
              hint="Shown after the visitor answers. Say why the answer is right."
              error={problems.explanation}
            >
              {(props) => (
                <textarea
                  {...props}
                  rows={3}
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  className={inputClass}
                />
              )}
            </Field>

            <div className="mt-8 flex flex-wrap gap-4">
              <button type="submit" disabled={saving} className={buttonClass("primary")}>
                Save question
              </button>
              <button
                type="button"
                onClick={() => setPreviewing({ ...build(), correctIndex: form.correctIndex ?? -1 })}
                className={buttonClass("secondary")}
              >
                Preview
              </button>
              <button type="button" onClick={close} disabled={saving} className={buttonClass("secondary")}>
                {dirty ? "Discard changes" : "Close"}
              </button>
            </div>
          </form>
        )}
      </section>

      {previewing && <QuestionPreview question={previewing} onClose={() => setPreviewing(null)} />}

      {deleting && (
        <ConfirmDialog
          title="Delete this question?"
          message={deleting.prompt}
          confirmLabel="Delete question"
          onConfirm={remove}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}

// The question as visitors see it, in a dialog. Answering works, so staff can check
// the right/wrong messages and the explanation.
function QuestionPreview({ question, onClose }) {
  const ref = useDialog(onClose);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg/95 p-8">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Question preview"
        className="mx-auto max-w-5xl rounded-2xl border border-text-muted/25 panel p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="font-bold text-text-muted">Preview: how visitors see this question</p>
          <button data-autofocus onClick={onClose} className={buttonClass("primary")}>
            Close preview
          </button>
        </div>
        <div className="mt-6">
          <QuizQuestion question={question} questionNumber={1} totalQuestions={1} onNext={onClose} isLastQuestion />
        </div>
      </div>
    </div>
  );
}
