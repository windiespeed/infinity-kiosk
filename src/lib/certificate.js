// The certificate link the kiosk's QR code opens on a visitor's phone.
// Plain JavaScript (no Vite or React) so scripts/make-qr.mjs can use it too.

// Where the certificate page (<site>/certificate) lives when the settings don't say otherwise.
// Staff can change it in Admin > Settings > Companion website.
export const DEFAULT_CERTIFICATE_SITE = "https://mscoding.org/ISCProject";

// The Meet the team page the About screen's QR code opens, used as is.
// Staff can change it in Admin > Settings > Team page address.
export const DEFAULT_TEAM_PAGE = "https://mscoding.org/ISCProject#team";

// Site address without a trailing slash; falls back to the default when blank.
export function certificateSite(site) {
  return (typeof site === "string" && site.trim() ? site.trim() : DEFAULT_CERTIFICATE_SITE).replace(/\/+$/, "");
}

// <site>/certificate?d=YYYY-MM-DD&era=<eraId>
// No era means the whole-timeline challenge. No date means "the day it's scanned"
// (used by printed QR codes, which can't know the date).
export function certificateLink(site, { date, eraId } = {}) {
  const params = new URLSearchParams();
  if (date) params.set("d", date);
  if (eraId) params.set("era", eraId);
  const query = params.toString();
  return `${certificateSite(site)}/certificate${query ? `?${query}` : ""}`;
}

// The Meet the team page the About screen's QR code opens: the Team page address
// exactly as typed; otherwise <Companion website>/team if one is set (our own
// GitHub Pages copy has a /team page); otherwise DEFAULT_TEAM_PAGE.
export function teamLink(site, teamPage) {
  if (typeof teamPage === "string" && teamPage.trim()) return teamPage.trim();
  if (typeof site === "string" && site.trim()) return `${certificateSite(site)}/team`;
  return DEFAULT_TEAM_PAGE;
}

// Today's local date as YYYY-MM-DD.
export function todayIso(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// "the Apollo Missions quiz": era titles that start with "The" don't get a second "the".
export function quizName(era) {
  return era ? `the ${era.title.replace(/^the\s+/i, "")} quiz` : "the Timeline Challenge";
}

// The line under the visitor's name.
export function achievementText(era) {
  return `completed ${quizName(era)}`;
}
