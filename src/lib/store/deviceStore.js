// Kiosk store: used inside the Android app. Everything lives on the kiosk itself:
//   content.json          the current content
//   media/                images and videos
//   backups/              the last 10 versions of content.json (automatic)
// in the app's private storage, plus the admin PIN hash in Preferences.
// Backup zips are written to the kiosk's public Documents/InfinityKiosk folder.
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";
import seed from "../../../data/content.json";
import { hashPin, verifyPin, isValidPin, makeRecoveryCode } from "../pin.js";
import { SAFE_NAME, validateContent } from "../content.js";

const DATA = Directory.Data;
const MAX_VERSIONS = 10;
const WRITE_CHUNK = 2 * 1024 * 1024; // write to disk in ~2 MB pieces to keep memory low

// Timeline media ships inside the app (media lives in Git for now), so the first launch shows real photos.
const bundled = import.meta.glob("../../../data/media/*", { eager: true, query: "?url", import: "default" });
const bundledByName = Object.fromEntries(Object.entries(bundled).map(([path, url]) => [path.split("/").pop(), url]));

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// Streams bytes into a file: the first piece creates it, later pieces append.
function fileWriter(directory, path, onDone, label) {
  let buffer = [];
  let buffered = 0;
  let started = false;

  const flush = async () => {
    if (!buffered && started) return;
    const bytes = new Uint8Array(buffered);
    let offset = 0;
    for (const part of buffer) {
      bytes.set(part, offset);
      offset += part.length;
    }
    buffer = [];
    buffered = 0;
    const data = bytesToBase64(bytes);
    if (!started) {
      await Filesystem.writeFile({ directory, path, data, recursive: true });
      started = true;
    } else {
      await Filesystem.appendFile({ directory, path, data });
    }
  };

  return {
    async write(bytes) {
      buffer.push(bytes);
      buffered += bytes.length;
      if (buffered >= WRITE_CHUNK) await flush();
    },
    async close() {
      await flush();
      onDone?.();
      return label;
    },
  };
}

async function exists(path) {
  try {
    await Filesystem.stat({ directory: DATA, path });
    return true;
  } catch {
    return false;
  }
}

async function writeContent(content) {
  const data = JSON.stringify(content, null, 2);
  await Filesystem.writeFile({ directory: DATA, path: "content.tmp.json", data, encoding: Encoding.UTF8 });
  try {
    await Filesystem.rename({ directory: DATA, from: "content.tmp.json", to: "content.json" });
  } catch {
    // Some devices refuse to rename over an existing file: remove it, then rename.
    await Filesystem.deleteFile({ directory: DATA, path: "content.json" }).catch(() => {});
    await Filesystem.rename({ directory: DATA, from: "content.tmp.json", to: "content.json" });
  }
}

