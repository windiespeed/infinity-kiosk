# Kiosk lock (lock task mode)

The kiosk lock keeps visitors inside the app. Once it's on:

- The app pins itself. There's no status bar, notification shade, Home or Recents button,
  and no power menu, so visitors can't leave the app or reach Android's settings.
- The app is always the Home app, and it opens by itself when the kiosk starts.
- The lock screen is skipped.

Staff can switch it off for maintenance from **Admin → Settings → Kiosk lock**.

Without this setup the app works as before: it hides Android's bars and ignores Back,
but a visitor who swipes in from the edge can still reach Recents and the settings shade.

## One-time setup

This makes the app the kiosk's **device owner**, which is what Android requires before an
app can lock the screen to itself. You need the computer that builds the APK (it has
Android Studio), a USB cable, and about 20 minutes.

1. **Back up the content.** In kiosk admin, tap **Export backup** and copy the zip off the
   kiosk.
2. **Install the app version that includes the kiosk lock** (1.2 or later, built from
   this repo after the kiosk lock was added), the usual way.
3. **Remove every account from the kiosk.** Go to **Settings → Passwords & accounts** (or
   **Accounts**) and remove each one, such as a Google account. Android refuses to set a
   device owner while any account is signed in. Also remove any extra users or the guest
   user under **Settings → System → Multiple users**.
4. **Turn on USB debugging.** Go to **Settings → About tablet** and tap **Build number**
   7 times, until it says you're a developer. Then go to **Settings → System → Developer
   options** and turn on **USB debugging**.
5. **Connect the kiosk to the computer** with a USB cable.
6. **On the computer**, open PowerShell (or Android Studio's **Terminal** tab) and run:

   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
   ```

   The kiosk asks **Allow USB debugging?** Tick **Always allow** and tap **Allow**. Run the
   command again: it should list one device followed by `device`.
7. **Make the app the device owner:**

   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell dpm set-device-owner org.infinityscience.kiosk/.KioskAdminReceiver
   ```

   It should answer `Success: Device owner set to package org.infinityscience.kiosk`.
8. **Open Infinity Kiosk.** It locks itself. Check **Admin → Settings → Kiosk lock**: it
   should say **Locked**.
9. **Restart the kiosk** and check that it opens straight into the app, and that swiping
   from the edges doesn't bring up Android's bars or buttons.
10. Optional: unlock for maintenance (below), turn **USB debugging** off, then lock again.

### If step 7 fails

| Message | What to do |
|---|---|
| `...there are already some accounts on the device` | Remove the accounts (step 3), then run step 7 again. If none are listed in Settings, the kiosk maker added a hidden one: the only way out is a factory reset (below). |
| `...there are already several users on the device` | Remove extra users and the guest user (step 3). |
| `...device is already provisioned` | Factory reset (below). |
| `Unknown admin` or `Bad admin` | The installed app is older than the kiosk lock. Install the newer APK (step 2). |

**Factory reset** (**Settings → System → Reset options → Erase all data**) erases
everything on the kiosk, including the app. Afterwards, skip signing in to a Google
account during Android's setup, then install the app, import the backup from step 1, and
start again at step 4.

## Day to day

### Installing an app update

1. **Admin → Settings → Kiosk lock → Unlock for maintenance.**
2. Press **Home**. Android's own home screen appears, so you can open **Files**.
3. Install the new APK from the USB drive (**Update**, never Uninstall).
4. Open Infinity Kiosk. It locks itself again.

Restarting the kiosk also ends maintenance, so a kiosk left unlocked by accident locks
itself at the next restart.

### Removing the lock

**Admin → Settings → Kiosk lock → Remove the kiosk lock** turns it off for good, and the
app stops being the device owner. Turning it back on means running steps 3 to 8 again.

## Good to know

- While the app is the device owner, Android won't let anyone uninstall it or **Clear
  storage** from Settings. A content problem after an update is fixed on the app's own
  **This update isn't finished** screen with the staff PIN.
- Keep the PIN and the recovery code safe (docs/ADMIN-PIN.md). If both are lost while the
  kiosk is locked, the only way back into admin is a factory reset.
- Code: `android/app/src/main/java/org/infinityscience/kiosk/KioskLock.java` (the lock),
  `KioskAdminReceiver.java` (device owner), `BootReceiver.java` (opens the app at startup),
  `KioskLockPlugin.java` and `src/lib/kioskLock.js` (the Settings panel).
