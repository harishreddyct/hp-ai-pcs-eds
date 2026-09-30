/**
 * Decorates the promo block: full-bleed background image + text + CTA(s).
 * @param {Element} block The promo block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const mediaRow = rows.find((row) => row.querySelector('picture'));
  const contentRow = rows.find((row) => row !== mediaRow);

  if (mediaRow) mediaRow.firstElementChild?.classList.add('promo-media');
  if (contentRow) contentRow.firstElementChild?.classList.add('promo-content');
}
