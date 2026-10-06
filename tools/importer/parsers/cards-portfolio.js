/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-portfolio. Base block: cards (existing blocks/cards, variant "portfolio").
 * Source: https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html
 * Instance selector: .spacing:has(#portfolio) + .backgroundContainer .c-hp-row
 *
 * Output (matches content/index.plain.html): one row per card:
 *   [ image | <h3>, description <p>, CTA <p><strong><a>Learn</a></strong></p> ]
 * The intro grid cell (h2 + subtitle) is default content, moved in front of the block.
 *
 * Source shape (validated in migration-work/block-context/cards-portfolio/source.html):
 *   .c-hp-row > .c-hp-grid-cell (cln-lg-12: .c-hp-tat__title h2 + .c-hp-tat__subtitle p)
 *            > .c-hp-grid-cell (cln-lg-4) x3: .c-hp-image img, .c-hp-tat__title h3,
 *              .c-hp-tat__description p, .c-hp-cta-group a.c-hp-button
 * Iteration is keyed on block-level grid cells; CTAs read per card.
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

function bestSrc(img) {
  const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
  if (/@2x/i.test(src)) return absUrl(src);
  const picture = img.closest('picture');
  if (picture) {
    const hi = [...picture.querySelectorAll('source[srcset]')]
      .map((s) => s.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0])
      .find((s) => /@2x/i.test(s) && !/-mob/i.test(s));
    if (hi) return absUrl(hi);
  }
  return absUrl(src);
}

function makeImg(document, img) {
  const out = document.createElement('img');
  out.src = bestSrc(img);
  out.alt = (img.getAttribute('alt') || '').trim();
  return out;
}

function cleanInline(document, node) {
  const frag = document.createDocumentFragment();
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) { frag.append(document.createTextNode(child.textContent)); return; }
    if (child.nodeType !== 1) return;
    const tag = child.tagName.toLowerCase();
    let el = null;
    if (tag === 'b' || tag === 'strong') el = document.createElement('strong');
    else if (tag === 'i' || tag === 'em') el = document.createElement('em');
    else if (tag === 'sup' || tag === 'sub') el = document.createElement(tag);
    else if (tag === 'a') {
      el = document.createElement('a');
      el.href = absUrl(child.getAttribute('href'));
    } else if (tag === 'br') { frag.append(document.createElement('br')); return; }
    if (el) { el.append(cleanInline(document, child)); frag.append(el); } else frag.append(cleanInline(document, child));
  });
  return frag;
}

function cleanP(document, src) {
  const p = document.createElement('p');
  p.append(cleanInline(document, src));
  while (p.firstChild && ((p.firstChild.nodeType === 1 && p.firstChild.tagName === 'BR') || (p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim()))) p.firstChild.remove();
  while (p.lastChild && ((p.lastChild.nodeType === 1 && p.lastChild.tagName === 'BR') || (p.lastChild.nodeType === 3 && !p.lastChild.textContent.trim()))) p.lastChild.remove();
  return p.textContent.trim() ? p : null;
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

function heading(document, tag, src) {
  const text = src ? src.textContent.replace(/\s+/g, ' ').trim() : '';
  if (!text) return null;
  const h = document.createElement(tag);
  h.textContent = text;
  return h;
}

function extractIntro(document, cell) {
  const out = [];
  const h2 = heading(document, 'h2', cell.querySelector('.c-hp-tat__title h2, .c-hp-tat__title'));
  if (h2) out.push(h2);
  cell.querySelectorAll('.c-hp-tat__subtitle p').forEach((p) => {
    const np = cleanP(document, p);
    if (np) out.push(np);
  });
  return out;
}

export default function parse(element, { document }) {
  let gridCells = [...element.querySelectorAll(':scope > .c-hp-grid-cell')];
  if (!gridCells.length) gridCells = [...element.children];

  const intro = [];
  const cells = [];

  gridCells.forEach((cell) => {
    const img = cell.querySelector('.c-hp-image img') || cell.querySelector('img');
    const h3Src = cell.querySelector('.c-hp-tat__title h3, h3');
    if (!img && !h3Src) {
      if (cell.querySelector('.c-hp-tat__title, h2')) intro.push(...extractIntro(document, cell));
      return;
    }
    const body = [];
    const h3 = heading(document, 'h3', h3Src);
    if (h3) body.push(h3);
    cell.querySelectorAll('.c-hp-tat__description p').forEach((p) => {
      const np = cleanP(document, p);
      if (np) body.push(np);
    });
    cell.querySelectorAll('a.c-hp-button[href]').forEach((a) => body.push(ctaP(document, a)));
    cells.push([img ? makeImg(document, img) : '', body]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  if (intro.length) element.before(...intro);
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (portfolio)', cells });
  element.replaceWith(block);
}
