# Building and installing the kiosk app (Android)

The kiosk runs the app as an Android app (APK) built with Capacitor. It works fully
offline: content, media and the admin PIN live on the kiosk itself.

Day-to-day development still happens in a normal browser with `npm run dev`.
You only build the APK to test on the kiosk or to install a new version.

## One-time setup (the computer that builds the APK)

1. Install **Android Studio** from developer.android.com/studio. It includes Java and
   the Android SDK. It's a large download.
2. Open Android Studio once and let it finish downloading its components.

## Build a test version

```bash
npm run android:sync     # builds the web app and copies it into the Android project
npm run android:open     # opens the Android project in Android Studio
```

In Android Studio, wait for "Gradle sync" to finish (bottom status bar), then use
the **Build** menu to build an APK. Menu wording changes between versions; look for
**Build APK(s)** or **Generate APKs**. The debug APK lands in
`android/app/build/outputs/apk/debug/`.

Run `npm run android:sync` again every time the web code changes, before building.

## Build the real kiosk version (signed)

The kiosk must always get APKs signed with the **same key**, or Android refuses to
update the app, and uninstalling it erases all content. So:

1. In Android Studio: **Build → Generate Signed App Bundle or APK → APK**.
2. The first time, choose **Create new…** to make a keystore. Save the keystore file
   and both passwords in a password manager. **Never commit the keystore to GitHub**
   (`.gitignore` blocks `*.jks` and `*.keystore`, but don't rely on that alone).
3. Choose the **release** build. The APK lands in `android/app/release/`.

Use only release APKs on the kiosk. A debug APK is signed with a different key, so
switching between debug and release on the kiosk fails.

## Install on the kiosk

- **USB drive:** copy the APK to a USB drive, open it in the kiosk's Files app, tap it,
  allow installing from that source when asked, then tap **Install** (or **Update**).
- **From a computer:** with USB debugging on, `adb install -r app-release.apk`
  (`-r` keeps the app's data).

## First-time kiosk setup

1. Open **Infinity Kiosk**.
2. Make it the Home app: **Settings → Apps → Default apps → Home app → Infinity Kiosk**
   (wording varies by device). It then opens automatically at startup, and the
   Home button returns to it.
3. Tap the top-left corner 5 times quickly. The kiosk asks you to **create a staff PIN**
   (4–8 digits). Save it in a password manager: it can't be recovered.
4. In the admin dashboard, **Import backup…** and pick the content backup zip.
5. Tap through every screen, then **Export backup** and copy the file off the kiosk.

## Updating

- **Content:** prepare it on a laptop (browser admin), **Export backup**, copy the zip
  to the kiosk, **Import backup**. Or edit directly on the kiosk.
- **App:** build a new signed release APK with the same key and install it over the
  old one. Content and the PIN are kept.

## Where things live on the kiosk

| What | Where |
|---|---|
| Content, media, previous content versions | The app's private storage (erased only if the app is uninstalled or its data is cleared) |
| Exported backups | `Documents/InfinityKiosk/` (copy these off the kiosk by USB) |
| Admin PIN | Stored as a salted hash in the app's settings |

## If the PIN is forgotten

The only fix is **Settings → Apps → Infinity Kiosk → Storage → Clear data**, which
also erases all content. Then open the app, create a new PIN, and import the latest
backup. This is why regular backups matter.

## Debugging on the kiosk

With a debug build and USB debugging on, open `chrome://inspect` in Chrome on your
computer to see the kiosk app's console and inspect its screens.

## Not done yet

- Read-aloud mode (needs a native text-to-speech plugin)
- Android lock task mode (strongest lockdown; needs a one-time device-owner setup)
- Remote updates (only if the kiosk gets internet access)
