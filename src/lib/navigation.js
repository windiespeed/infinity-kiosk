// "Back" goes UP one level (event -> its era -> all eras), not to the previous page
// in browser history. A visitor who walks up mid-session has no history of their own,
// and after an idle reset the browser history still holds the previous visitor's pages.
// Returns { to, label } or null on top-level screens.
export function parentOf(pathname, { eraById }) {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "era" && parts[2] === "event") {
    const era = eraById?.(parts[1]);
    return { to: `/era/${parts[1]}`, label: era ? `Back to ${era.title}` : "Back" };
  }
  if (parts[0] === "era") {
    return { to: "/timeline", label: "Back to all eras" };
  }
  if (parts[0] === "quiz" && parts[1] === "era") {
    const era = eraById?.(parts[2]);
    return era
      ? { to: `/era/${era.id}`, label: `Back to ${era.title}` }
      : { to: "/quiz", label: "Back to quizzes" };
  }
  if (parts[0] === "quiz" && parts[1]) {
    return { to: "/quiz", label: "Back to quizzes" };
  }
  return null; // top-level screens: timeline, images, quiz, about
}

// The bottom bar's Quiz button follows the visitor: on an era (or one of its
// events or its quiz) it opens that era's quiz, everywhere else the timeline
// challenge, which mixes questions from every era.
export function quizPathFor(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "era" && parts[1]) return `/quiz/era/${parts[1]}`;
  if (parts[0] === "quiz" && parts[1] === "era" && parts[2]) return `/quiz/era/${parts[2]}`;
  return "/quiz";
}
