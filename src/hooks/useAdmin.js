import { useEffect, useState } from "react";
import { useKiosk } from "../store/useKiosk.js";
import { useContent } from "./useContent.jsx";

// Saving from an admin screen: save the whole content, reload it so every screen
// sees the change, and report what happened in `status` (for an aria-live line).
export function useAdminSave() {
  const token = useKiosk((s) => s.adminToken);
  const { reload, store } = useContent();
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (nextContent, done = "Saved.") => {
    setSaving(true);
    setStatus("Saving…");
    try {
      await store.saveContent(nextContent, token);
      await reload();
      setStatus(done);
      return true;
    } catch (err) {
      setStatus(err.message || "Save failed. Nothing was changed.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { save, status, setStatus, saving };
}

// Marks the admin as having unsaved changes while `dirty` is true. The admin menu
// and Exit admin then ask before leaving, and closing the browser tab warns too.
// Several forms on one screen (an event and its questions) can each use it.
export function useUnsavedChanges(dirty) {
  const addDirty = useKiosk((s) => s.addDirty);
  const removeDirty = useKiosk((s) => s.removeDirty);

  useEffect(() => {
    if (!dirty) return;
    addDirty();
    const warn = (e) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      removeDirty();
    };
  }, [dirty, addDirty, removeDirty]);
}
