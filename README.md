# Infinity Science Center Kiosk

Interactive spaceflight timeline kiosk for the Infinity Science Center, built by
Mississippi Coding Academies technologists. React + Vite + Tailwind CSS, with a small
local Node server so it runs fully offline on the kiosk.

## Get it running

You need **Node.js 22 LTS (22.22 or newer)** and **Git**.

```bash
npm install      # first time only: downloads the libraries
npm run dev      # starts the app and the local server
```

Open **http://localhost:5173**. Saving a file updates the browser automatically.

- Admin screen: tap the **top-left corner 5 times quickly**. Development PIN: `1234`.
  Kiosk PIN, recovery code and admin sign-out time: **docs/ADMIN-PIN.md**.
  Plain-language guide for museum staff: **docs/STAFF-GUIDE.md**.
- On a desktop, drag the browser narrow to see the phone layout.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development: app on :5173, server on :5050 |
| `npm run dev:host` | Same, but reachable from other devices on your network (for testing on the kiosk's browser) |
| `npm run build` | Checks color contrast and the content, then builds the app into `dist/` |
| `npm run build:pages` | Builds the read-only companion site for GitHub Pages into `dist/` |
| `npm run qr` | Makes printable certificate QR codes (one per era, plus the whole timeline) in `qr-codes/`; open `qr-codes/print.html` to print. Add `-- --site https://...` to use another address |
| `npm start` | Runs the server alone, serving the built app at http://localhost:5050 (handy for testing a build in a browser; the kiosk itself runs the Android app) |
| `npm run check:contrast` | Tests every color pairing in the theme against WCAG AA |
| `npm run check:content` | Checks `data/content.json` against the same rules the admin screens use before saving (it's built into the APK as the first-launch content) |
| `npm run make-stars` | Remakes the starfield background (see docs/STARFIELD.md) |
| `npm run hash-pin -- 482913` | Makes a PIN hash to paste into `.env` (dev server only) |
| `npm run media:pull` | Copies photos and videos from the Drive Media folder into `data/media/` (for later, when media leaves Git) |
| `npm run android:sync` | Builds the app and copies it into the Android project |
| `npm run android:open` | Opens the Android project in Android Studio |
| `npm run android:run` | Builds the app, installs it on a plugged-in device or open emulator, and opens it |
| `npm run android:dev` | Same, with live reload: saved changes appear on the device without rebuilding |

## Where things live

```
data/
  content.json        All eras, events, images, and quiz questions (the "database")
  media/              Timeline photos and videos (in Git for now; see "Where media lives")
  backups/            Automatic copies made before every admin save (not in Git)
server/index.js       Development server: content, media, admin sign-in and saving (not used on the kiosk)
android/              The Android app project (Capacitor). See docs/ANDROID.md
docs/                 Guides: ANDROID (build and install), KIOSK-LOCK, ADMIN-PIN, STAFF-GUIDE, STARFIELD, GIT-CHEATSHEET
scripts/              Contrast and content checks, PIN hasher, QR codes, starfield, media pull, Android run script
src/
  assets/             App design images that code imports (welcome photos, logos, starfield)
  styles/theme.css    ALL colors and fonts. Change brand colors here only.
  store/useKiosk.js   Visitor settings (text size, contrast, etc.), reset by Start over or when idle
  hooks/              useContent (loads content), useIdleTimer, useDialog (focus handling), useAdmin, useStartOver
  lib/store/          Content store: dev server in a browser, kiosk storage in the Android app, read-only for the web preview
  lib/backup.js       Backup zip export/import (also how content moves onto the kiosk)
  lib/certificate.js  QR certificate link and quiz names
  components/         Bottom nav, accessibility panel, idle prompt, event panel, image viewer, video player
  components/admin/   Admin menu and sign-out timer, form fields, media picker, quiz question editor
  routes/             One file per screen; admin screens in routes/admin/
```

## Rules of the road

1. **Colors only come from theme tokens** (`bg-surface`, `text-on-accent`, …). Tailwind's default colors are switched off on purpose. New color? Add a token in `theme.css` and a pairing in `scripts/check-contrast.mjs`.
2. **Size things in rem** (Tailwind's normal classes do this). The whole UI scales from one number in `theme.css`: 28px on the kiosk, 16px on phones.
3. **Everything interactive goes in the lower part of the screen** (ADA reach range).
   Touch targets use `buttonClass()` from `src/lib/ui.js`, which keeps them big enough.
4. **Every gesture needs a button too** (swipe, pinch, etc.), and every screen must work with a keyboard. Test with Tab, Enter, and Escape.
5. **Every screen must make sense on its own.** Visitors walk up mid-session.
6. **Never color alone** for meaning: pair it with an icon or text.
7. Work on a branch, open a pull request, get a review. Don't push to `main`.

## What's built

Everything from the original issue list is done: the timeline and era screens, event panels
with a photo carousel, image library and zoom viewer, quizzes (one per era, plus the whole
timeline from the Quiz button on the home screen), the QR certificate, read aloud,
accessibility settings, the welcome screen video, and the admin editors for events, quiz
questions, media, eras and settings, with backups.

- **QR certificate**: after a quiz, the kiosk shows a QR code to `<site>/certificate?d=<date>&era=<eraId>` (no `era` = the whole-timeline challenge). The phone page reads the era's title from the content, so new eras need no code. The site address is in Admin > Settings (default in `src/lib/certificate.js`). Print codes with `npm run qr`.
- **Still open:** automated accessibility tests (`eslint-plugin-jsx-a11y`, Playwright + axe) and a linter.

The old issue texts are kept in `docs/github-issues.md` and `docs/github-issues-launch.md` for reference.

Keeping your branch up to date with `main`: see **docs/GIT-CHEATSHEET.md**.

## Live web preview

Every merge to `main` publishes a read-only copy of the app to
**https://windiespeed.github.io/infinity-kiosk/** (the "companion site"), so anyone can click through the current content and photos in a browser. Nothing can be saved there and the admin screens don't work. It's public, like the repo. The workflow is `.github/workflows/pages.yml`.

**If the repo moves to another GitHub account or organization**, this address changes to `https://<new-owner>.github.io/infinity-kiosk/`, and GitHub does **not** redirect the old one. Since November 2026 the kiosk's QR codes point to mscoding.org (the certificate at `https://mscoding.org/ISCProject/certificate`, the team at `https://mscoding.org/ISCProject#team`), so a move only matters if staff point them back here. Right after a move:

1. In the moved repo, turn Pages back on: **Settings → Pages → Source: GitHub Actions**, then re-run the Pages workflow.
2. On the kiosk, set **Admin → Settings → Companion website** to the new address (no app update needed).
3. Change `DEFAULT_CERTIFICATE_SITE` in `src/lib/certificate.js` and the address above, and reprint any QR codes made with `npm run qr`.

## Where media lives

**Photos live in GitHub** (decided October 31, 2026; they're public domain NASA photos), so everyone gets the same photos with a normal `git pull`. Keep the two kinds apart:

- **`src/assets/`**: images that are part of the app's design and that code imports directly (the welcome screen photos, the logos, the starfield).
- **`data/media/`**: photos and videos shown in the timeline, the image library and event panels. `content.json` points to them by file name, so the name must match exactly.

To add a timeline photo: put it in `data/media/`, add it to `content.json` (or through the admin screen), log it in the media tracker, then commit and open a pull request like any other change.

Keep files small: photos around 1–2 MB. GitHub rejects any single file over 100 MB, so **videos stay out of Git** apart from the welcome video already there (`data/media/vid-stennis-overview.mp4`). Add other videos on the kiosk through **Admin → Media**; they travel in backup zips. Never `import` an `.mp4` in code. The repo is public, so only add media that is cleared to show publicly (hold back anything still waiting on museum review).

`npm run media:pull` still works if media ever moves back to the shared Google Drive **Media** folder: it copies new and changed files from a Google Drive for desktop copy of that folder into `data/media/` (see `MEDIA_DRIVE_DIR` in `.env.example`).

**Kiosk backups:** the kiosk gets its content as a backup zip (admin dashboard: Export backup / Import backup). Keep exported zips in the Drive's **Media/Kiosk-Backups** folder with the date in the file name; the newest one is what the kiosk shows. Your own `data/backups/` folder only holds automatic copies of your own saves; it appears after your first admin save.

## How the kiosk runs

The kiosk is a 43" Android 13 touchscreen running this project as an Android app (APK), fully offline. Content, media and the admin PIN live on the kiosk. Content moves between a laptop and the kiosk as a backup zip (admin dashboard: Export backup / Import backup).

Build and setup steps: **docs/ANDROID.md**. Keeping visitors inside the app: **docs/KIOSK-LOCK.md**.

**Which content is the master copy:** until the kiosk is installed, `data/content.json` in this repo is. After installation (November 4, 2026) the kiosk is: staff edit content on the kiosk's admin screens (see **docs/STAFF-GUIDE.md**) and export a backup after each round of changes. Edits made to `data/content.json` after that only reach the kiosk if someone imports a backup made from them, which replaces the kiosk's content.
In a browser, the app talks to the development server instead, so everything can be built and tested without the kiosk. Screens never need to know which one is running; they use the content store (`src/lib/store/`).
