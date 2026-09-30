import { useContent } from "../hooks/useContent.jsx";

// Shown while content loads, or if the local server can't be reached.
export default function PageStatus() {
  const { error } = useContent();
  return (
    <div className="flex h-full items-center justify-center p-8 text-center">
      {error ? (
        <div role="alert">
          <h1 className="text-4xl">Content could not load</h1>
          <p className="mt-3 text-text-muted">
            Check that the kiosk server is running, then restart the kiosk.
          </p>
        </div>
      ) : (
        <p aria-live="polite" className="text-text-muted">Loading…</p>
      )}
    </div>
  );
}
