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
- On a desktop, drag the browser narrow to see the phone layout.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development: app on :5173, server on :5050 |
| `npm run build` | Checks color contrast, then builds the app into `dist/` |
| `npm start` | Runs the server alone, serving the built app at http://localhost:5050 (this is what the kiosk runs) |
| `npm run check:contrast` | Tests every color pairing in the theme against WCAG AA |
| `npm run hash-pin -- 482913` | Makes a PIN hash to paste into `.env` |

## Where things live

```
data/
  content.json        All eras, events, images, and quiz questions (the "database")
  media/              Images and videos. Only sample-* files are in Git.
  backups/            Automatic copies made before every admin save (not in Git)
server/index.js       Local server: serves the app, content, media; admin sign-in and saving
scripts/              Contrast checker and PIN hasher
src/
  styles/theme.css    ALL colors and fonts. Change brand colors here only.
  store/useKiosk.js   Visitor settings (text size, contrast, etc.), reset when idle
  hooks/              useContent (loads content), useIdleTimer, useDialog (focus handling)
  components/         Bottom nav, accessibility panel, idle prompt, event panel
  routes/             One file per screen; admin screens in routes/admin/
```

## Rules of the road

1. **Colors only come from theme tokens** (`bg-surface`, `text-on-accent`, …). Tailwind's
   default colors are switched off on purpose. New color? Add a token in `theme.css` and a
   pairing in `scripts/check-contrast.mjs`.
2. **Size things in rem** (Tailwind's normal classes do this). The whole UI scales from one
   number in `theme.css`: 28px on the kiosk, 16px on phones.
3. **Everything interactive goes in the lower part of the screen** (ADA reach range).
   Touch targets use `buttonClass()` from `src/lib/ui.js`, which keeps them big enough.
4. **Every gesture needs a button too** (swipe, pinch, etc.), and every screen must work with
   a keyboard. Test with Tab, Enter, and Escape.
5. **Every screen must make sense on its own.** Visitors walk up mid-session.
6. **Never color alone** for meaning: pair it with an icon or text.
7. Work on a branch, open a pull request, get a review. Don't push to `main`.

## Suggested first issues

- **Quiz** (`routes/Quiz.jsx`): event quiz, timeline challenge (one question per era), retry with explanations
- **QR certificate**: completion screen with `qrcode.react`, plus the companion-site certificate page
- **Image viewer**: full-screen viewer with zoom (`react-zoom-pan-pinch`), used by library and event panel
- **Media pipeline** (server): uploads, thumbnail/display/zoom sizes with `sharp`
- **Admin editors**: events, questions, eras, media; backup/restore; "planned events need review" flag
- **Attract loop**: background video from `content.settings.attractVideo`
- **Read aloud**: audio mode with `window.speechSynthesis`
- **Video player**: captions (`<track>`), mark the kiosk busy while playing (`addBusy`/`removeBusy`)
- **Accessibility testing**: `eslint-plugin-jsx-a11y` and Playwright + axe tests
- **Kiosk setup guide**: Windows service for the server, Edge kiosk mode, Assigned Access

## Before it goes on the kiosk

- Copy `.env.example` to `.env` and set `ADMIN_PIN_HASH` (never leave the dev PIN).
- Replace placeholder content and sample images in `data/`.
- Run `npm run build`, then `npm start`, and point Edge kiosk mode at http://localhost:5050.