async function readJson(path) {
  try {
    const { data } = await Filesystem.readFile({ directory: DATA, path, encoding: Encoding.UTF8 });
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Newest kept version that passes the content rules, or null.
async function newestGoodVersion() {
  let names = [];
  try {
    const { files } = await Filesystem.readdir({ directory: DATA, path: "backups" });
    names = files.map((f) => f.name).sort().reverse();
  } catch {
    return null;
  }
  for (const name of names) {
    const content = await readJson(`backups/${name}`);
    if (content && !validateContent(content)) return { name, content };
  }
  return null;
}

async function keepVersion() {
  if (!(await exists("content.json"))) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await Filesystem.copy({ directory: DATA, from: "content.json", to: `backups/content-${stamp}.json` }).catch(async () => {
    await Filesystem.mkdir({ directory: DATA, path: "backups", recursive: true }).catch(() => {});
    await Filesystem.copy({ directory: DATA, from: "content.json", to: `backups/content-${stamp}.json` });
  });
  const { files } = await Filesystem.readdir({ directory: DATA, path: "backups" });
  const names = files.map((f) => f.name).sort();
  for (const old of names.slice(0, Math.max(0, names.length - MAX_VERSIONS))) {
    await Filesystem.deleteFile({ directory: DATA, path: `backups/${old}` });
  }
}

async function checkRecoveryCode(code) {
  const { value } = await Preferences.get({ key: "recoveryHash" });
  return Boolean(value) && /^\d+$/.test(code) && verifyPin(code, value);
}

export function createDeviceStore() {
  let base = "";
  const onDisk = new Set();

  return {
    kind: "device",

    async init() {
      const { uri } = await Filesystem.getUri({ directory: DATA, path: "" });
      base = uri.replace(/\/$/, "");
      try {
        const { files } = await Filesystem.readdir({ directory: DATA, path: "media" });
        files.forEach((f) => onDisk.add(f.name));
      } catch {
        // No media folder yet: first launch.
      }
    },

    async loadContent() {
      if (!(await exists("content.json"))) {
        // First launch: start from the content bundled with the app.
        await writeContent(seed);
        return structuredClone(seed);
      }
      const content = await readJson("content.json");
      const problem = content ? validateContent(content) : "content.json is damaged.";
      if (!problem) return content;

      // Content the screens can't show would crash the app on every start.
      // Fall back to the newest good version kept from an earlier save.
      console.error(`Stored content rejected: ${problem}`);
      const good = await newestGoodVersion();
      if (good) {
        console.warn(`Showing the kept version ${good.name} instead.`);
        return good.content;
      }
      throw new Error(`The kiosk's content can't be shown: ${problem}`);
    },

    async saveContent(content) {
      const problem = validateContent(content);
      if (problem) throw new Error(problem);
      await keepVersion();
      await writeContent(content);
    },

    mediaUrl(item) {
      if (onDisk.has(item.file)) return Capacitor.convertFileSrc(`${base}/media/${item.file}`);
      return bundledByName[item.file] ?? Capacitor.convertFileSrc(`${base}/media/${item.file}`);
    },

    async hasPin() {
      const { value } = await Preferences.get({ key: "pinHash" });
      return Boolean(value);
    },

    async setPin(pin) {
      if (!isValidPin(pin)) throw new Error("The PIN must be 4 to 8 digits.");
      await Preferences.set({ key: "pinHash", value: await hashPin(pin) });
    },

    async signIn(pin) {
      const { value } = await Preferences.get({ key: "pinHash" });
      if (!value) return null;
      return (await verifyPin(pin, value)) ? "kiosk-session" : null;
    },

    async signOut() {},

    // A forgotten PIN can be replaced with the recovery code, without losing content.
    // Only the code's hash is kept, and each code works once.
    async hasRecoveryCode() {
      const { value } = await Preferences.get({ key: "recoveryHash" });
      return Boolean(value);
    },

    // Makes a new code (the old one stops working) and returns it to show staff once.
    async newRecoveryCode() {
      const code = makeRecoveryCode();
      await Preferences.set({ key: "recoveryHash", value: await hashPin(code) });
      return code;
    },

    checkRecoveryCode,

    // Returns false if the code is wrong. Afterwards the code is used up.
    async resetPin(code, pin) {
      if (!isValidPin(pin)) throw new Error("The PIN must be 4 to 8 digits.");
      if (!(await checkRecoveryCode(code))) return false;
      await Preferences.set({ key: "pinHash", value: await hashPin(pin) });
      await Preferences.remove({ key: "recoveryHash" });
      return true;
    },

    async openMediaWriter(name) {
      if (!SAFE_NAME.test(name)) throw new Error(`Unsafe file name: ${name}`);
      return fileWriter(DATA, `media/${name}`, () => onDisk.add(name));
    },

    // Files bundled into the app can't be removed; once no media item points to one, it simply isn't shown.
    async deleteMedia(name) {
      if (!SAFE_NAME.test(name)) throw new Error(`Unsafe file name: ${name}`);
      if (!onDisk.has(name)) return;
      await Filesystem.deleteFile({ directory: DATA, path: `media/${name}` });
      onDisk.delete(name);
    },

    async openBackupWriter(name) {
      return fileWriter(Directory.Documents, `InfinityKiosk/${name}`, null, `Saved to Documents/InfinityKiosk/${name}`);
    },
  };
}
