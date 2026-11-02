import { useState } from "react";
import { useContent } from "../../hooks/useContent.jsx";
import { useAdminSave, useUnsavedChanges } from "../../hooks/useAdmin.js";
import { eraProblems } from "../../lib/content.js";
import { buttonClass } from "../../lib/ui.js";
import Field, { inputClass } from "../../components/admin/Field.jsx";
import MoveButtons, { moveItem } from "../../components/admin/MoveButtons.jsx";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import { MediaThumb } from "../../components/admin/MediaGrid.jsx";

const blankEra = { id: "", title: "", subtitle: "", overview: "", startYear: "", endYear: "" };

// Form values are strings; content stores years as numbers and "no end year" as null.
const toForm = (era) => ({
  ...blankEra,
  ...era,
  startYear: era.startYear == null ? "" : String(era.startYear),
  endYear: era.endYear == null ? "" : String(era.endYear),
});

const yearOrNull = (text) => (text.trim() === "" ? null : Number(text));

// A readable id from the title, made unique: "Space Shuttle" -> "space-shuttle".
function newEraId(title, eras) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "era";
  let id = base;
  for (let n = 2; eras.some((e) => e.id === id); n++) id = `${base}-${n}`;
  return id;
}

// Era editor: reorder, add, edit and delete the timeline's eras.
export default function Eras() {
  const { content, eras, eraCoverEvent, eraCover } = useContent();
  const { save, status, setStatus, saving } = useAdminSave();
  const [form, setForm] = useState(null); // the era being edited (strings), or null
  const [saved, setSaved] = useState(null); // the same era as last loaded, to spot changes
  const [problems, setProblems] = useState({});
  const [deleting, setDeleting] = useState(null);

  const dirty = form !== null && JSON.stringify(form) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const cover = form?.id && eraCover(form.id);
  const coverEvent = form?.id && eraCoverEvent(form.id);
  const eventsIn = (eraId) => content.events.filter((ev) => ev.eraIds.includes(eraId));

  const open = (era) => {
    const values = toForm(era);
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

  // Reordering saves right away: `order` is rewritten 1, 2, 3… in the new order.
  const move = (from, to) => {
    const reordered = moveItem(eras, from, to).map((era, i) => ({ ...era, order: i + 1 }));
    save({ ...content, eras: reordered }, `Moved ${eras[from].title}.`);
  };

  const submit = async (e) => {
    e.preventDefault();
    const isNew = !form.id;
    const era = {
      ...(isNew ? {} : content.eras.find((x) => x.id === form.id)),
      id: isNew ? newEraId(form.title, content.eras) : form.id,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      overview: form.overview.trim(),
      startYear: yearOrNull(form.startYear),
      endYear: yearOrNull(form.endYear),
      order: isNew ? Math.max(0, ...content.eras.map((x) => x.order)) + 1 : content.eras.find((x) => x.id === form.id).order,
    };
    delete era.coverMediaId; // older content picked covers by hand; now they come from the events

    const found = eraProblems(era);
    setProblems(found);
    if (Object.keys(found).length) {
      setStatus("Fix the highlighted fields, then save again.");
      document.getElementById(`era-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    const list = isNew ? [...content.eras, era] : content.eras.map((x) => (x.id === era.id ? era : x));
    if (await save({ ...content, eras: list }, `Saved ${era.title}.`)) close();
  };

  const remove = async () => {
    const era = deleting;
    setDeleting(null);
    if (await save({ ...content, eras: content.eras.filter((x) => x.id !== era.id) }, `Deleted ${era.title}.`)) {
      if (form?.id === era.id) close();
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="mx-auto max-w-5xl p-10">
      <h1 className="text-5xl">Eras</h1>
      <p className="mt-3 text-text-muted">
        The timeline's sections, in the order visitors see them. Every event belongs to at least one era.
      </p>

      <ol className="mt-8 flex flex-col gap-4">
        {eras.map((era, i) => {
          const count = eventsIn(era.id).length;
          return (
            <li key={era.id} className="panel flex flex-wrap items-center gap-4 rounded-xl p-4">
              <MoveButtons index={i} count={eras.length} label={era.title} onMove={move} />
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold">{era.title}</p>
                <p className="text-text-muted">
                  {era.startYear}–{era.endYear ?? "Today"} · {count} event{count === 1 ? "" : "s"}
                </p>
              </div>
              <button onClick={() => open(era)} disabled={saving} className={buttonClass("secondary")}>
                Edit<span className="sr-only"> {era.title}</span>
              </button>
              <button onClick={() => setDeleting(era)} disabled={saving} className={buttonClass("secondary")}>
                Delete<span className="sr-only"> {era.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {!form && (
        <button onClick={() => open(blankEra)} className={buttonClass("primary", "mt-6")}>Add an era</button>
      )}

      <p aria-live="polite" className="mt-4 text-text-muted">{status}</p>

      {form && (
        <form onSubmit={submit} noValidate className="panel mt-8 rounded-xl p-6">
          <h2 className="text-3xl">{form.id ? `Edit ${saved.title}` : "New era"}</h2>

          <Field id="era-title" label="Title" error={problems.title}>
            {(props) => (
              // Focus (and so scroll to) the form when it opens below the list.
              <input {...props} autoFocus value={form.title} onChange={set("title")} className={inputClass} />
            )}
          </Field>
          <Field id="era-subtitle" label="Subtitle" hint="One line under the title.">
            {(props) => <input {...props} value={form.subtitle} onChange={set("subtitle")} className={inputClass} />}
          </Field>
          <Field id="era-overview" label="Overview" hint="A short introduction shown on the era screen.">
            {(props) => (
              <textarea {...props} rows={4} value={form.overview} onChange={set("overview")} className={inputClass} />
            )}
          </Field>

          <div className="flex flex-wrap gap-6">
            <div className="w-56">
              <Field id="era-startYear" label="Start year" error={problems.startYear}>
                {(props) => (
                  <input {...props} inputMode="numeric" value={form.startYear} onChange={set("startYear")} className={inputClass} />
                )}
              </Field>
            </div>
            <div className="w-56">
              <Field id="era-endYear" label="End year" hint="Blank means Today." error={problems.endYear}>
                {(props) => (
                  <input {...props} inputMode="numeric" value={form.endYear} onChange={set("endYear")} className={inputClass} />
                )}
              </Field>
            </div>
          </div>

          <div className="mt-6">
            <p className="font-bold">Card photo</p>
            <p className="mt-1 text-text-muted">
              The era's card shows the first photo of its earliest event that has a photo. To change it, change that
              event's photos.
            </p>
            {cover ? (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <MediaThumb item={cover} className="w-64" />
                <p className="max-w-xs">
                  From {coverEvent.date.display}: {coverEvent.title}
                </p>
              </div>
            ) : (
              <p className="mt-3">{form.id ? "None of this era's events has a photo yet." : "Add events with photos to this era."}</p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <button type="submit" disabled={saving} className={buttonClass("primary")}>Save era</button>
            <button type="button" onClick={close} disabled={saving} className={buttonClass("secondary")}>
              {dirty ? "Discard changes" : "Close"}
            </button>
          </div>
        </form>
      )}

      {deleting &&
        (eventsIn(deleting.id).length ? (
          <ConfirmDialog
            title={`${deleting.title} still has events`}
            message={`Move these events to another era first: ${eventsIn(deleting.id)
              .map((ev) => ev.shortTitle)
              .join(", ")}.`}
            cancelLabel="OK"
            onCancel={() => setDeleting(null)}
          />
        ) : (
          <ConfirmDialog
            title={`Delete ${deleting.title}?`}
            message="The era is removed from the timeline. It can be brought back from a backup."
            confirmLabel="Delete era"
            onConfirm={remove}
            onCancel={() => setDeleting(null)}
          />
        ))}
    </div>
  );
}
