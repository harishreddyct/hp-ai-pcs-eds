import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // collapse each footer nav column into a dropdown; CSS keeps them
  // permanently expanded above the tablet/desktop breakpoint
  footer.querySelectorAll('.footer-nav > div > div').forEach((col) => {
    const heading = col.querySelector('h3');
    const list = col.querySelector('ul');
    if (!heading || !list) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.append(...heading.childNodes);
    heading.append(button);
    list.hidden = true;
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      list.hidden = expanded;
    });
  });

  block.append(footer);
}
