# Staff PIN, recovery code and sign-out

How staff get into the admin screens on the kiosk, what to do if the PIN is forgotten,
and the settings that go with it.

## Signing in

Tap the **top-left corner of the screen 5 times quickly**. The staff sign-in keypad opens.
Enter the PIN and tap **Enter**. **Cancel** goes back to the welcome screen.

## The first PIN (new kiosk)

The first time admin is opened on a kiosk, there is no PIN yet:

1. The keypad says **Create a staff PIN**. Enter 4 to 8 digits and tap **Enter**.
2. Enter the same PIN again.
3. The kiosk shows a **recovery code** (12 digits, like `7959 2951 9634`). Write it down
   and keep it somewhere safe, away from the kiosk (for example in the team's password
   manager). It is shown only this once.
4. Tap **I've written it down**. You're signed in.

## The recovery code

The recovery code lets staff choose a new PIN if the PIN is forgotten, **without losing
any content, photos or settings**.

- Each code works **once**. After it's used, the kiosk shows a new code.
- Only a scrambled (hashed) copy is kept on the kiosk, so the kiosk can't show an old
  code again. If it's lost, make a new one (below).
- A kiosk set up before recovery codes existed (before October 31, 2026) has none.
  Make one in **Admin → Settings → Recovery code**.

### If the PIN is forgotten

1. Open the sign-in keypad (top-left corner, 5 taps).
2. Tap **Forgot the PIN?** This button only appears when the kiosk has a recovery code.
3. Enter the 12-digit recovery code and tap **Enter**.
4. Choose a new PIN and enter it twice.
5. Write down the **new** recovery code the kiosk shows, then tap **I've written it down**.

If both the PIN and the recovery code are lost, the only way back in is
**Android Settings → Apps → Infinity Kiosk → Storage → Clear data**. This **erases all
content** on the kiosk. Open the app, create a new PIN, then import the latest backup zip
(see docs/ANDROID.md). Keep backups current for this reason.

## Admin → Settings

| Setting | What it does |
|---|---|
| **Change the staff PIN** | Enter the current PIN, then the new PIN twice. The recovery code stays the same. |
| **Recovery code** | Says whether the kiosk has a code. **Make a recovery code** (or **Make a new recovery code**) shows a new code once. The old code stops working. Use this if the code was lost, or someone who shouldn't have it has seen it. |
| **Minutes before staff are signed out** | 5 to 30 (default 10). Counts from the last touch on an admin screen. During the last minute a "Still working?" warning shows. **Stay signed in** resets the timer. Unsaved changes are lost when staff are signed out. Uploads in progress keep the timer from running out. |

The visitor settings on the same screen (**Seconds before "Are you still exploring?"** and
**Seconds of warning before starting over**) only apply to visitor screens. The visitor
timer is off while staff are in admin.

**Exit admin** (bottom of the admin menu) signs out right away and returns to the welcome
screen.

## On a developer's computer

The PIN and recovery code above are kiosk-only. In a browser on a laptop (`npm run dev`
or `npm start`), the PIN comes from the development server instead:

- With no `.env` file, or with `ADMIN_PIN_HASH` blank, the PIN is **`1234`**.
- For a different PIN, copy `.env.example` to `.env`, run `npm run hash-pin -- 482913`
  (with your digits), and paste the printed `ADMIN_PIN_HASH=…` line into `.env`.
- There is no recovery code, and **Change the staff PIN** doesn't apply there.
- The GitHub Pages preview has no admin at all.

## How it's stored (for developers)

- PIN and recovery code are saved with PBKDF2-SHA256 (210,000 rounds, random salt) in
  the app's settings (Capacitor Preferences, keys `pinHash` and `recoveryHash`). The
  digits themselves are never stored. Code: `src/lib/pin.js`, `src/lib/store/deviceStore.js`.
- Updating the app (installing a new APK over the old one) keeps the PIN and the code.
  Uninstalling the app or clearing its data removes them, along with all content.
- The sign-out time is `settings.adminIdleMinutes` in the content, so it travels with
  backups. Code: `src/components/admin/AdminLayout.jsx`.
