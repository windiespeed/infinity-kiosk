# Infinity Kiosk: Launch Task Issues

Six more issues for the tasks that weren't in the first set. Same steps as before: on GitHub go to
**Issues → New issue**, copy the **title**, then copy everything inside the gray box into the
description. Add the labels, put them in the **Feature freeze** milestone (except where noted),
assign them, and add them to the Project board.

**Suggested owners:** these are smaller than the feature issues, so give them to whoever finishes
their first issue early. The content and brand-color issues depend on the museum, so they can't
finish until the museum delivers.

---

## 11. About screen: mission statement, NASA insignia and credits

**Labels:** `feature`

~~~~markdown
## What and why
The About screen tells visitors who made the exhibit and shows the NASA Stennis mission statement. It's also the main place the NASA insignia (the "meatball") appears, once the museum approves the placement.

## Where in the code
- `src/routes/About.jsx`
- The insignia image goes in a new `src/assets/` folder (it's part of the app's design, not exhibit content, so it does go in Git).
- Move the text into `data/content.json` → `settings` so staff can edit it later.

## Done when
- [ ] Title: **About this exhibit**
- [ ] Heading **NASA Stennis Space Center** and the mission statement, word for word: "NASA Stennis accelerates the exploration and commercialization of space, innovates to benefit NASA and industry, and leverages assets to stimulate the economy and enhance national security."
- [ ] Visitor center line: "INFINITY Science Center is the official visitor center for NASA's John C. Stennis Space Center."
- [ ] Photo credit: "Photos courtesy of NASA unless otherwise noted."
- [ ] Built-by line: "This exhibit was built by Mississippi Coding Academies technologists for INFINITY Science Center."
- [ ] NASA insignia: **only after the museum approves the mockup.** Official artwork, never redrawn, recolored, stretched or cropped, on the dark background with clear space around it.

## Accessibility
- [ ] The insignia has alt text: "NASA insignia".
- [ ] Text is at least the normal body size and passes the contrast check.

## Notes
- Send Windie a screenshot of the screen with the insignia before merging, so the museum can approve it.
- The insignia must **not** appear on the visitor certificate.
- Size: about 1 day.
~~~~

---

## 12. Welcome screen: final title and subtitle

**Labels:** `feature`

~~~~markdown
## What and why
The welcome (attract) screen still has starter text. Update it to the approved wording.

## Where in the code
- `src/routes/Attract.jsx`
- Move the title and subtitle into `data/content.json` → `settings` so staff can edit them later.

## Done when
- [ ] Small gold heading: **INFINITY SCIENCE CENTER**
- [ ] Title: **Mississippi and the Space Age** (or the museum's chosen title)
- [ ] Gold subtitle: **How Hancock County helped send Americans to the Moon and beyond**
- [ ] Buttons unchanged: Explore the timeline · Browse images · Test your knowledge · Accessibility options
- [ ] Timeline overview screen title: **Mississippi's Road to Space**, subtitle **Choose an era to explore** (`src/routes/EraOverview.jsx`)

## Notes
- Text comes from *Kiosk Content by Screen*. Check the museum hasn't changed it before merging.
- Size: under 1 day.
~~~~

---

## 13. Load the real content: five eras and their events

**Labels:** `feature`, `kiosk`

~~~~markdown
## What and why
Replace the sample content with the museum's: five eras, 32 events, and the quiz question bank from *Kiosk Content by Screen*.

## Where in the code
- `data/content.json` (eras, events, questions, settings)
- Media files in `data/media/` on your own computer only (they stay out of Git); the Media Log lists file names.

## Done when
- [ ] The five eras, with years, titles, subtitles (`subtitle`) and overviews. Add an `overview` field to each era and show it on the era screen (`src/routes/EraScreen.jsx`) under the subtitle.
- [ ] All 32 events, with sort dates (YYYY-MM-DD), display dates, short titles (28 characters or fewer), titles, summaries, detail text and era assignments.
- [ ] The "Today" event marked `status: "ongoing"`.
- [ ] The 11 quiz questions, each linked to its event.
- [ ] Photos attached to events by file name, once approved in the Media Log.
- [ ] Sample events, questions and `sample-*` media removed from `content.json` (keep the `sample-*` image files themselves; the Android app uses them on first launch).
- [ ] Export a backup zip with all approved media and put it in the Drive's **3-Kiosk-Backups** folder.

## Notes
- Start with the draft text now; update it as the museum approves sections.
- If the admin event editor is merged first, enter events through it instead of editing JSON by hand.
- Text marked "waiting on the museum's decision" stays out until the museum decides.
- Size: about 3 days, spread over weeks 2 and 3.
~~~~

---

## 14. Apply the museum's brand colors

**Labels:** `feature`, `accessibility`

~~~~markdown
## What and why
Replace the temporary wall-inspired colors with the museum's official colors.

## Where in the code
- `src/styles/theme.css` only. Components use theme tokens, so nothing else changes.

## Done when
- [ ] Brand colors entered as 6-digit hex values (`#RRGGBB`). Convert RGB or other formats first.
- [ ] `npm run check:contrast` passes in both the normal and high-contrast themes. If a brand color fails, keep it as a fill and adjust its paired text or outline token, not the brand color itself.
- [ ] Checked on the kiosk itself (`npm run dev:host`).
- [ ] Screenshots of the welcome, timeline and era screens attached to the PR for the museum.

## Notes
- Blocked until the museum sends the colors.
- Size: about 1 day.
~~~~

---

## 15. Update the team guide and README

**Labels:** `kiosk`

~~~~markdown
## What and why
The README and the team guide still describe parts of the old setup (a local server on the kiosk, branches deleted automatically after merge).

## Where
- `README.md`
- The *Infinity Kiosk Team Guide* document (ask Windie for edit access)

## Done when
- [ ] README describes the Android app as how the kiosk runs, linking to `docs/ANDROID.md`.
- [ ] Team guide: the after-merge section no longer says GitHub deletes branches automatically. Keep the routine: switch to main, pull, start a new branch.
- [ ] Team guide: add `npm run dev:host` for testing on the kiosk, and the Ctrl + Alt + A admin shortcut.
- [ ] README: a "Where media lives" note linking to the shared Drive folder and the Media Log.

## Notes
- Size: under 1 day.
~~~~

---

## 16. Staff quick guide (one page)

**Labels:** `kiosk` · milestone: none (due before install, Oct 26)

~~~~markdown
## What and why
Museum staff need a one-page guide kept with the kiosk: how to reach the admin screen, update content, back it up, and what to do when something goes wrong.

## Done when
- [ ] Opening the admin screen: five quick taps in the top-left corner (or Ctrl + Alt + A on a keyboard), then the PIN.
- [ ] Editing content and adding photos (once the admin editors are merged).
- [ ] Exporting a backup after every round of changes, and where to copy it (the Drive's **3-Kiosk-Backups** folder).
- [ ] If the screen freezes: restart the kiosk; the app opens by itself.
- [ ] If the PIN is lost: who to contact (it can't be recovered without erasing content).
- [ ] Who to contact for help.
- [ ] Written for non-technical staff, one printed page, large type.

## Notes
- Size: about 1 day. Have a museum staff member try it before finalizing.
~~~~
