# Infinity Kiosk: GitHub Issues

Ten issues, ready to paste. For each one: on GitHub go to **Issues → New issue**, copy the
**title**, then copy everything inside the gray box into the description. Add the labels,
assign it, and add it to the Project board.

## Before you create them

**Create these labels** (Issues → Labels → New label): `feature`, `admin`, `accessibility`, `kiosk`.

**Create a milestone** (Issues → Milestones → New milestone) called **Feature freeze** with a
due date of **October 23**, and put every issue in it except the visual refresh.

**Suggested assignments for six technologists:**

| Person | Issues | Why together |
|---|---|---|
| 1 | Quiz | One large feature |
| 2 | QR certificate and companion site, then Accessibility testing | Both touch the build and GitHub setup |
| 3 | Image viewer with zoom | Needs care on touch and keyboard |
| 4 | Admin: event editor, then Admin: era editor and settings | Same patterns, same screens |
| 5 | Admin: media library and upload, then Admin: question editor | Media first, since other editors pick from it |
| 6 | Video player and attract loop, then Read aloud | Both are about media playback and audio |

**Shared files:** most work is in each person's own files, but several issues add routes to
`src/App.jsx` and add fields to `data/content.json`. Mention it in the team chat before
changing either, and keep those changes small.

---

## 1. Quiz: event quizzes and the timeline challenge

**Labels:** `feature`, `accessibility`

~~~~markdown
## What and why
Visitors can test what they learned in two ways:
- **Event quiz:** the "Test yourself" button on an event opens that event's questions.
- **Timeline challenge:** five questions, one from each era, picked at random each time. Finishing it leads to the QR certificate.

Wrong answers teach rather than fail: the visitor sees the explanation and tries again until they get it right. Everyone who finishes has answered every question correctly.

## Where in the code
- `src/routes/Quiz.jsx`: replace the `QuizHome` and `EventQuiz` placeholders. Keep `QuizComplete` (the certificate issue owns it).
- New `src/components/QuizQuestion.jsx` used by both quiz types.
- Questions come from `useContent()`: `content.questions` and `questionsForEvent(eventId)`. Each question has `prompt`, `choices`, `correctIndex`, `explanation`.
- Find a question's era through its event: `eventById(q.eventId).eraIds`.

## Done when
- [ ] `/quiz` shows a **Start the timeline challenge** button and a short explanation.
- [ ] The challenge picks one random question from each era that has questions (skip eras with none).
- [ ] `/quiz/event/:eventId` runs that event's questions in order.
- [ ] One question at a time, with progress like "Question 2 of 5".
- [ ] Correct answer: a check icon, the word **Correct**, and the explanation, then **Next question**.
- [ ] Wrong answer: an X icon, **Not quite**, the explanation, and that choice disabled so the visitor can try again.
- [ ] Event quiz end: **You finished!** with buttons back to the event and to the timeline challenge.
- [ ] Challenge end: goes to `/quiz/complete` with `navigate("/quiz/complete", { state: { completed: true } })`.

## Accessibility
- [ ] No timers anywhere.
- [ ] Answer choices are large buttons (`buttonClass`) stacked vertically in the lower part of the screen.
- [ ] Right/wrong is shown with an icon and words, never color alone (use `text-success` / `text-danger` tokens plus the icon).
- [ ] The result is announced with an `aria-live="polite"` region.
- [ ] After answering, focus moves to the result so keyboard and screen-reader users hear it.
- [ ] Works fully with the keyboard: Tab to a choice, Enter to answer.

## Notes
- Shuffle the challenge's question choice in each era, but keep each question's own choice order (or shuffle carefully and remap `correctIndex`).
- The sample `data/content.json` has 3 questions; add a few more locally to test the challenge.
- Size: about 4–5 days.
~~~~

---

## 2. QR certificate and companion site

**Labels:** `feature`, `kiosk`

