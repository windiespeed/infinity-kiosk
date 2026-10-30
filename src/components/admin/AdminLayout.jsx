import { useRef, useState } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router";
import { useKiosk } from "../../store/useKiosk.js";
import { useContent } from "../../hooks/useContent.jsx";
import { useIdleTimer } from "../../hooks/useIdleTimer.js";
import { buttonClass } from "../../lib/ui.js";
import IdleModal from "../IdleModal.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

// Admin screens. Each editor adds its link here when it's built.
const LINKS = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/eras", label: "Eras" },
  { to: "/admin/settings", label: "Settings" },
];

// Staff are signed out after 10 minutes without a touch, with a 1-minute warning.
// (The visitor idle timer is off on admin screens, so a pause never loses an edit.)
const ADMIN_IDLE_SECONDS = 9 * 60;
const ADMIN_WARNING_SECONDS = 60;

// Wraps every signed-in admin screen: the sign-in check, the menu, Exit admin,
// the admin sign-out timer, and the "leave without saving?" question.
export default function AdminLayout() {
  const token = useKiosk((s) => s.adminToken);
  const dirty = useKiosk((s) => s.adminDirty);
  const update = useKiosk((s) => s.update);
  const { store } = useContent();
  const navigate = useNavigate();
  const [leaveTo, setLeaveTo] = useState(null); // where to go once unsaved changes are dropped
  const signingOut = useRef(false);

  const signOut = async () => {
    // Without this flag, clearing the token sends staff to the sign-in screen
    // instead of the welcome screen (the route change lands after the token change).
    signingOut.current = true;
    await store.signOut(token).catch(() => {});
    update({ adminToken: null, adminDirty: false });
    navigate("/", { replace: true });
  };

  const idle = useIdleTimer({
    idleSeconds: ADMIN_IDLE_SECONDS,
    warningSeconds: ADMIN_WARNING_SECONDS,
    enabled: Boolean(token),
    onReset: signOut,
  });

  if (!token) return signingOut.current ? null : <Navigate to="/admin" replace />;

  const go = (to) => {
    if (dirty) setLeaveTo(to);
    else if (to === "exit") signOut();
    else navigate(to);
  };

  const leave = () => {
    const to = leaveTo;
    setLeaveTo(null);
    update({ adminDirty: false });
    if (to === "exit") signOut();
    else navigate(to);
  };

  // Keep the field being typed in above Android's on-screen keyboard, which
  // covers the lower part of the screen when it opens.
  const onFocusCapture = (e) => {
    if (!e.target.matches("input:not([type=checkbox],[type=radio]), textarea, select")) return;
    setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
  };

  return (
    <div className="flex min-h-full">
      <nav aria-label="Admin" className="sticky top-0 flex h-dvh w-72 shrink-0 flex-col gap-3 self-start border-r border-text-muted/25 p-6">
        <p className="text-text-muted">Staff admin</p>
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={(e) => {
              e.preventDefault();
              go(link.to);
            }}
            className={({ isActive }) => buttonClass(isActive ? "primary" : "secondary", "justify-start")}
          >
            {link.label}
          </NavLink>
        ))}
        <button onClick={() => go("exit")} className={buttonClass("secondary", "mt-auto")}>Exit admin</button>
      </nav>

      <div className="min-w-0 flex-1 pb-[40vh]" onFocusCapture={onFocusCapture}>
        <Outlet />
      </div>

      {leaveTo && (
        <ConfirmDialog
          title="Leave without saving?"
          message="Your changes on this screen haven't been saved and will be lost."
          confirmLabel="Leave without saving"
          onConfirm={leave}
          onCancel={() => setLeaveTo(null)}
        />
      )}
      {idle.warning && (
        <IdleModal
          remaining={idle.remaining}
          onStay={idle.stayHere}
          title="Still working?"
          message={`For security, you'll be signed out in ${idle.remaining} seconds. Unsaved changes will be lost.`}
          stayLabel="Stay signed in"
        />
      )}
    </div>
  );
}
