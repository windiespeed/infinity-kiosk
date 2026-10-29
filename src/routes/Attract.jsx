
import { Link } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useKiosk } from "../store/useKiosk.js";
import { useContent } from "../hooks/useContent.jsx";
import { buttonClass } from "../lib/ui.js";
import GoldRule from "../components/GoldRule.jsx";
import VideoPlayer from "../components/VideoPlayer.jsx";
import engineFiring from "../assets/engine-test-firing.jpg";
import earthAtNight from "../assets/earth-at-night-iss040e090540.jpg";
import infinityLogo from "../assets/infinity-logo-white.png";
import nasaMeatball from "../assets/nasa-meatball.png";
import stennisVideo from "../assets/stennis-overview.mp4";

// The screen the kiosk returns to when idle. Three ways in, so visitors choose
// their own starting point.
export default function Attract() {
  const toggle = useKiosk((s) => s.toggle);
  const { content, mediaById, mediaUrl } = useContent();

  const attractVideoId = content?.settings?.attractVideo;
  const attractVideo = attractVideoId ? mediaById(attractVideoId) : null;
  const reduceMotion = useKiosk((s) => s.reduceMotion);
  const videoRef = useRef(null);
  const [showVideo, setShowVideo] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (reduceMotion) {
      video.pause();
    } else {
      video.play().catch(() => {
        // Playback may be blocked by the device.
      });
    }
  }, [reduceMotion]);

  useEffect(() => {
    const timer = setTimeout(() => setShowVideo(true), 50);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden p-10">
      {attractVideo && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <VideoPlayer
            item={attractVideo}
            mediaUrl={mediaUrl}
            background
          />
        </div>
      )}

      {!attractVideo && (
        <>
          {/* Stennis overview video, faded into the upper right. */}
          <video
            ref={videoRef}
            src={stennisVideo}
            autoPlay={!reduceMotion}
            muted
            loop
            preload="auto"
            draggable="false"
            playsInline
            aria-hidden="true"
            className={`pointer-events-none absolute right-0 top-0 z-0
        h-[55vh] w-[65vw] object-cover
        transition-opacity duration-100
        [mask-image:radial-gradient(ellipse_at_70%_30%,black_10%,transparent_75%)]
        ${showVideo ? "opacity-30" : "opacity-0"}`}
          />
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
        </>
      )}

      {/* Logo row across the top, like the exhibit wall: the NASA "meatball" on the left
          and the Infinity Science Center logo on the right, both at full strength and
          centered on the same line. NASA's rules say the insignia must not be altered,
          so it gets no mask or effects. Use of the NASA insignia still needs museum review.
          The Infinity logo has white lettering so it reads on the dark background, and its
          alt is empty because the heading below already says the name. */}
      <div className="pointer-events-none absolute inset-x-8 top-8 z-10 flex items-center justify-between">
        <img src={nasaMeatball} alt="NASA" draggable="false" className="h-36" />
        <img src={infinityLogo} alt="" aria-hidden="true" draggable="false" className="relative z-10 h-16" />
      </div>

      <header className="relative z-10 pt-[6vh] text-center">
        <p className="font-display text-2xl tracking-[0.2em] text-accent uppercase">
          Infinity Science Center
        </p>
        <h1 className="mx-auto mt-4 max-w-[22ch] text-7xl">
          The history of spaceflight
        </h1>
        <GoldRule className="mt-6 justify-center" />
        <p className="m-6 font-display text-3xl text-accent">
          From the first satellites to tomorrow's missions
        </p>
      </header>

      <nav
        aria-label="Start exploring"
        className="relative z-10 pb-[4vh]"
      >
        <ul className="grid gap-4 sm:grid-cols-3">
          <li>
            <Link
              to="/timeline"
              className={buttonClass("primary", "w-full min-h-24 text-2xl")}
            >
              Explore the timeline
            </Link>
          </li>
          <li>
            <Link
              to="/library"
              className={buttonClass("secondary", "w-full min-h-24 text-2xl")}
            >
              Browse images
            </Link>
          </li>
          <li>
            <Link
              to="/quiz"
              className={buttonClass("secondary", "w-full min-h-24 text-2xl")}
            >
              Test your knowledge
            </Link>
          </li>
        </ul>

        <div className="mt-4 flex justify-center">
          <button
            onClick={() => toggle("a11yOpen")}
            className={buttonClass("secondary")}
          >
            Accessibility options
          </button>
        </div>
      </nav>
    </div>
  );
}