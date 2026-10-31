// The content store: the ONE place the app loads and saves content, media, and the PIN.
//
// Three versions share the same functions, so screens never care which one is running:
// - serverStore: in a normal browser during development (talks to server/index.js)
// - deviceStore: inside the Android app on the kiosk (saves to the kiosk's own storage)
// - staticStore: the public companion site on GitHub Pages (read-only, bundled content
//   and photos, no admin), built with `npm run build:pages`
//
// Every store has:
//   init(), loadContent(), saveContent(content, session), mediaUrl(item),
//   hasPin(), setPin(pin), signIn(pin) -> session or null, signOut(session),
//   hasRecoveryCode(), newRecoveryCode() -> code, checkRecoveryCode(code), resetPin(code, pin) -> bool
//   (recovery codes work only on the kiosk), openMediaWriter(name, session), deleteMedia(name, session), openBackupWriter(name)
//   (writers have write(Uint8Array) and close())
import { Capacitor } from "@capacitor/core";

export const isCompanion = import.meta.env.VITE_COMPANION === "true";
export const isDevice = !isCompanion && Capacitor.isNativePlatform();

let storePromise;
export function getStore() {
  storePromise ??= (async () => {
    let store;
    if (isCompanion) {
      const mod = await import("./staticStore.js");
      store = mod.createStaticStore();
    } else if (isDevice) {
      const mod = await import("./deviceStore.js");
      store = mod.createDeviceStore();
    } else {
      const mod = await import("./serverStore.js");
      store = mod.createServerStore();
    }
    await store.init();

    return store;
  })();
  return storePromise;
}

// The content rules live in lib/content.js so the dev server can use them too.
export { SAFE_NAME, validateContent } from "../content.js";