~~~~markdown
## What and why
When a visitor finishes the timeline challenge, the kiosk shows a large QR code. They scan it with their own phone, which opens a certificate page where they type their name and save the certificate as an image. Nothing personal is ever entered on the kiosk or stored anywhere.

The kiosk is offline, but the visitor's phone uses its own data, so the certificate page lives on a small public website: the "companion site", hosted free on GitHub Pages.

## Where in the code
- `src/routes/Quiz.jsx` → `QuizComplete`: the kiosk's QR screen.
- New route `/certificate` (phone page) in a new `src/routes/Certificate.jsx`.
- New `src/lib/store/staticStore.js`: a read-only store for the companion build that loads a bundled copy of `data/content.json` (the companion has no server). Pick it in `src/lib/store/index.js` when `import.meta.env.VITE_COMPANION === "true"`.
- New GitHub Actions workflow to build with `VITE_COMPANION=true` and deploy `dist/` to GitHub Pages.
- Library: `qrcode.react` for the QR code.

## Done when
**Kiosk (`/quiz/complete`)**
- [ ] Only reachable after finishing the challenge (if `location.state?.completed` is missing, redirect to `/quiz`).
- [ ] QR code at least 400px, black on white with a white margin, linking to `<companion URL>/certificate?d=YYYY-MM-DD&c=timeline`.
- [ ] "Scan with your phone's camera" above it, and the short web address as text below it.
- [ ] The idle timer doesn't reset the screen for 2 minutes (use `addBusy()` / `removeBusy()` from `useKiosk`, and always remove it when leaving the screen).

**Phone (`/certificate`)**
- [ ] Name field (the name never leaves the phone), then a certificate drawn on a `<canvas>` with the completion date from the link.
- [ ] Colors read from the theme: `getComputedStyle(document.documentElement).getPropertyValue("--color-accent")`.
- [ ] **Save image** button: `navigator.share` with the image file where supported, otherwise a download.
- [ ] Looks right on a phone screen.

**Companion build and hosting**
- [ ] `staticStore` works and the admin routes are not reachable in the companion build.
- [ ] Workflow deploys to GitHub Pages on every merge to main.
- [ ] Refreshing `/certificate` on GitHub Pages works (copy `index.html` to `404.html` in the workflow, and set Vite's `base` if the site isn't at the domain root).
- [ ] The companion URL is a setting (environment variable), not hardcoded in several places.

## Accessibility
- [ ] The QR screen also says, in words, what the QR code does.
- [ ] The certificate page is usable with a phone screen reader (labelled name field, button text).
- [ ] The certificate image has a text alternative on the page ("Certificate for <name>, completed <date>").

## Notes
- Confirm with Windie that the Infinity Science Center logo may be used on the certificate before adding it.
- Size: about 4–5 days.
~~~~

---

## 3. Image viewer with zoom

**Labels:** `feature`, `accessibility`

