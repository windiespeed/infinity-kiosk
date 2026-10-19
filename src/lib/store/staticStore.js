// Companion store: used by the public GitHub Pages build (VITE_COMPANION=true).
// Read-only. Content is a copy of data/content.json bundled at build time.
// There is no server, no device storage and no admin access.
import seed from "../../../data/content.json";

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

    // The companion doesn't ship the media folder. Nothing on it shows media.
    mediaUrl: () => "",

    // No admin here: no PIN is set, and no one can sign in.
    async hasPin() {
      return false;
    },
    setPin: readOnly("Setting a PIN"),
    async signIn() {
      return null;
    },
    async signOut() {},

    openMediaWriter: readOnly("Uploading media"),
    openBackupWriter: readOnly("Backups"),
  };
}