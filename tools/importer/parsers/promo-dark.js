/* eslint-disable */
/* global WebImporter */
/**
 * Parser for promo-dark. Base block: promo (existing blocks/promo, variant "dark").
 * Source: https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html
 * Instance selector: .backgroundContainer:has(.c-hp-bg-container--align-left) c-hp-bg-container
 *
 * Output (matches content/index.plain.html): 2 rows, 1 cell each
 *   Row 1 (content): <h2>, <p>, <p><strong><a>Watch Video</a></strong></p>, <p><em><a>Learn</a></em></p>
 *   Row 2 (media):   image
 *
 * Source shape (validated in migration-work/block-context/promo-dark/source.html):
 *   .c-hp-bg-container__media-wrapper img (alt="" but descriptive title attr)
 *   .c-hp-bg-container__content .c-hp-tat__title h2, .c-hp-tat__subtitle p,
 *   .c-hp-cta-group a.c-hp-button (Watch Video has no href: data-modal-id="video-1")
 * The Watch Video CTA is pointed at the actual video file (read from the modal's
 * c-hp-video[data-src] when still present, else the known asset URL).
 */
const ORIGIN = 'https://www.hp.com';
const VIDEO_FALLBACK = 'https://www.hp.com/content/dam/exclusive/ai-solutions/next-gen-ai-pcs-visid/HP_ON_ULTRAHD_H264_26-03-23_V5.mp4';

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
  out.alt = (img.getAttribute('alt') || img.getAttribute('title') || '').trim();
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
  const isBlank = (n) => (n.nodeType === 1 && n.tagName === 'BR') || (n.nodeType === 3 && !n.textContent.trim());
  while (p.firstChild && isBlank(p.firstChild)) p.firstChild.remove();
  while (p.lastChild && isBlank(p.lastChild)) p.lastChild.remove();
  return p.textContent.trim() ? p : null;
}

function videoUrl(document, a) {
  const modalId = a.getAttribute('data-modal-id');
  if (modalId) {
    try {
      const modal = document.getElementById(modalId);
      const v = modal && modal.querySelector('[data-src$=".mp4"], c-hp-video[data-src], video source[src]');
      const src = v && (v.getAttribute('data-src') || v.getAttribute('src'));
      if (src) return absUrl(src);
    } catch (e) { /* fall through */ }
  }
  return VIDEO_FALLBACK;
}

function ctaP(document, a) {
  const link = document.createElement('a');
  const text = a.textContent.replace(/\s+/g, ' ').trim();
  const href = a.getAttribute('href');
  link.href = href ? absUrl(href) : videoUrl(document, a);
  link.textContent = text;
  const isSecondary = /c-hp-button--(secondary|tertiary)/.test(a.className || '');
  const wrap = document.createElement(isSecondary ? 'em' : 'strong');
  wrap.append(link);
  const p = document.createElement('p');
  p.append(wrap);
  return p;
}

export default function parse(element, { document }) {
  const mediaImg = element.querySelector('.c-hp-bg-container__media-wrapper img')
    || element.querySelector('picture img');
  const contentRoot = element.querySelector('.c-hp-bg-container__content') || element;

  const content = [];
  const h = contentRoot.querySelector('.c-hp-tat__title h2, h2, h1, h3');
  if (h) {
    const h2 = document.createElement('h2');
    h2.textContent = h.textContent.replace(/\s+/g, ' ').trim();
    content.push(h2);
  }
  contentRoot.querySelectorAll('.c-hp-tat__subtitle p, .c-hp-tat__description p').forEach((p) => {
    const np = cleanP(document, p);
    if (np) content.push(np);
  });
  contentRoot.querySelectorAll('a.c-hp-button').forEach((a) => {
    if (!a.textContent.trim()) return;
    content.push(ctaP(document, a));
  });

  if (!content.length && !mediaImg) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[content]];
  if (mediaImg) cells.push([makeImg(document, mediaImg)]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Promo (dark)', cells });
  element.replaceWith(block);
}
