// Development store: used in a normal browser with `npm run dev`.
// Talks to the local Express server in server/index.js.
import { SAFE_NAME } from "./index.js";

const UPLOAD_PIECE = 8 * 1024 * 1024;

async function errorFrom(res, fallback) {
  const data = await res.json().catch(() => ({}));
  return new Error(data.error ?? fallback);
}

export function createServerStore() {
  return {
    kind: "server",

    async init() {},

    async loadContent() {
      const res = await fetch("/api/content");
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      return res.json();
    },

    async saveContent(content, session) {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session}` },
        body: JSON.stringify(content),
      });
      if (!res.ok) throw await errorFrom(res, "Save failed.");
    },

    mediaUrl: (item) => `/media/${item.file}`,

    // On the dev server the PIN comes from .env (development PIN 1234).
    async hasPin() {
      return true;
    },
    async setPin() {
      throw new Error("On the dev server, set the PIN with `npm run hash-pin` and .env.");
    },

    async signIn(pin) {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) return null;
      return (await res.json()).token;
    },

    async signOut(session) {
      await fetch("/api/logout", { method: "POST", headers: { Authorization: `Bearer ${session}` } });
    },

    // Sends the file in ~8 MB pieces, so a large video never sits in memory whole.
    async openMediaWriter(name, session) {
      if (!SAFE_NAME.test(name)) throw new Error(`Unsafe file name: ${name}`);
      const url = `/api/media/${encodeURIComponent(name)}`;
      const headers = { Authorization: `Bearer ${session}`, "Content-Type": "application/octet-stream" };
      let parts = [];
      let buffered = 0;
      let sent = 0;

      const send = async () => {
        const res = await fetch(`${url}/part?offset=${sent}`, { method: "POST", headers, body: new Blob(parts) });
        if (!res.ok) throw await errorFrom(res, `Could not save ${name}.`);
        sent += buffered;
        parts = [];
        buffered = 0;
      };

      return {
        async write(bytes) {
          parts.push(bytes);
          buffered += bytes.length;
          if (buffered >= UPLOAD_PIECE) await send();
        },
        async close() {
          if (buffered || sent === 0) await send(); // an empty file still needs its first piece
          const res = await fetch(`${url}/done`, { method: "POST", headers });
          if (!res.ok) throw await errorFrom(res, `Could not save ${name}.`);
        },
      };
    },

    async deleteMedia(name, session) {
      if (!SAFE_NAME.test(name)) throw new Error(`Unsafe file name: ${name}`);
      const res = await fetch(`/api/media/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session}` },
      });
      if (!res.ok) throw await errorFrom(res, `Could not delete ${name}.`);
    },

    // In a browser, a backup downloads like any other file.
    async openBackupWriter(name) {
      const parts = [];
      return {
        write: async (bytes) => parts.push(bytes),
        close: async () => {
          const url = URL.createObjectURL(new Blob(parts, { type: "application/zip" }));
          const a = Object.assign(document.createElement("a"), { href: url, download: name });
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 10000);
          return `Downloaded ${name}`;
        },
      };
    },
  };
}
