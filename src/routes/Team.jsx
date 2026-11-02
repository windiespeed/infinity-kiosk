import { isCompanion } from "../lib/store/index.js";
import { TEAM } from "../lib/team.js";
import GoldRule from "../components/GoldRule.jsx";
import Portrait from "../components/Portrait.jsx";
import logoUrl from "../assets/infinity-logo-white.png";

// Meet the team: the phone page the About screen's QR code opens (on the companion site).
// Shows each member's longer bio and their LinkedIn or portfolio link. On the kiosk
// itself the links are shown as plain text, so nothing can open a browser there.
export default function Team() {
  return (
    <div className="mx-auto max-w-xl p-4 pb-10">
      <img src={logoUrl} alt="INFINITY Science Center" className="mx-auto mt-2 w-40" />
      <h1 className="mt-6 text-3xl">Meet the team</h1>
      <GoldRule className="mt-3" />
      <p className="mt-3 text-lg">
        The &quot;Mississippi and the Space Age&quot; exhibit was built by Mississippi Coding Academies
        technologists for INFINITY Science Center.
      </p>

      <ul className="mt-6 grid gap-4">
        {TEAM.map((member) => (
          <li key={member.name} className="rounded-2xl panel p-4">
            <div className="flex items-center gap-4">
              <Portrait member={member} className="size-20 text-2xl" />
              <div className="min-w-0">
                <h2 className="text-xl font-bold">{member.name}</h2>
                <p className="text-base text-accent">{member.role}</p>
              </div>
            </div>
            <p className="mt-3 text-base">{member.longBio || member.bio}</p>
            {member.link &&
              (isCompanion ? (
                <a
                  href={member.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-accent px-4 font-bold text-accent"
                >
                  {member.linkLabel || "Website"}
                  <span className="sr-only"> for {member.name} (opens in a new tab)</span>
                </a>
              ) : (
                <p className="mt-3 break-all text-base text-text-muted">{member.link}</p>
              ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
