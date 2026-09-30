/**
 * Decorates the promo block: full-bleed background image + text + CTA(s).
 * @param {Element} block The promo block element
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');
  const mediaWrapper = picture ? picture.closest(':scope > div > div') : null;
  if (mediaWrapper) mediaWrapper.parentElement.classList.add('promo-media');

  const textWrapper = [...block.children].find((row) => row !== mediaWrapper?.parentElement);
  if (textWrapper) textWrapper.firstElementChild?.classList.add('promo-content');
}
