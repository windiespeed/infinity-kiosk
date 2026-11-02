import { useEffect, useRef } from "react";

// Shared behavior for panels and dialogs:
// - moves focus into the dialog when it opens (to the element with data-autofocus)
// - keeps Tab / Shift+Tab inside the dialog
// - Escape calls onClose
// - returns focus to whatever opened it when it closes
// When one dialog opens over another (the image viewer over an event), only the
// top one reacts to keys, so Escape closes just that one.
const openDialogs = [];

export function useDialog(onClose) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement;
    const node = ref.current;
    const token = {};
    openDialogs.push(token);
    (node?.querySelector("[data-autofocus]") ?? node)?.focus();

    const onKeyDown = (e) => {
      if (openDialogs[openDialogs.length - 1] !== token) return;
      if (e.key === "Escape" && onCloseRef.current) {
        e.preventDefault();
        onCloseRef.current();
      }
      if (e.key !== "Tab" || !node) return;
      const focusable = [...node.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
      )];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openDialogs.splice(openDialogs.indexOf(token), 1);
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, []);

  return ref;
}
