import { useState } from "react";
import { Link } from "react-router";
import { useKiosk } from "../../store/useKiosk.js";
import { useContent } from "../../hooks/useContent.jsx";
import { useAdminSave } from "../../hooks/useAdmin.js";
import { isUsed, mediaUsage } from "../../lib/media.js";
import { buttonClass } from "../../lib/ui.js";
import MediaGrid, { mediaLabel } from "../../components/admin/MediaGrid.jsx";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function usageText(usage) {
  const parts = [];
  if (usage.events.length) parts.push(plural(usage.events.length, "event"));
  if (usage.eras.length) parts.push(`cover of ${plural(usage.eras.length, "era")}`);
  if (usage.attract) parts.push("welcome video");
  return parts.length ? `Used by ${parts.join(", ")}` : "Not used yet";
}

// Media library: every photo and video on the kiosk, with where each is used.
export default function Media() {
  const token = useKiosk((s) => s.adminToken);
  const { content, store } = useContent();
  const { save, status, setStatus, saving } = useAdminSave();
  const [deleting, setDeleting] = useState(null);

  const remove = async () => {
    const item = deleting;
    setDeleting(null);
    // Save the content first, so it never points to a file that's gone.
    const media = content.media.filter((m) => m.id !== item.id);
    if (!(await save({ ...content, media }, `Deleted ${mediaLabel(item)}.`))) return;
    // Remove the files, unless another media item uses the same file.
    const stillUsed = new Set(media.flatMap((m) => [m.file, m.poster, m.captionsFile]));
    const files = [item.file, item.poster, item.captionsFile].filter((f) => f && !stillUsed.has(f));
    try {
      for (const file of files) await store.deleteMedia(file, token);
    } catch (err) {
      setStatus(`Deleted ${mediaLabel(item)}, but a file couldn't be removed: ${err.message}`);
    }
  };

  const deletingUsage = deleting && mediaUsage(content, deleting.id);

  return (
    <div className="p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl">Media</h1>
          <p className="mt-3 text-text-muted">Every photo and video on the kiosk.</p>
        </div>
        <Link to="/admin/media/new" className={buttonClass("primary")}>Add media</Link>
      </div>

      <p aria-live="polite" className="mt-4 text-text-muted">{status}</p>

      <div className="mt-6">
        <MediaGrid>
          {(item) => (
            <>
              <p className="w-full text-text-muted">{usageText(mediaUsage(content, item.id))}</p>
              <Link to={`/admin/media/${encodeURIComponent(item.id)}`} className={buttonClass("secondary", "flex-1")}>
                Edit<span className="sr-only"> {mediaLabel(item)}</span>
              </Link>
              <button onClick={() => setDeleting(item)} disabled={saving} className={buttonClass("secondary", "flex-1")}>
                Delete<span className="sr-only"> {mediaLabel(item)}</span>
              </button>
            </>
          )}
        </MediaGrid>
      </div>

      {deleting &&
        (isUsed(deletingUsage) ? (
          <ConfirmDialog
            title="This is still in use"
            message={[
              ...deletingUsage.events.map((ev) => `Event: ${ev.shortTitle}`),
              ...deletingUsage.eras.map((era) => `Era cover: ${era.title}`),
              ...(deletingUsage.attract ? ["Welcome screen video (Settings)"] : []),
            ].join(". ") + ". Remove it from these first."}
            cancelLabel="OK"
            onCancel={() => setDeleting(null)}
          />
        ) : (
          <ConfirmDialog
            title={`Delete ${mediaLabel(deleting)}?`}
            message="The file is removed from the kiosk. It can only come back from a backup."
            confirmLabel="Delete"
            onConfirm={remove}
            onCancel={() => setDeleting(null)}
          />
        ))}
    </div>
  );
}
