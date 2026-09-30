import { Link } from "react-router";
import { useContent } from "../hooks/useContent.jsx";
import { buttonClass } from "../lib/ui.js";
import { eraYears } from "../lib/format.js";

// Home screen: the whole timeline as era segments. Upper area is display only;
// everything interactive sits in the lower part of the screen.
export default function EraOverview() {
  const { eras, eventsForEra } = useContent();

  return (
    <div className="flex h-full flex-col justify-between p-10">
      <header>
        <h1 className="text-7xl">The history of spaceflight</h1>
        <p className="mt-3 text-2xl text-text-muted">Choose an era to explore.</p>
      </header>

      <ol className="grid gap-4 lg:grid-cols-5">
        {eras.map((era) => (
          <li key={era.id}>
            <Link to={`/era/${era.id}`} className={buttonClass("era", "h-full min-h-48 w-full flex-col items-start justify-end px-5 text-left hyphens-auto")}>
              <span className="text-lg font-normal">{eraYears(era)}</span>
              <span className="font-display text-2xl">{era.title}</span>
              <span className="text-base font-normal">{eventsForEra(era.id).length} events</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
