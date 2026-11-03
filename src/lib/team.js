// The team shown on the About screen. Like the rest of the About text, it lives in
// code, not in content.json, so only developers change it.
//
// The kiosk shows name, role, photo and bio. The About screen's QR code opens the
// Meet the team phone page (<website in Admin > Settings>/team), which also shows
// longBio and link. The kiosk itself never opens a website.
//
// photo: a file name in src/assets/team/, or null to show the person's initials.
// bio: about 40 words, written for museum visitors (kids included).
// longBio: optional, for the phone page only. Leave it out to show bio there.
// link: optional LinkedIn or portfolio address, for the phone page only.
// linkLabel: the link's button text, like "LinkedIn" or "Portfolio".

export const TEAM = [
  { name: "Team Member One", role: "Role", photo: null, bio: "A short bio for museum visitors goes here.", link: "", linkLabel: "LinkedIn" },
  { name: "Team Member Two", role: "Role", photo: null, bio: "A short bio for museum visitors goes here.", link: "", linkLabel: "LinkedIn" },
  { name: "Team Member Three", role: "Role", photo: null, bio: "A short bio for museum visitors goes here.", link: "", linkLabel: "LinkedIn" },
  { name: "Joshua Craven", role: "Code Developer", photo: "joshua-craven.jpg", bio: "Joshua Craven is a code developer with a passion for creating interactive digital experiences that engage users.", link: "https://www.linkedin.com/in/joshualeecraven", linkLabel: "LinkedIn" },
  { name: "Team Member Five", role: "Role", photo: null, bio: "A short bio for museum visitors goes here.", link: "", linkLabel: "LinkedIn" },
  { name: "Team Member Six", role: "Role", photo: null, bio: "A short bio for museum visitors goes here.", link: "", linkLabel: "LinkedIn" },
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
