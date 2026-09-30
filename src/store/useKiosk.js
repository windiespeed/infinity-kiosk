import { create } from "zustand";

// Visitor settings reset whenever the kiosk returns to the attract screen.
const visitorDefaults = {
  textSize: "normal", // "normal" | "large"
  contrast: "default", // "default" | "high"
  reduceMotion: false,
  reach: false, // moves content lower on the screen
  a11yOpen: false,
};

export const useKiosk = create((set) => ({
  ...visitorDefaults,
  adminToken: null,
  busy: 0, // > 0 while something (like a playing video) should block the idle timer

  update: (patch) => set(patch),
  toggle: (key) => set((s) => ({ [key]: !s[key] })),
  addBusy: () => set((s) => ({ busy: s.busy + 1 })),
  removeBusy: () => set((s) => ({ busy: Math.max(0, s.busy - 1) })),
  resetVisitor: () => set({ ...visitorDefaults, adminToken: null, busy: 0 }),
}));
