// Full public URL of the companion site, including any sub-path, no trailing slash.
export const COMPANION_URL = (import.meta.env.VITE_COMPANION_URL ?? "").replace(/\/$/, "");
export const IS_COMPANION = import.meta.env.VITE_COMPANION === "true";