import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useKiosk } from "../../store/useKiosk.js";
import { useContent } from "../../hooks/useContent.jsx";
import { useAdminSave, useUnsavedChanges } from "../../hooks/useAdmin.js";
import { EVENT_MEDIA_MAX, EVENT_STATUSES, SHORT_TITLE_MAX, eventProblems, needsReview } from "../../lib/content.js";
import { buttonClass } from "../../lib/ui.js";
import Field, { inputClass } from "../../components/admin/Field.jsx";
import MoveButtons, { moveItem } from "../../components/admin/MoveButtons.jsx";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import MediaPicker from "../../components/admin/MediaPicker.jsx";
import { MediaThumb, mediaLabel } from "../../components/admin/MediaGrid.jsx";
import QuestionsEditor from "../../components/admin/QuestionsEditor.jsx";
import { EventTags } from "./Events.jsx";

const STATUS_LABELS = { historical: "Historical", planned: "Planned", ongoing: "Ongoing" };

const blank = {
  title: "",
  shortTitle: "",
  sort: "",
  display: "",
  status: "historical",
  eraIds: [],
  summary: "",
  body: "",
  mediaIds: [],
  published: true,
};

const toForm = (ev) => ({
  title: ev.title,
  shortTitle: ev.shortTitle,
  sort: ev.date.sort,
  display: ev.date.display,
  status: ev.date.status ?? "historical",
  eraIds: ev.eraIds,
  summary: ev.summary,
  body: ev.body,
  mediaIds: ev.mediaIds,
  published: ev.published !== false,
});

// "evt-1969-apollo-11", unique among events.
function newEventId(sort, title, events) {
  const year = sort.slice(0, 4).replace(/\D/g, "") || "event";
  const words = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "event";
  const base = `evt-${year}-${words}`;
  let id = base;
  for (let n = 2; events.some((e) => e.id === id); n++) id = `${base}-${n}`;
  return id;
}

const today = () => new Date().toISOString().slice(0, 10);

// Problem keys from eventProblems -> the field that shows them (and gets the focus).
const FIELD_FOR = {
  title: "ev-title",
  shortTitle: "ev-shortTitle",
  dateSort: "ev-sort",
  dateDisplay: "ev-display",
  date: "ev-sort",
  status: "ev-status-historical",
  eraIds: "ev-eras",
  summary: "ev-summary",
  body: "ev-body",
  mediaIds: "ev-photos-add",
};

// The editor is keyed by the event id, so saving a new event (which gives it an id
// and changes the address) starts a fresh form for it.
export default function EventEditRoute() {
  const { eventId } = useParams();
  return <EventEdit key={eventId} eventId={eventId} />;
}

