// Shared button styles. Every size is in rem, so buttons stay about 98px tall on the
// kiosk (min-h-14 = 3.5rem at 28px) and a normal size on phones.
const base =
  "btn-shade inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-xl border-2 px-6 py-2 " +
  "font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "bg-accent text-on-accent border-accent-outline",
  secondary: "bg-surface/80 text-text border-text-muted/70",
  era: "bg-primary text-on-primary border-primary-outline",
};

// Pass a text-* size in `extra` to override the default text-base.
export const buttonClass = (variant = "secondary", extra = "") => {
  const size = /(^|\s)text-(xs|sm|base|lg|\d?xl)(\s|$)/.test(extra) ? "" : "text-base";
  return `${base} ${size} ${variants[variant]} ${extra}`;
};
