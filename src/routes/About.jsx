import { useContent } from "../hooks/useContent.jsx";

export default function About() {
  const { content } = useContent();
  return (
    <div className="p-10">
      <h1 className="text-6xl">About this exhibit</h1>
      <p className="mt-6 max-w-[60ch] text-2xl">{content.settings.credits}</p>
    </div>
  );
}
