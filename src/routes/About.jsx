// The About screen's text lives here, not in the content file, so only developers
// can change it (staff can't edit it from admin).
export default function About() {
  return (
    <div className="p-10">
      <h1 className="text-6xl">About this exhibit</h1>
      <p className="mt-6 max-w-[60ch] text-2xl">
        Built by Mississippi Coding Academies technologists for the Infinity Science Center.
      </p>
    </div>
  );
}
