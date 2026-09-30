// "Back" goes UP one level (event -> its era -> all eras), not to the previous page
// in browser history. A visitor who walks up mid-session has no history of their own,
// and after an idle reset the browser history still holds the previous visitor's pages.
// Returns { to, label } or null on top-level screens.
export function parentOf(pathname, { eraById, eventById }) {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "era" && parts[2] === "event") {
    const era = eraById?.(parts[1]);
    return { to: `/era/${parts[1]}`, label: era ? `Back to ${era.title}` : "Back" };
  }
  if (parts[0] === "era") {
    return { to: "/timeline", label: "Back to all eras" };
  }
  if (parts[0] === "quiz" && parts[1] === "event") {
    const event = eventById?.(parts[2]);
    return event
      ? { to: `/era/${event.eraIds[0]}/event/${event.id}`, label: "Back to the event" }
      : { to: "/quiz", label: "Back to quizzes" };
  }
  if (parts[0] === "quiz" && parts[1]) {
    return { to: "/quiz", label: "Back to quizzes" };
  }
  return null; // top-level screens: timeline, images, quiz, about
}
