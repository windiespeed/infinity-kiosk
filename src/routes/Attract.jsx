import { Link } from "react-router";
import { useKiosk } from "../store/useKiosk.js";
import { buttonClass } from "../lib/ui.js";
import GoldRule from "../components/GoldRule.jsx";
import engineFiring from "../assets/engine-test-firing.jpg";
import earthAtNight from "../assets/earth-at-night-iss040e090540.jpg";
import infinityLogo from "../assets/infinity-logo-white.png";
import nasaMeatball from "../assets/nasa-meatball.png";
import stennisVideo from "../assets/stennis-overview.mp4";

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
      {/* Infinity Science Center logo in the upper right, faded like the photos. This copy
          has white lettering so it reads on the dark background (the original's gray letters
          disappear). w-44 is the size, opacity-60 the brightness, and the mask fades it out
          from the top right corner. alt is empty because the heading below already says the name. */}
      <img
        src={infinityLogo}
        alt=""
        aria-hidden="true"
        draggable="false"
        className="pointer-events-none absolute top-8 right-8 w-44 opacity-60 [mask-image:radial-gradient(ellipse_at_100%_0%,black_45%,transparent_100%)] [[data-contrast=high]_&]:opacity-100 [[data-contrast=high]_&]:[mask-image:none]"
      />
      <header className="relative pt-[6vh] text-center">
        <p className="font-display text-2xl tracking-[0.2em] text-accent uppercase">Infinity Science Center</p>
        <h1 className="mx-auto mt-4 max-w-[22ch] text-7xl">The history of spaceflight</h1>
        <GoldRule className="mt-6 justify-center" />
        <p className="m-6 font-serif text-3xl text-accent">From the first satellites to tomorrow's missions</p>
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
