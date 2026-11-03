import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import GoldRule from "../components/GoldRule.jsx";
import { useDialog } from "../hooks/useDialog.js";
import { buttonClass } from "../lib/ui.js";
import { useContent } from "../hooks/useContent.jsx";
import { teamLink } from "../lib/certificate.js";
import { TEAM } from "../lib/team.js";
import Portrait from "../components/Portrait.jsx";
import { useCompact } from "../store/useKiosk.js";

// The About screen's text lives here, not in the content file, so only developers
// can change it (staff can't edit it from admin). The team list is in lib/team.js.
// The team grid and NASA Stennis text sit on the left, the team page QR code on the
// right. Tapping a team member opens a card with their bio.
const PHOTO_CREDIT = "Photos courtesy of NASA unless otherwise noted.";

export default function About() {
  const { content } = useContent();
  const [open, setOpen] = useState(null);
  // Larger text / Move content lower: the two short paragraphs about INFINITY and
  // NASA Stennis are left out so the team and the QR code fit above the bottom bar.
  const { compact, tight } = useCompact();
  // Same website as the quiz certificate (Admin > Settings), followed by /team.
  const url = teamLink(content.settings.certificateSite);
  const shortAddress = url.replace(/^https?:\/\//, "");

  return (
    <div className={`flex min-h-full flex-col px-10 ${compact ? "gap-3 py-3" : "gap-4 py-4"}`}>
      <header>
        <h1 className={compact ? "text-4xl" : "text-5xl"}>About this exhibit</h1>
        <GoldRule className="mt-3" />
        {!compact && (
          <p className="mt-3 text-lg text-text-muted">
            INFINITY Science Center is the official visitor center for NASA&apos;s John C. Stennis Space Center.
          </p>
        )}
      </header>

      <div className={`grid flex-1 ${compact ? "gap-6 lg:grid-cols-[1fr_12rem]" : "gap-8 lg:grid-cols-[1fr_16rem]"}`}>
        <section aria-labelledby="team-title">
          <h2 id="team-title" className="font-display text-xl font-bold uppercase tracking-wide text-accent">
            Meet the team
          </h2>
          <p className={`mt-1 text-base ${tight ? "sr-only" : ""}`}>
            This exhibit was built by Mississippi Coding Academies technologists for INFINITY Science Center.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {TEAM.map((member, i) => (
              <li key={member.name}>
                <button
                  onClick={() => setOpen(i)}
                  className={`flex size-full items-center rounded-2xl border border-accent/25 panel text-left transition-colors hover:border-accent ${
                    compact ? "gap-3 p-2" : "gap-4 p-3"
                  }`}
                >
                  <Portrait member={member} className={compact ? "size-11 text-base" : "size-14 text-lg"} />
                  <span className="flex min-w-0 flex-col">
                    <span className={`font-bold leading-snug ${compact ? "text-sm" : "text-base"}`}>{member.name}</span>
                    <span className="text-sm leading-snug text-text-muted">{member.role}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Compact: the photo credit moves here, under the team, where there's room. */}
          {compact && <p className="mt-3 text-sm text-text-muted">{PHOTO_CREDIT}</p>}
          {!compact && (
            <>
              <h2 className="mt-4 font-display text-xl font-bold uppercase tracking-wide text-accent">NASA Stennis Space Center</h2>
              <p className="mt-1 text-sm">
                NASA Stennis accelerates the exploration and commercialization of space, innovates to benefit NASA and
                industry, and leverages assets to stimulate the economy and enhance national security.
              </p>
            </>
          )}
        </section>

        <aside className="flex flex-col gap-5">
          <div className={`flex flex-col items-center rounded-2xl panel text-center ${compact ? "gap-1 p-3" : "gap-2 p-4"}`}>
            <div className={`${compact ? "size-28" : "size-32"} bg-white p-1.5`}>
              <QRCodeSVG
                value={url}
                size={320}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
                marginSize={2}
                role="img"
                aria-label={`QR code. Scan it with your phone camera to meet the team at ${shortAddress}`}
                style={{ display: "block", width: "100%", height: "100%" }}
              />
            </div>
            <p className="text-base font-bold">Scan to meet the team online</p>
            <p className="text-sm break-all text-text-muted">{shortAddress}</p>
          </div>

          {!compact && <p className="text-center text-sm text-text-muted">{PHOTO_CREDIT}</p>}
        </aside>
      </div>

      {open != null && <MemberDialog member={TEAM[open]} onClose={() => setOpen(null)} />}
    </div>
  );
}

function MemberDialog({ member, onClose }) {
  const ref = useDialog(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-8" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-name"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-4xl flex-col items-center gap-8 rounded-2xl border border-text-muted/25 panel p-8 text-center md:flex-row md:items-start md:text-left"
      >
        <Portrait member={member} className="size-48 text-6xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <h2 id="member-name" className="text-4xl">{member.name}</h2>
          <p className="font-bold text-accent">{member.role}</p>
          <p className="text-xl">{member.bio}</p>
          <button data-autofocus onClick={onClose} className={buttonClass("primary", "mt-4 self-center md:self-end")}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
