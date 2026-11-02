import { initials, teamPhoto } from "../lib/team.js";

// Round photo with no frame, or gold initials when there's no photo yet.
export default function Portrait({ member, className = "" }) {
  const src = teamPhoto(member);
  if (src) {
    return <img src={src} alt="" draggable="false" className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent font-display font-bold text-on-accent ${className}`}
    >
      {initials(member.name)}
    </span>
  );
}
