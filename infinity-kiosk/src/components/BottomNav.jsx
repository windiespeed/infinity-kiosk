import { NavLink } from "react-router";
import { useKiosk } from "../store/useKiosk.js";
import { buttonClass } from "../lib/ui.js";

const LINKS = [
  { to: "/timeline", label: "Timeline" },
  { to: "/library", label: "Images" },
  { to: "/quiz", label: "Quiz" },
  { to: "/about", label: "About" },
];

export default function BottomNav() {
  const a11yOpen = useKiosk((s) => s.a11yOpen);
  const toggle = useKiosk((s) => s.toggle);

  return (
    <nav aria-label="Main" className="border-t-2 border-surface bg-bg px-4 py-3">
      <ul className="flex flex-wrap justify-center gap-4">
        {LINKS.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                buttonClass("secondary", isActive ? "border-highlight" : "")
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
        <li>
          <button
            onClick={() => toggle("a11yOpen")}
            aria-expanded={a11yOpen}
            className={buttonClass("primary")}
          >
            Accessibility
          </button>
        </li>
      </ul>
    </nav>
  );
}
