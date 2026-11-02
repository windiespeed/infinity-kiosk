import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useKiosk } from "../store/useKiosk.js";
import { useContent } from "../hooks/useContent.jsx";
import { useStartOver } from "../hooks/useStartOver.js";
import { parentOf, quizPathFor } from "../lib/navigation.js";
import { buttonClass } from "../lib/ui.js";
import StartOverDialog from "./StartOverDialog.jsx";

const LINKS = [
  { to: "/timeline", label: "Timeline" },
  { to: "/library", label: "Images" },
  { to: "/quiz", label: "Quiz" },
  { to: "/about", label: "About" },
];

// Layout: Back on the left, main sections in the middle, Start over and
// Accessibility on the right. Back stays in the same spot on every screen
// (hidden, not removed, on top-level screens) so nothing shifts around.
export default function BottomNav() {
  const { pathname } = useLocation();
  const content = useContent();
  const a11yOpen = useKiosk((s) => s.a11yOpen);
  const toggle = useKiosk((s) => s.toggle);
  const startOver = useStartOver();
  const [confirming, setConfirming] = useState(false);
  const parent = parentOf(pathname, content);
  const links = LINKS.map((link) =>
    link.to === "/quiz" ? { ...link, to: quizPathFor(pathname) } : link
  );

  return (
    <nav aria-label="Main" className="flex flex-wrap items-center justify-between gap-3 lg:flex-nowrap border-t border-accent/40 bg-bg-glow/95 px-4 py-3">
      {/* On wide screens the bar stays one row: a long Back label like "Back to
          The International Space Station" wraps inside its button instead. */}
      <div className="min-w-[11rem] lg:min-w-0">
        {parent && (
          <Link to={parent.to} className={buttonClass("primary", "leading-tight")}>
            <span aria-hidden="true">‹</span> {parent.label}
          </Link>
        )}
      </div>

      <ul className="flex shrink-0 flex-wrap justify-center gap-3">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) => buttonClass("secondary", `lg:px-4 ${isActive ? "border-highlight" : ""}`)}
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="flex shrink-0 gap-3">
        <button onClick={() => setConfirming(true)} className={buttonClass("secondary")}>
          Start over
        </button>
        <button onClick={() => toggle("a11yOpen")} aria-expanded={a11yOpen} className={buttonClass("primary")}>
          Accessibility
        </button>
      </div>

      {confirming && (
        <StartOverDialog
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            startOver();
          }}
        />
      )}
    </nav>
  );
}
