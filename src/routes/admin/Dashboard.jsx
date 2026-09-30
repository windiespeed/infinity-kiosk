import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useKiosk } from "../../store/useKiosk.js";
import { useContent } from "../../hooks/useContent.jsx";
import { buttonClass } from "../../lib/ui.js";

// Starter dashboard. The idle-timeout setting shows the full save path working:
// edit -> PUT /api/content -> backup + atomic write on the server -> reload.
// TODO (admin issues): event editor, question editor, media upload, backup/restore,
// "planned events need review" flag, analytics.
export default function Dashboard() {
  const token = useKiosk((s) => s.adminToken);
  const update = useKiosk((s) => s.update);
  const { content, reload } = useContent();
  const navigate = useNavigate();
  const [idleSeconds, setIdleSeconds] = useState(content.settings.idleSeconds);
  const [status, setStatus] = useState("");

  if (!token) return <Navigate to="/admin" replace />;

  const save = async () => {
    setStatus("Saving…");
    const next = { ...content, settings: { ...content.settings, idleSeconds: Number(idleSeconds) } };
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(next),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      await reload();
      setStatus("Saved.");
    } else {
      setStatus(data.error ?? "Save failed.");
    }
  };

  const exit = async () => {
    await fetch("/api/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
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
          <div key={key} className="rounded-xl bg-surface p-4">
            <dt className="capitalize text-text-muted">{key}</dt>
            <dd className="text-4xl font-bold">{content[key].length}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10 rounded-xl bg-surface p-6">
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
    </div>
  );
}
