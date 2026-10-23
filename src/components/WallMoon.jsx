// Stand-in Moon for the welcome screen header, drawn in SVG so it works offline
// without a photo: a lit gray sphere with noise for the maria and a dark limb.
// Swap it for a real NASA Moon photo once one is cleared for the kiosk.
export default function WallMoon({ className = "" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 400" className={className}>
      <defs>
        <radialGradient id="moon-light" cx="38%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#e9e9e6" />
          <stop offset="55%" stopColor="#b9b9b6" />
          <stop offset="85%" stopColor="#6d6d6b" />
          <stop offset="100%" stopColor="#2c2c2c" />
        </radialGradient>
        <filter id="moon-maria" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="7" />
          <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.25  0 0 0 0 0.25  0 0 0 3 -1.45" />
        </filter>
        <filter id="moon-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="3" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -0.75" />
        </filter>
        <clipPath id="moon-disc"><circle cx="200" cy="200" r="196" /></clipPath>
        <radialGradient id="moon-glow" r="50%">
          <stop offset="88%" stopColor="#c8d4ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#c8d4ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="200" fill="url(#moon-glow)" />
      <g clipPath="url(#moon-disc)">
        <circle cx="200" cy="200" r="196" fill="url(#moon-light)" />
        <rect width="400" height="400" filter="url(#moon-maria)" opacity="0.9" />
        <rect width="400" height="400" filter="url(#moon-grain)" opacity="0.35" />
        <circle cx="200" cy="200" r="196" fill="url(#moon-light)" opacity="0.25" style={{ mixBlendMode: "multiply" }} />
      </g>
    </svg>
  );
}
