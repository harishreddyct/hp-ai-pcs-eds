/* eslint-disable */
/* global WebImporter */
/**
 * Parser for section-nav. Base block: section-nav (existing blocks/section-nav).
 * Source: https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html
 * Instance selector: .c-hp-anchor-nav
 *
 * Output (matches content/index.plain.html): one row, one cell:
 *   <ul> of in-page links (#benefits, #portfolio, ...) + CTA <p><strong><a></a></strong></p>
 *
 * Selectors validated against migration-work/block-context/section-nav/source.html:
 *   ul.c-hp-anchor-nav__items a.c-hp-anchor-nav__item-link, .c-hp-anchor-nav__buttons a.c-hp-button
 * The hidden measuring list (.c-hp-anchor-nav__mode-helper) and the mobile
 * dropdown title are excluded.
 */
const ORIGIN = 'https://www.hp.com';

function absUrl(url) {
  if (!url) return '';
  const u = url.trim();
  if (u.startsWith('#')) return u;
  if (/^(https?:)?\/\//i.test(u) || u.startsWith('/')) {
    try { return new URL(u, ORIGIN).href; } catch (e) { return u; }
  }
  return u;
}

function ctaP(document, a) {
  const link = document.createElement('a');
  link.href = absUrl(a.getAttribute('href'));
  link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
  const isSecondary = /c-hp-button--(secondary|tertiary)/.test(a.className || '');
  const wrap = document.createElement(isSecondary ? 'em' : 'strong');
  wrap.append(link);
  const p = document.createElement('p');
  p.append(wrap);
  return p;
}

export default function parse(element, { document }) {
  let navLinks = [...element.querySelectorAll('ul.c-hp-anchor-nav__items a[href]')]
    .filter((a) => !a.closest('.c-hp-anchor-nav__mode-helper'));
  if (!navLinks.length) {
    navLinks = [...element.querySelectorAll('li a[href^="#"]')]
      .filter((a) => !a.closest('.c-hp-anchor-nav__mode-helper'));
  }

  let ctas = [...element.querySelectorAll('.c-hp-anchor-nav__buttons a[href]')];
  if (!ctas.length) ctas = [...element.querySelectorAll('a.c-hp-button[href]')];

  if (!navLinks.length && !ctas.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const content = [];
  if (navLinks.length) {
    const ul = document.createElement('ul');
    const seen = new Set();
    navLinks.forEach((a) => {
      const href = a.getAttribute('href');
      if (seen.has(href)) return;
      seen.add(href);
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = absUrl(href);
      link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
      li.append(link);
      ul.append(li);
    });
    content.push(ul);
  }
  ctas.forEach((a) => content.push(ctaP(document, a)));

  const cells = [[content]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Section Nav', cells });
  element.replaceWith(block);
}
