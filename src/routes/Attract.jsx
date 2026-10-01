import { Link } from "react-router";
import { useKiosk } from "../store/useKiosk.js";
import { buttonClass } from "../lib/ui.js";
import GoldRule from "../components/GoldRule.jsx";

// The screen the kiosk returns to when idle. Three ways in, so visitors choose
// their own starting point.
// TODO (attract issue): play content.settings.attractVideo as a muted looping background.
export default function Attract() {
  const toggle = useKiosk((s) => s.toggle);

  return (
    <div className="flex h-full flex-col justify-between p-10">
      <header className="pt-[6vh] text-center">
        <p className="font-display text-2xl tracking-[0.2em] text-accent uppercase">Infinity Science Center</p>
        <h1 className="mx-auto mt-4 max-w-[22ch] text-7xl">The history of spaceflight</h1>
        <GoldRule className="mt-6 justify-center" />
        <p className="mt-6 font-serif text-3xl text-accent">From the first satellites to tomorrow's missions</p>
      </header>

      <nav aria-label="Start exploring" className="pb-[4vh]">
        <ul className="grid gap-4 sm:grid-cols-3">
          <li><Link to="/timeline" className={buttonClass("primary", "w-full min-h-24 text-2xl")}>Explore the timeline</Link></li>
          <li><Link to="/library" className={buttonClass("secondary", "w-full min-h-24 text-2xl")}>Browse images</Link></li>
          <li><Link to="/quiz" className={buttonClass("secondary", "w-full min-h-24 text-2xl")}>Test your knowledge</Link></li>
        </ul>
        <div className="mt-4 flex justify-center">
          <button onClick={() => toggle("a11yOpen")} className={buttonClass("secondary")}>
            Accessibility options
          </button>
        </div>
      </nav>
    </div>
  );
}
