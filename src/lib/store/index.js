// The content store: the ONE place the app loads and saves content, media, and the PIN.
//
// Two versions share the same functions, so screens never care which one is running:
// - serverStore: in a normal browser during development (talks to server/index.js)
// - deviceStore: inside the Android app on the kiosk (saves to the kiosk's own storage)
//
// Every store has:
//   init(), loadContent(), saveContent(content, session), mediaUrl(item),
//   hasPin(), setPin(pin), signIn(pin) -> session or null, signOut(session),
//   openMediaWriter(name, session), openBackupWriter(name)
//   (writers have write(Uint8Array) and close())
import { Capacitor } from "@capacitor/core";

export const isDevice = Capacitor.isNativePlatform();

let storePromise;
export function getStore() {
  storePromise ??= (async () => {
    const mod = isDevice ? await import("./deviceStore.js") : await import("./serverStore.js");
    const store = isDevice ? mod.createDeviceStore() : mod.createServerStore();
    await store.init();
    return store;
  })();
  return storePromise;
}

export function validateContent(c) {
  if (!c || typeof c !== "object") return "Content must be an object.";
  for (const key of ["eras", "events", "media", "questions"]) {
    if (!Array.isArray(c[key])) return `Content is missing the "${key}" list.`;
  }
  return null;
}

// Media file names must be plain names: no folders, no "..".
export const SAFE_NAME = /^[\w][\w.-]{0,199}$/;
