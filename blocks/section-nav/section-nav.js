/**
 * Decorates the section-nav block: sticky in-page jump links.
 * EDS has no native way to assign an id to an arbitrary section, so the
 * target sections carry a `Section Metadata` "Id" row (delivered as
 * data-id on the section) and this block scrolls to that element instead
 * of relying on native anchor/id behavior.
 * Like the reference, the link of the section currently under the bar is
 * marked active (scroll-spy).
 * @param {Element} block The section-nav block element
 */
export default function decorate(block) {
  const bar = block.closest('.section') || block;
  const links = [...block.querySelectorAll('a[href^="#"]')];
  const findTarget = (link) => document.querySelector(`[data-id="${link.getAttribute('href').slice(1)}"]`);
  // bottom edge of the pinned bar (fixed header offset + bar height)
  const barBottom = () => (parseFloat(getComputedStyle(bar).top) || 0) + bar.offsetHeight;

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = findTarget(link);
      if (!target) return;
      event.preventDefault();
      // land below the fixed header + this sticky bar, not underneath them
      const top = target.getBoundingClientRect().top + window.scrollY - barBottom();
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  let current = null;
  const update = () => {
    const edge = barBottom() + 1;
    const active = links.findLast((link) => {
      const rect = findTarget(link)?.getBoundingClientRect();
      return rect && rect.top <= edge && rect.bottom > edge;
    }) || null;
    if (active === current) return;
    current?.removeAttribute('aria-current');
    current?.parentElement.classList.remove('active');
    current = active;
    if (!active) return;
    active.setAttribute('aria-current', 'true');
    const li = active.parentElement;
    li.classList.add('active');
    // keep the active link visible in the horizontally scrolling list
    const list = li.parentElement;
    if (list.scrollWidth > list.clientWidth) {
      const left = list.scrollLeft + li.getBoundingClientRect().left
        - list.getBoundingClientRect().left;
      list.scrollTo({ left, behavior: 'smooth' });
    }
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  }, { passive: true });
}
