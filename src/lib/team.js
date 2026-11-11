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
  { name: "Windie Speed", role: "Project Manager & Lead Developer", photo: null, bio: "Windie Speed led the team that built this exhibit. A Mississippi Coding Academies graduate, she now teaches in its NeXTStack program. She built her tech career while raising her children and studying on nights and weekends.", link: "https://github.com/windiespeed", linkLabel: "GitHub" },
  { name: "LaTorya Hoyle-Sadler", role: "Technologist", photo: "latorya-hoyle-sadler.jpg", bio: "LaTorya is a technologist specializing in interactive experience development. She combines software development and creative design to give people of all ages new ways to explore, learn, and connect. She believes technology should spark curiosity and make learning memorable.", longBio: "LaTorya Sadler is a technologist with a background in software development and a curiosity for what technology can make possible. Her journey has led her to explore the intersection of technology, creativity, and education, with a focus on developing digital tools and experiences that serve a meaningful purpose. Through her work with Mississippi Coding Academies, she has contributed to the Mississippi and the Space Age exhibit at INFINITY Science Center. She enjoys being part of projects that turn ideas into something people can interact with, discover, and remember. Beyond software development, LaTorya is interested in creating technology that supports learning, accessibility, mindfulness, and human connection. She believes some of the most meaningful innovations are not necessarily the most complicated; they are the ones that leave people feeling inspired, empowered, or curious enough to keep exploring.", link: "https://www.linkedin.com/in/iamlatorya", linkLabel: "LinkedIn" },
  { name: "Shalom Vincent", role: "Technologist", photo: null, bio: "Shalom Vincent is a full-stack web developer from Lagos, Nigeria. As a junior developer in the Mississippi Coding Academies NeXTStack program, Shalom helped build this kiosk remotely, from the other side of the world.", link: "https://www.linkedin.com/in/shalom-vincent-8b3b3a233/", linkLabel: "LinkedIn" },
  { name: "Joshua Craven", role: "Technologist", photo: "joshua-craven.jpg", bio: "Joshua Craven is a technologist with a passion for creating interactive digital experiences that engage users.", link: "https://www.linkedin.com/in/joshualeecraven", linkLabel: "LinkedIn" },
  { name: "Zoe McGee", role: "Technologist", photo: "team-zoe.jpg", bio: "Zoe McGee is a junior developer with a love of coding and cybersecurity.", link: "https://www.linkedin.com/in/zoe-mcgee-6983591b5/", linkLabel: "LinkedIn" },
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
