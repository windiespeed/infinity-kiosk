import { Link } from "react-router";
import { useContent } from "../hooks/useContent.jsx";
import { eraYears } from "../lib/format.js";
import GoldRule from "../components/GoldRule.jsx";

// Home screen: the whole timeline as era segments on a gold line, like the wall.
// Upper area is display only; everything interactive sits in the lower part of the screen.
export default function EraOverview() {
  const { eras, eventsForEra } = useContent();

  return (
    <div className="flex h-full flex-col justify-between p-10">
      <header>
        <h1 className="text-7xl">The history of spaceflight</h1>
        <GoldRule className="mt-5" />
        <p className="mt-5 font-serif text-3xl text-accent">Choose an era to explore</p>
      </header>

      <div className="relative">
        <span aria-hidden="true" className="absolute left-0 right-0 top-[0.5625rem] hidden h-0.5 bg-accent/70 lg:block" />
        <ol className="grid gap-4 lg:grid-cols-5">
          {eras.map((era) => (
            <li key={era.id} className="relative lg:pt-10">
              <span aria-hidden="true" className="absolute left-1/2 top-0 hidden size-5 -translate-x-1/2 rounded-full border-4 border-bg bg-accent lg:block" />
              <Link
                to={`/era/${era.id}`}
                className="flex h-full min-h-48 flex-col justify-end gap-1 rounded-2xl border-2 border-accent/50 panel p-4 transition-colors hover:border-accent"
              >
                <span className="font-display text-xl font-bold text-accent">{eraYears(era)}</span>
                <span className="font-display text-lg font-semibold [overflow-wrap:anywhere]">{era.title}</span>
                <span className="text-base text-text-muted">{eventsForEra(era.id).length} events</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
