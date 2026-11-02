import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useKiosk } from "../../store/useKiosk.js";
import { useContent } from "../../hooks/useContent.jsx";
import { useAdminSave, useUnsavedChanges } from "../../hooks/useAdmin.js";
import { mediaProblems } from "../../lib/content.js";
import {
  BIG_VIDEO_BYTES,
  IMAGE_TYPES,
  VIDEO_TYPES,
  cleanFileName,
  formatBytes,
  mediaUsage,
  newMediaId,
  preparePhoto,
  saveMediaFile,
  takenFileNames,
} from "../../lib/media.js";
import { buttonClass } from "../../lib/ui.js";
import Field, { inputClass } from "../../components/admin/Field.jsx";
import { MediaThumb, mediaLabel } from "../../components/admin/MediaGrid.jsx";
import { usageText } from "./Media.jsx";

const ALT_HINT = "Describe what the image shows, as you would to someone who can't see it.";

const typeOf = (file) => (VIDEO_TYPES.includes(file?.type) ? "video" : IMAGE_TYPES.includes(file?.type) ? "image" : null);

// Add a new photo or video (/admin/media/new), or edit one's text (/admin/media/:id).
export default function MediaEdit() {
  const { mediaId } = useParams();
  const isNew = mediaId === "new";
  const token = useKiosk((s) => s.adminToken);
  const addBusy = useKiosk((s) => s.addBusy);
  const removeBusy = useKiosk((s) => s.removeBusy);
  const { content, store } = useContent();
  const { save, status, setStatus } = useAdminSave();
  const navigate = useNavigate();

  const existing = isNew ? null : content.media.find((m) => m.id === mediaId);
  const initial = {
    alt: existing?.alt ?? "",
    caption: existing?.caption ?? "",
    credit: existing?.credit ?? "",
    background: existing?.background ?? false,
  };
  const [text, setText] = useState(initial);
  const [files, setFiles] = useState({ main: null, captions: null, poster: null });
  const [problems, setProblems] = useState({});
  const [working, setWorking] = useState(false);
  const [preview, setPreview] = useState(null);

  const dirty = !working && (JSON.stringify(text) !== JSON.stringify(initial) || Object.values(files).some(Boolean));
  useUnsavedChanges(dirty);

  // Preview of a newly picked photo.
  useEffect(() => {
    if (typeOf(files.main) !== "image") return setPreview(null);
    const url = URL.createObjectURL(files.main);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [files.main]);

  if (!isNew && !existing) return <Navigate to="/admin/media" replace />;

  const type = isNew ? typeOf(files.main) : existing.type ?? "image";
  const set = (key) => (e) => setText({ ...text, [key]: e.target.value });
  const pick = (key) => (e) => {
    setFiles({ ...files, [key]: e.target.files?.[0] ?? null });
    setProblems({ ...problems, [key]: undefined });
  };

  const check = () => {
    const found = {};
    if (isNew && !files.main) found.main = "Choose a photo (JPEG, PNG or WebP) or an MP4 video.";
    else if (isNew && !type) found.main = "That file type isn't supported. Use JPEG, PNG, WebP or MP4.";
    if (type === "image" && !text.alt.trim()) found.alt = ALT_HINT;
    if (type === "video") {
      if (files.captions && !/\.vtt$/i.test(files.captions.name)) found.captions = "Captions must be a .vtt file.";
      else if (!files.captions && !existing?.captionsFile && !text.background) {
        found.captions = "Add the captions file (.vtt), or mark it as a background video.";
      }
      if (files.poster && !typeOf(files.poster)) found.poster = "The poster must be a JPEG, PNG or WebP photo.";
      else if (!files.poster && !existing?.poster) found.poster = "Add a poster image.";
    }
    return found;
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = check();
    setProblems(found);
    if (Object.keys(found).length) {
      setStatus("Fix the highlighted fields, then save again.");
      document.getElementById(`media-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    setWorking(true);
    addBusy(); // keeps the admin sign-out timer from running out during a long upload
    const taken = takenFileNames(content);
    const upload = async (blob, name, label) => {
      taken.add(name);
      await saveMediaFile(store, blob, name, token, (p) => setStatus(`Saving ${label}… ${Math.round(p * 100)}%`));
      return name;
    };

    try {
      const item = existing ? { ...existing } : { id: newMediaId(files.main.name, type, content), type };
      if (files.main) {
        if (type === "image") {
          setStatus("Preparing the photo…");
          const { blob, ext } = await preparePhoto(files.main);
          item.file = await upload(blob, cleanFileName(files.main.name, taken, ext ?? undefined), "the photo");
        } else {
          item.file = await upload(files.main, cleanFileName(files.main.name, taken, "mp4"), "the video");
        }
      }
      if (files.poster) {
        const { blob, ext } = await preparePhoto(files.poster);
        const posterExt = ext ?? files.poster.name.split(".").pop().toLowerCase();
        const posterName = `${item.file.replace(/\.[^.]+$/, "")}-poster.${posterExt}`;
        item.poster = await upload(blob, cleanFileName(posterName, taken), "the poster");
      }
      if (files.captions) {
        item.captionsFile = await upload(files.captions, cleanFileName(item.file, taken, "vtt"), "the captions");
      }
      Object.assign(item, { alt: text.alt.trim(), caption: text.caption.trim(), credit: text.credit.trim() });
      if (type === "video" && text.background) item.background = true;
      else delete item.background;

      const problem = Object.values(mediaProblems(item))[0];
      if (problem) throw new Error(problem);

      const media = existing ? content.media.map((m) => (m.id === item.id ? item : m)) : [...content.media, item];
      if (!(await save({ ...content, media }, `Saved ${mediaLabel(item)}.`))) return;

      // A replaced poster or captions file is no longer needed.
      const stillUsed = new Set(media.flatMap((m) => [m.file, m.poster, m.captionsFile]));
      for (const old of [existing?.poster, existing?.captionsFile]) {
        if (old && !stillUsed.has(old)) await store.deleteMedia(old, token).catch(() => {});
      }
      navigate("/admin/media");
    } catch (err) {
      setStatus(`Not saved: ${err.message}`);
    } finally {
      removeBusy();
      setWorking(false);
    }
  };

  const fileField = (key, label, accept, hint) => (
    <Field id={`media-${key}`} label={label} hint={hint} error={problems[key]}>
      {(props) => (
        <input {...props} type="file" accept={accept} onChange={pick(key)} disabled={working} className={`${inputClass} py-3`} />
      )}
    </Field>
  );

  const usage = existing && mediaUsage(content, existing.id);

  return (
    <div className="mx-auto max-w-4xl p-10">
      <Link to="/admin/media" className="text-highlight underline">Back to media</Link>
      <h1 className="mt-4 text-5xl">{isNew ? "Add media" : "Edit media"}</h1>

      <form onSubmit={submit} noValidate className="panel mt-8 rounded-xl p-6">
        {existing ? (
          <div className="flex flex-wrap items-start gap-6">
            <MediaThumb item={existing} className="w-80" />
            <div>
              <p className="font-bold">{existing.file}</p>
              <p className="mt-1 text-text-muted">{usageText(usage)}</p>
              {usage.events.length > 0 && (
                <ul className="mt-2 list-disc pl-6 text-text-muted">
                  {usage.events.map((ev) => <li key={ev.id}>{ev.title}</li>)}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <>
            {fileField(
              "main",
              "Photo or video",
              [...IMAGE_TYPES, ...VIDEO_TYPES].join(","),
              "JPEG, PNG or WebP photos, or MP4 video. Photos wider or taller than 2560 pixels are made smaller."
            )}
            {preview && <img src={preview} alt="" className="mt-4 max-h-80 rounded-lg" />}
            {files.main && (
              <p className="mt-2 text-text-muted">
                {files.main.name}, {formatBytes(files.main.size)}
              </p>
            )}
            {type === "video" && files.main.size > BIG_VIDEO_BYTES && (
              <p role="alert" className="mt-2 font-bold text-highlight">
                This video is over 300 MB. It may be slow to copy and to start on the kiosk. Consider a smaller version.
              </p>
            )}
          </>
        )}

        {type === "video" && (
          <>
            <label className="mt-6 flex min-h-14 items-center gap-3">
              <input
                type="checkbox"
                checked={text.background}
                onChange={(e) => setText({ ...text, background: e.target.checked })}
                aria-describedby="media-background-hint"
                className="size-7"
              />
              <span className="font-bold">Background video</span>
            </label>
            <p id="media-background-hint" className="text-text-muted">
              Plays silently behind the welcome screen, so it needs no captions. A background video can't be added to an
              event.
            </p>
            {fileField(
              "captions",
              existing ? "Replace captions file (.vtt)" : "Captions file (.vtt)",
              ".vtt,text/vtt",
              existing?.captionsFile
                ? `Now: ${existing.captionsFile}`
                : text.background
                  ? "Optional for a background video."
                  : "Required. Captions let visitors follow the video without sound."
            )}
            {fileField(
              "poster",
              existing ? "Replace poster image" : "Poster image",
              IMAGE_TYPES.join(","),
              existing ? `Now: ${existing.poster}` : "Required. Shown before the video plays."
            )}
          </>
        )}

        {type && (
          <>
            <Field
              id="media-alt"
              label={type === "image" ? "Alt text (required)" : "Description"}
              hint={type === "image" ? ALT_HINT : "What the video shows, in one or two sentences."}
              error={problems.alt}
            >
              {(props) => <textarea {...props} rows={3} value={text.alt} onChange={set("alt")} className={inputClass} />}
            </Field>
            <Field id="media-caption" label="Caption" hint="Shown under the photo or video.">
              {(props) => <textarea {...props} rows={2} value={text.caption} onChange={set("caption")} className={inputClass} />}
            </Field>
            <Field id="media-credit" label="Credit" hint="Who made it, like “NASA” or “NASA/Bill Ingalls”.">
              {(props) => <input {...props} value={text.credit} onChange={set("credit")} className={inputClass} />}
            </Field>
          </>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={working} className={buttonClass("primary")}>
            {isNew ? "Add to library" : "Save changes"}
          </button>
          <p aria-live="polite" className="text-text-muted">{status}</p>
        </div>
      </form>
    </div>
  );
}
