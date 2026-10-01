import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useKiosk } from "../../store/useKiosk.js";
import { useContent } from "../../hooks/useContent.jsx";
import { exportBackup, importBackup } from "../../lib/backup.js";
import { buttonClass } from "../../lib/ui.js";

// Starter dashboard: settings (shows the full save path working) and backups.
// TODO (admin issues): event editor, question editor, era editor, media upload,
// "planned events need review" flag, change PIN.
export default function Dashboard() {
  const token = useKiosk((s) => s.adminToken);
  const update = useKiosk((s) => s.update);
  const { content, reload, store } = useContent();
  const navigate = useNavigate();
  const [idleSeconds, setIdleSeconds] = useState(content.settings.idleSeconds);
  const [status, setStatus] = useState("");
  const [backupStatus, setBackupStatus] = useState("");
  const [pendingImport, setPendingImport] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);

  if (!token) return <Navigate to="/admin" replace />;

  const save = async () => {
    setStatus("Saving…");
    try {
      await store.saveContent({ ...content, settings: { ...content.settings, idleSeconds: Number(idleSeconds) } }, token);
      await reload();
      setStatus("Saved.");
    } catch (err) {
      setStatus(err.message || "Save failed.");
    }
  };

  const doExport = async () => {
    setBusy(true);
    setBackupStatus("Creating backup… this can take a minute with videos.");
    try {
      const { where, skipped } = await exportBackup(store, content);
      setBackupStatus(
        `${where}.${skipped.length ? ` ${skipped.length} media file(s) could not be read: ${skipped.join(", ")}` : ""}`
      );
    } catch (err) {
      setBackupStatus(`Backup failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    const file = pendingImport;
    setPendingImport(null);
    setBusy(true);
    setBackupStatus("Importing… 0%");
    try {
      const result = await importBackup(store, file, token, (p) =>
        setBackupStatus(`Importing… ${Math.round(p * 100)}%`)
      );
      // saveContent keeps the previous version automatically before replacing it.
      await store.saveContent(result.content, token);
      await reload();
      setBackupStatus(
        `Imported ${result.content.events.length} events and ${result.mediaCount} media files.` +
          (result.missing.length
            ? ` ${result.missing.length} media file(s) weren't in the backup and will only show if already on this kiosk.`
            : "")
      );
    } catch (err) {
      setBackupStatus(`Import failed, nothing was changed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const exit = async () => {
    await store.signOut(token);
    update({ adminToken: null });
    navigate("/", { replace: true });
  };

  return (
    <div className="mx-auto max-w-4xl p-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-5xl">Admin dashboard</h1>
        <button onClick={exit} className={buttonClass("primary")}>Exit admin</button>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {["eras", "events", "media", "questions"].map((key) => (
          <div key={key} className="panel rounded-xl p-4">
            <dt className="capitalize text-text-muted">{key}</dt>
            <dd className="text-4xl font-bold">{content[key].length}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10 panel rounded-xl p-6">
        <h2 className="text-3xl">Settings</h2>
        <label htmlFor="idle" className="mt-4 block">Seconds before the “Are you still exploring?” prompt</label>
        <input
          id="idle"
          type="number"
          min="30"
          max="600"
          value={idleSeconds}
          onChange={(e) => setIdleSeconds(e.target.value)}
          className="mt-2 min-h-14 w-40 rounded-xl border-2 border-text-muted bg-bg px-4 text-text"
        />
        <div className="mt-4 flex items-center gap-4">
          <button onClick={save} className={buttonClass("primary")}>Save settings</button>
          <p aria-live="polite" className="text-text-muted">{status}</p>
        </div>
      </section>

      <section className="mt-10 panel rounded-xl p-6">
        <h2 className="text-3xl">Backups</h2>
        <p className="mt-2 text-text-muted">
          A backup is one .zip file with all content and media. Export one after every round of changes and keep a
          copy off the kiosk. Importing a backup replaces all content; the current version is kept first.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <button onClick={doExport} disabled={busy} className={buttonClass("primary")}>Export backup</button>
          <button onClick={() => fileInput.current?.click()} disabled={busy} className={buttonClass("secondary")}>
            Import backup…
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setPendingImport(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </div>

        {pendingImport && (
          <div role="alertdialog" aria-labelledby="import-confirm" className="mt-4 rounded-xl border-2 border-highlight p-4">
            <p id="import-confirm">
              Replace all content with <strong>{pendingImport.name}</strong>?
            </p>
            <div className="mt-3 flex gap-4">
              <button onClick={() => setPendingImport(null)} className={buttonClass("secondary")}>Cancel</button>
              <button onClick={doImport} className={buttonClass("primary")}>Replace content</button>
            </div>
          </div>
        )}

        <p aria-live="polite" className="mt-4 text-text-muted">{backupStatus}</p>
      </section>
    </div>
  );
}
