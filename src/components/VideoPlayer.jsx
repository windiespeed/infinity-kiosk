
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "../lib/ui.js";
import { useKiosk } from "../store/useKiosk.js";

// Plays a video from the media library with accessible controls and captions.
// Background mode is muted and looping; it does not hold the idle timer busy.
export default function VideoPlayer({
  item,
  mediaUrl,
  background = false,
}) {
  const videoRef = useRef(null);
  const busyRef = useRef(false);

  const addBusy = useKiosk((s) => s.addBusy);
  const removeBusy = useKiosk((s) => s.removeBusy);
  const reduceMotion = useKiosk((s) => s.reduceMotion);

  const [playing, setPlaying] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);

  const videoSrc = mediaUrl(item);
  const captionsSrc = item.captionsFile
    ? mediaUrl({ file: item.captionsFile })
    : "";
  const posterSrc = item.poster
    ? mediaUrl({ file: item.poster })
    : undefined;

  // Only release busy state if this player previously acquired it.
  function releaseBusy() {
    if (!busyRef.current) return;
    busyRef.current = false;
    removeBusy();
  }

  function handlePlay() {
    setPlaying(true);

    // A looping attract background must not block the idle timer.
    if (!background && !busyRef.current) {
      busyRef.current = true;
      addBusy();
    }
  }

  function handlePause() {
    setPlaying(false);
    releaseBusy();
  }

  function handleEnded() {
    setPlaying(false);
    releaseBusy();
  }

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch (error) {
        console.error("Unable to play video:", error);
      }
    } else {
      video.pause();
    }
  }

  async function restartVideo() {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;

    if (video.paused) {
      try {
        await video.play();
      } catch (error) {
        console.error("Unable to restart video:", error);
      }
    }
  }

  function toggleCaptions() {
    setCaptionsOn((enabled) => !enabled);
  }

  // Keep caption visibility in sync with the native text track.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function updateCaptionMode() {
      for (const track of video.textTracks) {
        if (track.kind === "captions" || track.kind === "subtitles") {
          track.mode = captionsOn ? "showing" : "disabled";
        }
      }
    }

    updateCaptionMode();
    video.addEventListener("loadedmetadata", updateCaptionMode);

    return () => {
      video.removeEventListener("loadedmetadata", updateCaptionMode);
    };
  }, [captionsOn, videoSrc, captionsSrc]);

  // Never leave the kiosk busy if this player unmounts during playback.
  useEffect(() => {
    return () => {
      if (busyRef.current) {
        busyRef.current = false;
        removeBusy();
      }
    };
  }, [removeBusy]);

  // Respect the kiosk's Reduce Motion setting on the attract screen.
  if (background && reduceMotion) {
    return posterSrc ? (
      <img
        src={posterSrc}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
    ) : null;
  }

  if (background) {
    return (
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        muted
        autoPlay
        loop
        playsInline
        aria-hidden="true"
        tabIndex={-1}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      >
        {captionsSrc && (
          <track
            kind="captions"
            src={captionsSrc}
            srcLang="en"
            label="English"
          />
        )}
      </video>
    );
  }

  return (
    <section
      aria-label={item.alt || item.caption || "Video player"}
      className="mt-6 w-full"
    >
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        playsInline
        preload="metadata"
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={() => {
          setPlaying(false);
          releaseBusy();
        }}
        className="w-full rounded-xl bg-black"
      >
        {captionsSrc && (
          <track
            kind="captions"
            src={captionsSrc}
            srcLang="en"
            label="English"
            default
          />
        )}
        Your browser does not support HTML video.
      </video>

      <div
        className="mt-3 flex flex-wrap gap-3"
        aria-label="Video controls"
      >
        <button
          type="button"
          onClick={togglePlayback}
          className={buttonClass("primary")}
          aria-label={playing ? "Pause video" : "Play video"}
        >
          {playing ? "Pause" : "Play"}
        </button>

        <button
          type="button"
          onClick={restartVideo}
          className={buttonClass("secondary")}
        >
          Restart
        </button>

        {captionsSrc && (
          <button
            type="button"
            onClick={toggleCaptions}
            className={buttonClass("secondary")}
            aria-pressed={captionsOn}
          >
            Captions: {captionsOn ? "On" : "Off"}
          </button>
        )}
      </div>
    </section>
  );
}
