/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero. Base block: hero (existing blocks/hero).
 * Source: https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html
 * Instance selector: .c-hp-hero-banner
 *
 * Output (matches content/index.plain.html + blocks/hero/README.md):
 *   Row 1: [ image ]
 *   Row 2: [ eyebrow <p>, <h1>, subtitle <p>, badge <p>s (<p><a><img></a></p>) ]
 *
 * Selectors validated against migration-work/block-context/hero/source.html:
 *   .c-hp-hero-banner__media img, .c-hp-hero-banner__eyebrow, .c-hp-hero-banner__title h1,
 *   .c-hp-hero-banner__subtitle, .c-hp-hero-banner__badge-line--item
 */
const ORIGIN = 'https://www.hp.com';

function absUrl(url) {
  if (!url) return '';
  const u = url.trim();
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
  if (!img) return null;
  const out = document.createElement('img');
  out.src = bestSrc(img);
  out.alt = (img.getAttribute('alt') || '').trim();
  return out;
}

function textP(document, el) {
  if (!el) return null;
  const text = el.textContent.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

export default function parse(element, { document }) {
  const mediaImg = element.querySelector('.c-hp-hero-banner__media img')
    || element.querySelector('[class*="__media"] img');
  const eyebrow = element.querySelector('.c-hp-hero-banner__eyebrow');
  const titleSrc = element.querySelector('.c-hp-hero-banner__title h1, .c-hp-hero-banner__title')
    || element.querySelector('h1');
  const subtitle = element.querySelector('.c-hp-hero-banner__subtitle');

  if (!titleSrc && !mediaImg) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const content = [];
  const eyebrowP = textP(document, eyebrow);
  if (eyebrowP) content.push(eyebrowP);

  if (titleSrc) {
    const h1 = document.createElement('h1');
    h1.textContent = titleSrc.textContent.replace(/\s+/g, ' ').trim();
    content.push(h1);
  }

  const subtitleP = textP(document, subtitle);
  if (subtitleP) content.push(subtitleP);

  // Badges (Windows 11, Copilot+ PC): keep source links around the badge images
  let badgeItems = [...element.querySelectorAll('.c-hp-hero-banner__badge-line--item')];
  if (!badgeItems.length) badgeItems = [...element.querySelectorAll('.c-hp-hero-banner__badges .c-hp-image')];
  badgeItems.forEach((item) => {
    const img = item.querySelector('img');
    if (!img) return;
    const p = document.createElement('p');
    const newImg = makeImg(document, img);
    const link = img.closest('a') || item.querySelector('a[href]');
    if (link && link.getAttribute('href')) {
      const a = document.createElement('a');
      a.href = absUrl(link.getAttribute('href'));
      a.append(newImg);
      p.append(a);
    } else {
      p.append(newImg);
    }
    content.push(p);
  });

  const cells = [];
  if (mediaImg) cells.push([makeImg(document, mediaImg)]);
  cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', cells });
  element.replaceWith(block);
}
