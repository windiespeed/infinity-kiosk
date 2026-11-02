// Shared pieces for admin forms.
//
// <Field id="title" label="Title" hint="Shown at the top of the event." error={problems.title}>
//   {(props) => <input {...props} className={inputClass} value={…} onChange={…} />}
// </Field>
//
// Field draws the visible label, the hint and the error, and hands the input the
// id and aria attributes that connect them, so every form gets this right for free.
export const inputClass =
  "mt-2 min-h-14 w-full rounded-xl border-2 border-text-muted bg-bg px-4 py-2 text-text aria-[invalid=true]:border-danger";

export default function Field({ id, label, hint, error, children }) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="mt-6">
      <label htmlFor={id} className="block font-bold">{label}</label>
      {hint && <p id={hintId} className="mt-1 text-text-muted">{hint}</p>}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error && <p id={errorId} role="alert" className="mt-2 text-danger">{error}</p>}
    </div>
  );
}