~~~~markdown
## What and why
Tapping any image (in an event's gallery or the image library) opens it full-screen, where visitors can zoom in on details like rocket engines and control panels. Zoom is required for launch.

## Where in the code
- New `src/components/ImageViewer.jsx`, opened from `src/components/EventPanel.jsx` and `src/routes/Library.jsx`.
- Library: `react-zoom-pan-pinch` (`TransformWrapper` / `TransformComponent`, which give `zoomIn`, `zoomOut`, `resetTransform`).
- Use `useDialog` (`src/hooks/useDialog.js`) for focus handling and Escape.
- Image addresses come from `mediaUrl(item)` in `useContent()`.

## Done when
- [ ] Opens full-screen over everything, from both the event gallery and the library.
- [ ] Pinch and double-tap zoom; drag to move around when zoomed.
- [ ] Large **+**, **−**, **Reset** and **Close** buttons in the lower part of the screen.
- [ ] Shows the zoom level, like "2×".
- [ ] Previous / next image buttons when there's more than one image. Swiping between images only works at normal size, so dragging a zoomed image never jumps to the next one.
- [ ] Zoom resets when changing images and when closing.
- [ ] Caption and credit shown below the image.
- [ ] Pinching the image never zooms the rest of the app.

## Accessibility
- [ ] Every gesture has a button (WCAG 2.5.1).
- [ ] Keyboard: `+` / `-` zoom, arrow keys pan, `0` resets, Escape closes.
- [ ] The image keeps its `alt` text; the viewer has `role="dialog"` and a label.
- [ ] With **Reduce motion** on, zoom changes are instant, not animated.
- [ ] Focus returns to the tapped image when the viewer closes (`useDialog` does this).

## Notes
- Test on the kiosk's touchscreen early (`npm run dev:host`): touch behavior differs from a laptop trackpad.
- Size: about 3–4 days.
~~~~

---

## 4. Admin: event editor

**Labels:** `feature`, `admin`

~~~~markdown
## What and why
Museum staff need to add, edit, hide and remove timeline events on the kiosk without touching code.

## Where in the code
- New `src/routes/admin/Events.jsx` (list) and `src/routes/admin/EventEdit.jsx` (form), routes `/admin/events` and `/admin/events/:id` in `src/App.jsx`.
- A link to it from `src/routes/admin/Dashboard.jsx`.
- Save with `store.saveContent(newContent, session)`, where `store` comes from `useContent()` and `session` is `useKiosk((s) => s.adminToken)`. Then call `reload()`.
- Copy the sign-in check from `Dashboard.jsx` (`if (!token) return <Navigate to="/admin" replace />`).

## Done when
- [ ] List of all events grouped by era, with a search box and a "hidden" marker on unpublished events.
- [ ] Form fields: title, short title (for the timeline point, max 28 characters with a counter), sort date (YYYY-MM-DD), display date (like "1969" or "2030 and beyond"), status (historical / planned / ongoing), eras (checkboxes, at least one), summary, body (blank line between paragraphs), images (pick from the media library, reorder with up/down buttons), published on/off.
- [ ] New events get a unique id made from the date and title, like `evt-1969-apollo-11`.
- [ ] Clear messages for missing required fields, shown next to the field.
- [ ] Warns before leaving with unsaved changes.
- [ ] **Preview** opens the event on its era screen.
- [ ] Delete asks for confirmation and says how many quiz questions will be deleted with it.
- [ ] Planned and ongoing events show a **Needs review** marker if not reviewed in 90 days, with a **Mark reviewed** button (store the date in a new `reviewedAt` field).

## Accessibility
- [ ] Every field has a visible label connected with `htmlFor` / `id`.
- [ ] Errors are linked to their fields with `aria-describedby` and announced.
- [ ] Reordering works with buttons, not drag only.
- [ ] Usable with Android's on-screen keyboard on the kiosk: the field being typed in isn't hidden behind the keyboard.

## Notes
- Depends on the media library issue for uploading new images; until it's merged, pick from existing media.
- Size: about 5 days.
~~~~

---

## 5. Admin: media library and upload

**Labels:** `feature`, `admin`, `kiosk`

~~~~markdown
## What and why
Staff need to add photos and videos on the kiosk, with the alt text and captions that make them accessible.

## Where in the code
- New `src/routes/admin/Media.jsx`, route `/admin/media` in `src/App.jsx`, linked from the dashboard.
- Save file bytes with `store.openMediaWriter(fileName, session)`: call `write(bytes)` for each piece, then `close()`. It works in the browser (dev server) and on the kiosk. See how `src/lib/backup.js` uses it.
- Then add the media item to `content.media` and save with `store.saveContent(...)`.

## Done when
- [ ] Grid of all media with thumbnails, captions, and which events use each one.
- [ ] **Add media** with a file picker for images (JPEG, PNG, WebP) and MP4 video.
- [ ] Alt text is **required** for images; caption and credit fields for everything.
- [ ] Photos larger than 2560px on their longest side are shrunk in the browser before saving (`createImageBitmap` + `<canvas>`, JPEG quality ~0.85), so the kiosk never loads huge photos.
- [ ] Files are read and written in pieces (`file.slice(...)`), never all at once, so large videos don't run out of memory.
- [ ] File names are cleaned to letters, numbers, dashes and dots, and made unique.
- [ ] Videos: a field for the captions file (.vtt), a poster image, and a warning for files over 300 MB.
- [ ] Media items get a `type` field (`"image"` or `"video"`). Agree on the exact video fields with the video player owner.
- [ ] Delete is only allowed for media no event uses; otherwise it lists the events using it.

## Accessibility
- [ ] The form explains what good alt text is, in one line ("Describe what the image shows, as you would to someone who can't see it").
- [ ] All controls are labelled buttons and fields; the grid works with the keyboard.

## Notes
- On the kiosk, the file picker opens Android's file chooser, so staff can pick from a USB drive or Downloads.
- Size: about 4–5 days.
~~~~

---

## 6. Admin: question editor

**Labels:** `feature`, `admin`

~~~~markdown
## What and why
Staff and museum educators write the quiz questions for each event. Questions belong to events, and the timeline challenge draws from all of them.

## Where in the code
- A **Quiz questions** section on the event edit screen (`src/routes/admin/EventEdit.jsx` from the event editor issue), or a separate `/admin/questions` screen if that's merged first. Agree with the event editor owner.
- Questions live in `content.questions`, each with `id`, `eventId`, `prompt`, `choices`, `correctIndex`, `explanation`.

## Done when
- [ ] List an event's questions, add, edit, reorder (up/down buttons) and delete (with confirmation).
- [ ] Prompt, 2 to 4 choices, exactly one marked correct (radio buttons), and a required explanation.
- [ ] Can't save a question that breaks those rules; the message says what to fix.
- [ ] A preview shows the question the way visitors will see it.
- [ ] The dashboard shows which eras have no questions yet (the timeline challenge skips those eras).

## Accessibility
- [ ] Labels on every field; "correct answer" radios grouped in a `fieldset` with a `legend`.
- [ ] Reminder text for writers: questions must make sense on their own, without reading other events.

## Notes
- Size: about 3 days.
~~~~

---

## 7. Admin: era editor and settings

**Labels:** `feature`, `admin`

~~~~markdown
## What and why
Staff can adjust the eras (names, years, order) and kiosk settings, and change the admin PIN.

## Where in the code
- New `src/routes/admin/Eras.jsx` (`/admin/eras`); move and extend the settings section of `src/routes/admin/Dashboard.jsx`.
- PIN: `store.setPin(pin)` after checking the current PIN with `store.signIn(currentPin)`. In the browser (dev server) the PIN comes from `.env`, so show a note instead.

## Done when
**Eras**
- [ ] Edit title, subtitle, start year, end year (blank means "Today").
- [ ] Reorder with up/down buttons; add a new era.
- [ ] An era that still has events can't be deleted; the message lists them.

**Settings**
- [ ] Idle seconds, warning seconds, credits text (About screen), attract video (picked from video media).
- [ ] **Change PIN:** current PIN, new PIN twice, 4–8 digits.

## Accessibility
- [ ] Labelled fields, button-based reordering, clear error messages.

## Notes
- Size: about 3 days.
~~~~

---

## 8. Video player and attract loop

**Labels:** `feature`, `accessibility`, `kiosk`

~~~~markdown
## What and why
Events can include videos, which must have captions. The attract screen can play a muted looping video to draw visitors in.

## Where in the code
- New `src/components/VideoPlayer.jsx`, used in `src/components/EventPanel.jsx` for media with `type: "video"`.
- `src/routes/Attract.jsx` for the background video, from `content.settings.attractVideo`.
- Idle timer: `addBusy()` / `removeBusy()` from `useKiosk`.

## Done when
- [ ] Captions from the media item's .vtt file through `<track kind="captions" srclang="en" default>`, **on by default**.
- [ ] Large custom controls in the lower area: play/pause, restart, captions on/off.
- [ ] Shows the poster image before playing.
- [ ] Never autoplays with sound.
- [ ] While playing, the kiosk isn't idle: `addBusy()` on play, `removeBusy()` on pause, end, and when the player closes or unmounts (use a cleanup function so it can never get stuck "busy").
- [ ] Attract screen: muted, looping background video behind the content when one is set; otherwise the current background.
- [ ] With **Reduce motion** on, the attract screen shows the poster still image instead of the video.

## Accessibility
- [ ] Every video has captions; the media library should require them (agree with its owner).
- [ ] Controls are labelled buttons, keyboard operable, with visible focus.
- [ ] Caption text is large enough to read at 43" (style `::cue`).

## Notes
- Video format guidance for the museum: H.264 MP4, 1080p.
- Agree on the video fields (`captionsFile`, `poster`) with the media library owner.
- Size: about 4 days.
~~~~

---

## 9. Read aloud

**Labels:** `feature`, `accessibility`, `kiosk`

~~~~markdown
## What and why
Visitors who can't read the screen easily can turn on **Read aloud** in the Accessibility panel and have event text and quiz questions spoken.

## Where in the code
- New `src/lib/speech.js` with `speak(text)` and `stop()`: on the kiosk it uses a Capacitor text-to-speech plugin (`@capacitor-community/text-to-speech`); in a browser it uses `window.speechSynthesis`. Use `isDevice` from `src/lib/store/index.js` to choose.
- The **Read aloud** toggle in `src/components/A11yPanel.jsx` (currently disabled) and a setting in `src/store/useKiosk.js` (reset with the other visitor settings).
- **Read aloud** buttons in `EventPanel.jsx` and the quiz.

## Done when
- [ ] The toggle turns the mode on; then **Read aloud** buttons appear on event panels and quiz questions.
- [ ] Reads the title, summary and body (or the question and its choices).
- [ ] Speech stops when the panel closes, the visitor navigates, or the kiosk resets.
- [ ] Works on the kiosk with no internet (offline voice installed during setup).
- [ ] Add the voice setup steps to `docs/ANDROID.md`.

## Notes
- First check the plugin supports Capacitor 8. If it doesn't, tell Windie before picking a different one.
- After installing a plugin, run `npm run android:sync`.
- Size: about 3 days.
~~~~

---

## 10. Accessibility testing

**Labels:** `accessibility`

~~~~markdown
## What and why
Automated checks catch common accessibility mistakes on every pull request, so reviewers can focus on what only people can judge.

## Where in the code
- ESLint with `eslint-plugin-jsx-a11y` and `eslint-plugin-react-hooks`; a `npm run lint` script.
- Playwright tests with `@axe-core/playwright` in a new `tests/` folder.
- Add both to `.github/workflows/ci.yml`.

## Done when
- [ ] `npm run lint` passes on the current code (fix what it finds, or discuss real exceptions).
- [ ] Playwright opens every visitor screen at 1920×1080 and fails on axe "serious" or "critical" problems.
- [ ] The same tests run with **High contrast** and **Larger text** turned on.
- [ ] One keyboard test: Tab through the era overview into an event and back out with Escape.
- [ ] CI runs lint and the tests on every pull request; the README explains how to run them locally.

## Notes
- Start the app for tests with `npm run build` then `npm start` (serves on :5050).
- Size: about 3 days.
~~~~

---

## Later: Visual refresh (Windie, week 3)

**Labels:** `feature` · no milestone

~~~~markdown
## What and why
Once the brand colors arrive and the core features work, give the kiosk a modern look: full-bleed era photography, smooth transitions, depth and texture, and stronger type contrast.

## Done when
- [ ] Brand colors in `src/styles/theme.css`, passing `npm run check:contrast`.
- [ ] Era screens use photography behind the titles, with text kept readable.
- [ ] Transitions between eras and for the event panel, all off with Reduce motion.
- [ ] Checked on the kiosk itself.
~~~~
