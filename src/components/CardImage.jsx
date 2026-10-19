// Photo behind a timeline card's text. Decorative (empty alt): the card's text
// names it, and the photo's own alt text is read in the event panel.
// The card needs `relative overflow-hidden`, and its text needs `relative` so it
// sits above the photo. The bottom of the photo fades to solid page color so the
// text there keeps full contrast. High contrast mode hides the photo.
export default function CardImage({ src }) {
  return (
    <span aria-hidden="true" className="absolute inset-0 [[data-contrast=high]_&]:hidden">
      <img src={src} alt="" loading="lazy" draggable="false" className="size-full object-cover" />
      <span className="absolute inset-0 bg-linear-to-t from-bg from-40% via-bg/75 via-65% to-transparent" />
    </span>
  );
}
