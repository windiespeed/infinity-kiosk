// Four-point gold sparkle that marks a stop on the timeline, like the stars on
// the exhibit wall's gold lines. Decorative only. Position and size come from
// className; the star is drawn centered in its box.
export default function StarMarker({ className = "" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`fill-accent drop-shadow-[0_0_0.35rem_var(--color-accent)] [[data-contrast=high]_&]:drop-shadow-none ${className}`}>
      <path d="M12 0C12.5 8.5 15.5 11.5 24 12C15.5 12.5 12.5 15.5 12 24C11.5 15.5 8.5 12.5 0 12C8.5 11.5 11.5 8.5 12 0Z" />
    </svg>
  );
}