function EventEdit({ eventId }) {
  const isNew = eventId === "new";
  const update = useKiosk((s) => s.update);
  const { content, eras } = useContent();
  const { save, status, setStatus, saving } = useAdminSave();
  const navigate = useNavigate();

  const existing = isNew ? null : content.events.find((ev) => ev.id === eventId);
  const [saved, setSaved] = useState(() => (existing ? toForm(existing) : blank));
  const [form, setForm] = useState(saved);
  const [problems, setProblems] = useState({});
  const [picking, setPicking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  if (!isNew && !existing) return <Navigate to="/admin/events" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const questions = existing ? content.questions.filter((q) => q.eventId === existing.id) : [];

  const toggleEra = (id) =>
    setForm({ ...form, eraIds: form.eraIds.includes(id) ? form.eraIds.filter((x) => x !== id) : [...form.eraIds, id] });

  const build = () => ({
    ...existing, // keeps fields this form doesn't show, like tags and source
    id: existing?.id ?? newEventId(form.sort, form.title, content.events),
    eraIds: form.eraIds,
    date: { ...existing?.date, sort: form.sort.trim(), display: form.display.trim(), status: form.status },
    shortTitle: form.shortTitle.trim(),
    title: form.title.trim(),
    summary: form.summary.trim(),
    body: form.body.trim(),
    mediaIds: form.mediaIds,
    published: form.published,
  });

  const submit = async (e) => {
    e.preventDefault();
    const ev = build();
    const found = eventProblems(ev, content);
    if (!ev.summary) found.summary = "Write a one- or two-sentence summary.";
    setProblems(found);
    if (Object.keys(found).length) {
      setStatus("Fix the highlighted fields, then save again.");
      // Focus the first problem in the order the fields appear.
      document.getElementById(FIELD_FOR[Object.keys(FIELD_FOR).find((key) => found[key])])?.focus();
      return;
    }
    const events = existing ? content.events.map((x) => (x.id === ev.id ? ev : x)) : [...content.events, ev];
    if (!(await save({ ...content, events }, `Saved ${ev.shortTitle}.`))) return;
    setSaved(form);
    if (isNew) navigate(`/admin/events/${encodeURIComponent(ev.id)}`, { replace: true });
  };

  const markReviewed = async () => {
    const events = content.events.map((x) => (x.id === existing.id ? { ...x, reviewedAt: today() } : x));
    await save({ ...content, events }, "Marked as reviewed today.");
  };

  const remove = async () => {
    setDeleting(false);
    const next = {
      ...content,
      events: content.events.filter((x) => x.id !== existing.id),
      questions: content.questions.filter((q) => q.eventId !== existing.id),
    };
    if (await save(next, `Deleted ${existing.shortTitle}.`)) {
      update({ adminDirty: 0 });
      navigate("/admin/events", { replace: true });
    }
  };

  // Shows the saved event on its era screen; a bar there leads back here.
  const preview = () => {
    update({ previewReturn: `/admin/events/${encodeURIComponent(existing.id)}` });
    navigate(`/era/${existing.eraIds[0]}/event/${encodeURIComponent(existing.id)}`);
  };

  const fieldsetError = (key, id) =>
    problems[key] && (
      <p id={id} role="alert" className="mt-2 text-danger">{problems[key]}</p>
    );

  return (
    <div className="mx-auto max-w-4xl p-10">
      <Link to="/admin/events" className="text-highlight underline">Back to events</Link>
      <h1 className="mt-4 text-5xl">{isNew ? "New event" : saved.shortTitle}</h1>
      {existing && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <EventTags ev={existing} />
          {needsReview(existing) && (
            <>
              <span className="text-text-muted">
                {existing.reviewedAt ? `Last reviewed ${existing.reviewedAt}.` : "Never reviewed."} Check it's still accurate.
              </span>
              <button onClick={markReviewed} disabled={saving} className={buttonClass("secondary")}>Mark reviewed</button>
            </>
          )}
        </div>
      )}

      <form onSubmit={submit} noValidate className="panel mt-8 rounded-xl p-6">
        <Field id="ev-title" label="Title" error={problems.title}>
          {(props) => <input {...props} value={form.title} onChange={set("title")} className={inputClass} />}
        </Field>

        <Field
          id="ev-shortTitle"
          label="Short title"
          hint={`For the timeline point. ${form.shortTitle.length} of ${SHORT_TITLE_MAX} characters.`}
          error={problems.shortTitle}
        >
          {(props) => <input {...props} value={form.shortTitle} onChange={set("shortTitle")} className={inputClass} />}
        </Field>

        <div className="flex flex-wrap gap-6">
          <div className="w-80">
            <Field id="ev-sort" label="Sort date" hint="YYYY-MM-DD. Puts the event in order." error={problems.dateSort}>
              {(props) => <input {...props} value={form.sort} onChange={set("sort")} placeholder="1969-07-20" className={inputClass} />}
            </Field>
          </div>
          <div className="w-80">
            <Field id="ev-display" label="Date to show" hint="Like “1969” or “2030 and beyond”." error={problems.dateDisplay}>
              {(props) => <input {...props} value={form.display} onChange={set("display")} className={inputClass} />}
            </Field>
          </div>
        </div>

        <fieldset className="mt-6" aria-describedby={problems.status ? "ev-status-error" : undefined}>
          <legend className="font-bold">Status</legend>
          <div className="mt-2 flex flex-wrap gap-6">
            {EVENT_STATUSES.map((s) => (
              <label key={s} className="flex min-h-14 items-center gap-3">
                <input
                  id={`ev-status-${s}`}
                  type="radio"
                  name="status"
                  value={s}
                  checked={form.status === s}
                  onChange={set("status")}
                  className="size-7"
                />
                {STATUS_LABELS[s]}
              </label>
            ))}
          </div>
          {fieldsetError("status", "ev-status-error")}
        </fieldset>

        <fieldset
          id="ev-eras"
          tabIndex={-1}
          className="mt-6"
          aria-describedby={problems.eraIds ? "ev-eras-error" : undefined}
        >
          <legend className="font-bold">Eras (at least one)</legend>
          <div className="mt-2 flex flex-wrap gap-x-8">
            {eras.map((era) => (
              <label key={era.id} className="flex min-h-14 items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.eraIds.includes(era.id)}
                  onChange={() => toggleEra(era.id)}
                  className="size-7"
                />
                {era.title}
              </label>
            ))}
          </div>
          {fieldsetError("eraIds", "ev-eras-error")}
        </fieldset>

        <Field id="ev-summary" label="Summary" hint="One or two sentences for the event card." error={problems.summary}>
          {(props) => <textarea {...props} rows={3} value={form.summary} onChange={set("summary")} className={inputClass} />}
        </Field>
        <Field id="ev-body" label="Body" hint="The full text. Leave a blank line between paragraphs." error={problems.body}>
          {(props) => <textarea {...props} rows={10} value={form.body} onChange={set("body")} className={inputClass} />}
        </Field>

        <div className="mt-6">
          <p className="font-bold">Photos and videos</p>
          <p className="mt-1 text-text-muted">
            The first one is the event's main picture. Up to {EVENT_MEDIA_MAX}.
          </p>
          <ol className="mt-3 flex flex-col gap-3">
            {form.mediaIds.map((id, i) => {
              const item = content.media.find((m) => m.id === id);
              const label = item ? mediaLabel(item) : id;
              return (
                <li key={id} className="flex flex-wrap items-center gap-4 rounded-xl border border-text-muted/25 p-3">
                  {item && <MediaThumb item={item} className="w-40" />}
                  <span className="min-w-0 flex-1">{label}</span>
                  <MoveButtons
                    index={i}
                    count={form.mediaIds.length}
                    label={label}
                    onMove={(from, to) => setForm({ ...form, mediaIds: moveItem(form.mediaIds, from, to) })}
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, mediaIds: form.mediaIds.filter((x) => x !== id) })}
                    className={buttonClass("secondary")}
                  >
                    Remove<span className="sr-only"> {label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <button
            id="ev-photos-add"
            type="button"
            onClick={() => setPicking(true)}
            disabled={form.mediaIds.length >= EVENT_MEDIA_MAX}
            aria-describedby={problems.mediaIds ? "ev-photos-error" : undefined}
            className={buttonClass("secondary", "mt-3")}
          >
            Add a photo or video
          </button>
          {fieldsetError("mediaIds", "ev-photos-error")}
        </div>

        <label className="mt-8 flex min-h-14 items-center gap-3">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="size-7"
          />
          <span>
            <span className="font-bold">Published</span>
            <span className="block text-text-muted">Turn off to hide the event from visitors without deleting it.</span>
          </span>
        </label>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={saving} className={buttonClass("primary")}>Save event</button>
          {existing && (
            <button type="button" onClick={preview} className={buttonClass("secondary")}>
              Preview{dirty ? " last saved version" : ""}
            </button>
          )}
          {existing && (
            <button type="button" onClick={() => setDeleting(true)} disabled={saving} className={buttonClass("secondary")}>
              Delete event
            </button>
          )}
          <p aria-live="polite" className="text-text-muted">{status}</p>
        </div>
      </form>

      {existing ? (
        <QuestionsEditor event={existing} />
      ) : (
        <p className="mt-6 text-text-muted">Save the event first, then add its quiz questions here.</p>
      )}

      {picking && (
        <MediaPicker
          title="Choose a photo or video"
          only={null}
          onPick={(item) => {
            if (!form.mediaIds.includes(item.id)) setForm({ ...form, mediaIds: [...form.mediaIds, item.id] });
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete ${existing.shortTitle}?`}
          message={
            questions.length
              ? `Its ${questions.length} quiz question${questions.length === 1 ? "" : "s"} will be deleted too. To hide it for now instead, turn off Published.`
              : "To hide it for now instead, turn off Published."
          }
          confirmLabel="Delete event"
          onConfirm={remove}
          onCancel={() => setDeleting(false)}
        />
      )}
    </div>
  );
}
