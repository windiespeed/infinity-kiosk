import { Link } from "react-router";
import { useKiosk } from "../store/useKiosk.js";
import { buttonClass } from "../lib/ui.js";
import WallMoon from "../components/WallMoon.jsx";
import engineFiring from "../assets/engine-test-firing.jpg";
import earthAtNight from "../assets/earth-at-night-iss040e090540.jpg";
import infinityLogo from "../assets/infinity-logo-white.png";

// The screen the kiosk returns to when idle. Three ways in, so visitors choose
// their own starting point.
// TODO (attract issue): play content.settings.attractVideo as a muted looping background.
export default function Attract() {
  const toggle = useKiosk((s) => s.toggle);

  return (
    <div className="relative flex h-full flex-col justify-between p-10">
      {/* Engine test photo in the lower left. The mask fades it into the stars along
          a slightly tilted line that reaches about the middle of the screen.
          Tune it with opacity-55 (brightness), the angle (72deg) and the two
          percentages (where the fade starts and ends). */}
      <img
        src={engineFiring}
        alt=""
        aria-hidden="true"
        draggable="false"
        className="pointer-events-none absolute bottom-0 left-0 h-full w-[60%] object-cover object-[center_35%] opacity-55 [mask-image:linear-gradient(72deg,black_20%,transparent_70%)] [[data-contrast=high]_&]:hidden"
      />
      {/* Earth at night from the ISS (NASA photo ISS040-E-090540), barely visible in the
          lower right to balance the engine. opacity-30 is the brightness; the mask
          fades it out from the corner. */}
      <img
        src={earthAtNight}
        alt=""
        aria-hidden="true"
        draggable="false"
        className="pointer-events-none absolute right-0 bottom-0 h-[70%] w-[55%] object-cover object-[center_40%] opacity-30 [mask-image:radial-gradient(ellipse_at_100%_100%,black_20%,transparent_70%)] [[data-contrast=high]_&]:hidden"
      />
      {/* Header band, like the top of the exhibit wall: a darker strip of space
          across the top with the Moon in the upper right, edged by a thin gold line. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[46%] overflow-hidden border-b border-accent/40 bg-space/95 [[data-contrast=high]_&]:bg-transparent">
        <WallMoon className="absolute -top-[18%] -right-[7%] h-[118%] opacity-90 [[data-contrast=high]_&]:hidden" />
      </div>
      {/* Infinity Science Center logo in the upper left, where the wall has the NASA logo. */}
      <img
        src={infinityLogo}
        alt="INFINITY Science Center"
        draggable="false"
        className="pointer-events-none absolute top-10 left-10 w-40"
      />
      <header className="relative pt-[12vh] text-center">
        <h1 className="text-5xl font-bold">The history of spaceflight</h1>
        <p className="mt-5 font-display text-3xl text-accent">From the first satellites to tomorrow's missions</p>
      </header>

      <nav aria-label="Start exploring" className="relative pb-[4vh]">
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
