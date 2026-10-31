
import { useEffect } from "react";
import rocketImage from "../assets/artemis-ii-rocket.png";
import { useKiosk } from "../store/useKiosk.js";
import "../styles/rocket-launch.css";

export default function RocketLaunch({ onComplete }) {
    const kioskReduceMotion = useKiosk((s) => s.reduceMotion);

    useEffect(() => {
        // Shorten the sequence if Reduce motion is on, in the kiosk's
        // Accessibility panel or in the device settings.
        const prefersReducedMotion = kioskReduceMotion || window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        const timer = window.setTimeout(
            onComplete,
            prefersReducedMotion ? 1800 : 5000
        );

        return () => window.clearTimeout(timer);
    }, [onComplete, kioskReduceMotion]);

    return (
        <section className="rocket-launch" aria-label="Rocket launch sequence">
            <div className="rocket-launch__glow" />

            <img
                src={rocketImage}
                alt="NASA Space Launch System rocket launching for the Artemis program"
                className="rocket-launch__image"
            />

            <div className="rocket-launch__caption">
                <p>MISSION COMPLETE</p>
                <h1>Ready for the Next Giant Leap?</h1>
            </div>
        </section>
    );
}
