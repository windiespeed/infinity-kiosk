// The team shown on the About screen. Like the rest of the About text, it lives in
// code, not in content.json, so only developers change it.
//
// photo: a file name in src/assets/team/, or null to show the person's initials.
// bio: about 40 words, written for museum visitors (kids included).

// One QR code on the About screen opens this page on the visitor's phone.
// The kiosk itself never opens a website.
export const TEAM_PAGE_URL = "https://mscoding.org";

export const TEAM = [
  { name: "Team Member One", role: "Role", photo: null, bio: "A short bio for museum visitors goes here." },
  { name: "Team Member Two", role: "Role", photo: null, bio: "A short bio for museum visitors goes here." },
  { name: "Team Member Three", role: "Role", photo: null, bio: "A short bio for museum visitors goes here." },
  { name: "Team Member Four", role: "Role", photo: null, bio: "A short bio for museum visitors goes here." },
  { name: "Team Member Five", role: "Role", photo: null, bio: "A short bio for museum visitors goes here." },
  { name: "Team Member Six", role: "Role", photo: null, bio: "A short bio for museum visitors goes here." },
];

// Every photo in src/assets/team/, keyed by file name.
const photos = import.meta.glob("../assets/team/*.{jpg,jpeg,png,webp}", { eager: true, query: "?url", import: "default" });
const photoByName = Object.fromEntries(
  Object.entries(photos).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1), url]),
);

export const teamPhoto = (member) => (member.photo ? photoByName[member.photo] ?? null : null);

// First and last initials, for a member without a photo.
export const initials = (name) => {
  const words = name.trim().split(/\s+/);
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};
