/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-benefits. Base block: cards (existing blocks/cards, variant "benefits").
 * Source: https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html
 * Instance selector: .spacing:has(#benefits) + .backgroundContainer .c-hp-grid-cell .c-hp-row
 *
 * Output (matches content/index.plain.html): one row per benefit:
 *   [ icon image | <p> text with bold lead phrase as <strong> ]
 * The intro grid cell (h2 + subtitle) is default content: it is moved out in
 * front of the block, not placed inside it.
 *
 * Source shape (validated in migration-work/block-context/cards-benefits/source.html):
 *   .c-hp-row > .c-hp-grid-cell  (cln-lg-12: intro .c-hp-tat__title h2 / .c-hp-tat__subtitle)
 *            > .c-hp-grid-cell  (cln-lg-2: .c-hp-image img)          } alternating pairs
 *            > .c-hp-grid-cell  (cln-lg-10: .c-hp-tat__description p) }
 * Iteration is keyed on the block-level grid cells (no inline wrappers).
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

// Rebuild a rich paragraph: keep text, <b>/<strong> -> <strong>, <i>/<em> -> <em>, links, <sup>.
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
  // strip leading/trailing <br> and whitespace
  while (p.firstChild && ((p.firstChild.nodeType === 1 && p.firstChild.tagName === 'BR') || (p.firstChild.nodeType === 3 && !p.firstChild.textContent.trim()))) p.firstChild.remove();
  while (p.lastChild && ((p.lastChild.nodeType === 1 && p.lastChild.tagName === 'BR') || (p.lastChild.nodeType === 3 && !p.lastChild.textContent.trim()))) p.lastChild.remove();
  if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, '');
  if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, '');
  return p.textContent.trim() ? p : null;
}

// Intro cell (section heading + subtitle) -> default content placed before the block
function extractIntro(document, cell) {
  const out = [];
  const title = cell.querySelector('.c-hp-tat__title h2, .c-hp-tat__title');
  if (title && title.textContent.trim()) {
    const h2 = document.createElement('h2');
    h2.textContent = title.textContent.replace(/\s+/g, ' ').trim();
    out.push(h2);
  }
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
  const items = [];
  let pendingImg = null;

  gridCells.forEach((cell) => {
    const img = cell.querySelector('.c-hp-image img, img');
    const descs = [...cell.querySelectorAll('.c-hp-tat__description p')];
    const isIntro = !img && cell.querySelector('.c-hp-tat__title.title-medium, h2');
    if (isIntro) { intro.push(...extractIntro(document, cell)); return; }

    if (img && !descs.length) { pendingImg = img; return; }
    if (descs.length) {
      const text = descs.map((p) => cleanP(document, p)).filter(Boolean);
      const icon = img || pendingImg;
      pendingImg = null;
      if (!text.length && !icon) return;
      items.push({ icon, text });
    }
  });

  if (!items.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = items.map(({ icon, text }) => [icon ? makeImg(document, icon) : '', text]);

  if (intro.length) element.before(...intro);
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (benefits)', cells });
  element.replaceWith(block);
}
