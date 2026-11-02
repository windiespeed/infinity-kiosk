import { create } from "zustand";

// Visitor settings reset whenever the kiosk returns to the attract screen.
const visitorDefaults = {
  textSize: "normal", // "normal" | "large"
  contrast: "default", // "default" | "high"
  reduceMotion: false,
  reach: false, // moves content lower on the screen
  readAloud: false,
  a11yOpen: false,
};

export const useKiosk = create((set) => ({
  ...visitorDefaults,
  adminToken: null,
  adminDirty: 0, // > 0 while any admin form has unsaved changes
  previewReturn: null, // admin screen to go back to from a staff preview
  busy: 0, // > 0 while something (like a playing video) should block the idle timer

  update: (patch) => set(patch),
  toggle: (key) => set((s) => ({ [key]: !s[key] })),
  addBusy: () => set((s) => ({ busy: s.busy + 1 })),
  removeBusy: () => set((s) => ({ busy: Math.max(0, s.busy - 1) })),
  addDirty: () => set((s) => ({ adminDirty: s.adminDirty + 1 })),
  removeDirty: () => set((s) => ({ adminDirty: Math.max(0, s.adminDirty - 1) })),
  resetVisitor: () => set({ ...visitorDefaults, adminToken: null, adminDirty: 0, busy: 0 }),
}));
