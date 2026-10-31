// The kiosk lock (Android lock task mode), from the app's own native code
// (android/.../KioskLock.java). It only works inside the Android app, and only after
// the one-time device owner setup in docs/KIOSK-LOCK.md.
// Each call returns { deviceOwner, locked, maintenance }.
import { registerPlugin } from "@capacitor/core";
import { isDevice } from "./store/index.js";

const KioskLock = registerPlugin("KioskLock");

// null when there's no kiosk lock to show (a browser, or an app built before it existed).
export async function kioskLockStatus() {
  if (!isDevice) return null;
  try {
    return await KioskLock.getStatus();
  } catch {
    return null;
  }
}

export const unlockKiosk = () => KioskLock.unlock();
export const lockKiosk = () => KioskLock.lock();
export const removeKioskLock = () => KioskLock.remove();
