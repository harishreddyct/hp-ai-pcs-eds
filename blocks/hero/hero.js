/**
 * Decorates the hero block.
 * Authors may add or omit the eyebrow line and badge images, so this
 * groups content defensively instead of assuming fixed row/column shapes.
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const picture = block.querySelector('picture');
  const mediaWrapper = picture ? picture.closest(':scope > div > div') : null;
  if (mediaWrapper) mediaWrapper.parentElement.classList.add('hero-media');

  const h1 = block.querySelector('h1');
  if (!h1) return;
  const content = h1.closest(':scope > div > div');
  if (!content) return;
  content.parentElement.classList.add('hero-content');

  const badges = document.createElement('div');
  badges.className = 'hero-badges';

  let sibling = h1.previousElementSibling;
  if (sibling && sibling.tagName === 'P' && !sibling.querySelector('img')) {
    sibling.classList.add('hero-eyebrow');
  }

  sibling = h1.nextElementSibling;
  while (sibling) {
    const next = sibling.nextElementSibling;
    if (sibling.tagName === 'P' && sibling.querySelector('img')) {
      badges.append(sibling);
    } else if (sibling.tagName === 'P' && !sibling.classList.contains('hero-subtitle') && !sibling.querySelector('a')) {
      sibling.classList.add('hero-subtitle');
    }
    sibling = next;
  }

  if (badges.children.length) content.append(badges);
}
