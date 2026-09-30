import { Link } from "react-router";
import { useKiosk } from "../store/useKiosk.js";
import { buttonClass } from "../lib/ui.js";

// The screen the kiosk returns to when idle. Three ways in, so visitors choose
// their own starting point.
// TODO (attract issue): play content.settings.attractVideo as a muted looping background.
export default function Attract() {
  const toggle = useKiosk((s) => s.toggle);

  return (
    <div className="flex h-full flex-col justify-between bg-[radial-gradient(circle_at_75%_30%,var(--color-surface),var(--color-bg)_60%)] p-10">
      <header className="pt-[6vh]">
        <p className="text-2xl text-text-muted">Infinity Science Center</p>
        <h1 className="mt-2 max-w-[18ch] text-7xl">The history of spaceflight, from 1957 to tomorrow</h1>
      </header>

      <nav aria-label="Start exploring" className="pb-[4vh]">
        <ul className="grid gap-4 sm:grid-cols-3">
          <li><Link to="/timeline" className={buttonClass("primary", "w-full min-h-24 text-2xl")}>Explore the timeline</Link></li>
          <li><Link to="/library" className={buttonClass("era", "w-full min-h-24 text-2xl")}>Browse images</Link></li>
          <li><Link to="/quiz" className={buttonClass("era", "w-full min-h-24 text-2xl")}>Test your knowledge</Link></li>
        </ul>
        <button onClick={() => toggle("a11yOpen")} className={buttonClass("secondary", "mt-4")}>
          Accessibility options
        </button>
      </nav>
    </div>
  );
}
