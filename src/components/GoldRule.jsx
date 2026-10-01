// Thin gold divider, echoing the rules on the exhibit wall. Decorative only.
export default function GoldRule({ className = "" }) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-3 ${className}`}>
      <span className="h-px w-24 bg-accent" />
      <span className="size-2 rotate-45 bg-accent" />
      <span className="h-px w-24 bg-accent" />
    </div>
  );
}
