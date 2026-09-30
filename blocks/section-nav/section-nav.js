/**
 * Decorates the section-nav block: sticky in-page jump links.
 * EDS has no native way to assign an id to an arbitrary section, so the
 * target sections carry a `Section Metadata` "Id" row (delivered as
 * data-id on the section) and this block scrolls to that element instead
 * of relying on native anchor/id behavior.
 * @param {Element} block The section-nav block element
 */
export default function decorate(block) {
  block.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.querySelector(`[data-id="${id}"]`);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}
