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
import { hashPin, verifyPin, isValidPin } from "../pin.js";
import { SAFE_NAME } from "./index.js";

const DATA = Directory.Data;
const MAX_VERSIONS = 10;
const WRITE_CHUNK = 2 * 1024 * 1024; // write to disk in ~2 MB pieces to keep memory low

// Sample images ship inside the app so the first launch has something to show.
const bundled = import.meta.glob("../../../data/media/sample-*", { eager: true, query: "?url", import: "default" });
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
      const { data } = await Filesystem.readFile({ directory: DATA, path: "content.json", encoding: Encoding.UTF8 });
      return JSON.parse(data);
    },

    async saveContent(content) {
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

    async openMediaWriter(name) {
      if (!SAFE_NAME.test(name)) throw new Error(`Unsafe file name: ${name}`);
      return fileWriter(DATA, `media/${name}`, () => onDisk.add(name));
    },

    async openBackupWriter(name) {
      return fileWriter(Directory.Documents, `InfinityKiosk/${name}`, null, `Saved to Documents/InfinityKiosk/${name}`);
    },
  };
}
