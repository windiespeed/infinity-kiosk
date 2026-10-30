// Companion store: used by the public GitHub Pages build (VITE_COMPANION=true).
// Read-only. Content is a copy of data/content.json bundled at build time.
// There is no server, no device storage and no admin access.
import seed from "../../../data/content.json";

// Every file in data/media/, bundled into the site so photos show. Keyed by file name.
const files = import.meta.glob("../../../data/media/*", { eager: true, query: "?url", import: "default" });
const urlByName = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1), url]),
);

const readOnly = (what) => () => {
  throw new Error(`${what} is not available on the companion site.`);
};

export function createStaticStore() {
  return {
    kind: "static",

    async init() {},

    async loadContent() {
      return structuredClone(seed);
    },

    saveContent: readOnly("Saving content"),

    mediaUrl: (item) => urlByName[item.file] ?? "",

    // No admin here: the sign-in screen shows, but no PIN works and none can be created.
    async hasPin() {
      return true;
    },
    setPin: readOnly("Setting a PIN"),
    async signIn() {
      return null;
    },
    async signOut() {},

    openMediaWriter: readOnly("Uploading media"),
    deleteMedia: readOnly("Deleting media"),
    openBackupWriter: readOnly("Backups"),
  };
}