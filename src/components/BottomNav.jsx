import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useKiosk } from "../store/useKiosk.js";
import { useContent } from "../hooks/useContent.jsx";
import { useStartOver } from "../hooks/useStartOver.js";
import { parentOf } from "../lib/navigation.js";
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

  return (
    <nav aria-label="Main" className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-surface bg-bg px-4 py-3">
      <div className="min-w-[12rem]">
        {parent && (
          <Link to={parent.to} className={buttonClass("secondary")}>
            <span aria-hidden="true">‹</span> {parent.label}
          </Link>
        )}
      </div>

      <ul className="flex flex-wrap justify-center gap-4">
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) => buttonClass("secondary", isActive ? "border-highlight" : "")}
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="flex gap-4">
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
