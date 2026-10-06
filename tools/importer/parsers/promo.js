/* eslint-disable */
/* global WebImporter */
/**
 * Parser for promo. Base block: promo (existing blocks/promo).
 * Source: https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html
 * Instance selectors (4 DOM shapes, all handled here):
 *   1. .experiencefragment:has(#roi-calculator) .c-hp-media-content   (ROI calculator)
 *   2. .mediaContent:not(.experiencefragment .mediaContent) .c-hp-media-content (Windows security)
 *   3. .mediaContent + .backgroundContainer c-hp-bg-container          (Business-ready AI, grid)
 *   4. .c-hp-contained-section-block                                    (Other home laptops)
 *
 * Output (matches content/index.plain.html + blocks/promo/README.md): 2 rows, 1 cell each
 *   media row:   [ image ]
 *   content row: [ optional logo <p><img></p>, <h2>, <p>s (with <sup>/<em>), CTA <p>s ]
 * ROW ORDER = visual image side. Read from the source's own layout signals:
 *   - .c-hp-media-content: --hpi-mc-mediaOrder in the component <style> (-1 => image left)
 *   - c-hp-bg-container grid: data-priority-desktop of the grid cells
 *   - .c-hp-contained-section-block: --hpi-csb-contentOrder / DOM order
 *   Fallback: DOM order of media vs content.
 * CTAs: c-hp-button--primary -> <p><strong><a>, --secondary -> <p><em><a>.
 * Paragraphs split on <br><br> (Windows security subtitle).
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

function trimP(p) {
  const isBlank = (n) => (n.nodeType === 1 && n.tagName === 'BR') || (n.nodeType === 3 && !n.textContent.trim());
  while (p.firstChild && isBlank(p.firstChild)) p.firstChild.remove();
  while (p.lastChild && isBlank(p.lastChild)) p.lastChild.remove();
  if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, '');
  if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, '');
  return p.textContent.trim() ? p : null;
}

// Rebuild a source <p> as one or more <p>s, splitting on <br><br>
function splitParagraphs(document, src) {
  const rebuilt = document.createElement('div');
  rebuilt.append(cleanInline(document, src));
  const out = [];
  let cur = document.createElement('p');
  const nodes = [...rebuilt.childNodes];
  for (let i = 0; i < nodes.length; i += 1) {
    const n = nodes[i];
    if (n.nodeType === 1 && n.tagName === 'BR') {
      let j = i + 1;
      while (j < nodes.length && nodes[j].nodeType === 3 && !nodes[j].textContent.trim()) j += 1;
      if (j < nodes.length && nodes[j].nodeType === 1 && nodes[j].tagName === 'BR') {
        const p = trimP(cur);
        if (p) out.push(p);
        cur = document.createElement('p');
        i = j;
        continue;
      }
    }
    cur.append(n);
  }
  const last = trimP(cur);
  if (last) out.push(last);
  return out;
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

// Build the content cell from a content root (logo image, heading, paragraphs, CTAs)
function buildContent(document, root) {
  const content = [];
  // optional logo image(s) inside the content area (e.g. Copilot+ PC logo)
  root.querySelectorAll('img').forEach((img) => {
    const p = document.createElement('p');
    p.append(makeImg(document, img));
    content.push(p);
  });
  const h = root.querySelector('.c-hp-tat__title h2, .c-hp-contained-section-block__title h2, h2')
    || root.querySelector('h1, h3');
  if (h) {
    const h2 = document.createElement('h2');
    h2.textContent = h.textContent.replace(/\s+/g, ' ').trim();
    content.push(h2);
  }
  let paras = [...root.querySelectorAll('.c-hp-tat__subtitle p, .c-hp-tat__description p')];
  if (!paras.length) {
    paras = [...root.querySelectorAll('p')].filter((p) => !p.closest('a, h1, h2, h3, .c-hp-cta-group'));
  }
  paras.forEach((p) => content.push(...splitParagraphs(document, p)));
  root.querySelectorAll('a.c-hp-button[href]').forEach((a) => content.push(ctaP(document, a)));
  return content;
}

function idClass(el) {
  return (el.className && typeof el.className === 'string')
    ? el.className.split(/\s+/).find((c) => /^id[0-9a-f]{20,}$/i.test(c)) : null;
}

// Read a numeric CSS custom property from the component's inline <style> rule
function styleVar(element, name) {
  const cls = idClass(element);
  if (!cls) return null;
  const scope = element.closest('.aem-GridColumn') || element.parentElement || element;
  const styles = [...scope.querySelectorAll('style')];
  const re = new RegExp(`\\.${cls}[^{]*\\{[^}]*${name}\\s*:\\s*(-?\\d+)`);
  for (const st of styles) {
    const m = st.textContent.match(re);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function domBefore(a, b) {
  // eslint-disable-next-line no-bitwise
  return !!(a.compareDocumentPosition(b) & 4); // b follows a
}

export default function parse(element, { document }) {
  let mediaImg = null;
  let contentRoot = null;
  let mediaFirst = null;

  if (element.matches('.c-hp-media-content')) {
    // Shapes 1 & 2: media-content component
    const media = element.querySelector('.c-hp-media-content__media');
    contentRoot = element.querySelector('.c-hp-media-content__content');
    mediaImg = media ? media.querySelector('img') : null;
    const order = styleVar(element, '--hpi-mc-mediaOrder');
    if (order !== null && order !== 0) mediaFirst = order < 0;
    else if (media && contentRoot) mediaFirst = domBefore(media, contentRoot);
  } else if (element.matches('.c-hp-contained-section-block')) {
    // Shape 4: contained section block
    const media = element.querySelector('.c-hp-contained-section-block__media');
    contentRoot = element.querySelector('.c-hp-contained-section-block__content');
    mediaImg = media ? media.querySelector('img') : null;
    const contentOrder = styleVar(element, '--hpi-csb-contentOrder');
    if (contentOrder !== null && contentOrder !== 0) mediaFirst = contentOrder > 0;
    else if (media && contentRoot) mediaFirst = domBefore(media, contentRoot);
  } else {
    // Shape 3: background container with a 2-cell grid (content cell + image cell)
    const cells = [...element.querySelectorAll('.c-hp-row > .c-hp-grid-cell')];
    const contentCell = cells.find((c) => c.querySelector('h1, h2, h3, .c-hp-tat'));
    const imageCell = cells.find((c) => c !== contentCell && c.querySelector('img'));
    contentRoot = contentCell || element;
    mediaImg = imageCell ? imageCell.querySelector('img') : null;
    if (contentCell && imageCell) {
      const pc = parseInt(contentCell.getAttribute('data-priority-desktop'), 10);
      const pi = parseInt(imageCell.getAttribute('data-priority-desktop'), 10);
      mediaFirst = (!Number.isNaN(pc) && !Number.isNaN(pi) && pc !== pi) ? pi < pc : domBefore(imageCell, contentCell);
    }
  }

  // Fallbacks for unknown variations
  if (!contentRoot) contentRoot = element;
  if (!mediaImg) {
    mediaImg = [...element.querySelectorAll('img')].find((img) => !contentRoot.contains(img)) || null;
  }

  const content = buildContent(document, contentRoot);
  if (!content.length && !mediaImg) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const mediaRow = mediaImg ? [makeImg(document, mediaImg)] : null;
  const contentRow = [content];
  const cells = [];
  if (mediaRow && mediaFirst) cells.push(mediaRow, contentRow);
  else if (mediaRow) cells.push(contentRow, mediaRow);
  else cells.push(contentRow);

  // Variant per source component (blocks/promo/promo.css):
  //   large   - media-content inside an experience fragment (ROI calculator)
  //   compact - contained section block (Other home laptops)
  //   offset  - background-container grid split (Business-ready AI)
  //   (none)  - plain media-content split (Windows security)
  let variant = '';
  if (element.matches('.c-hp-contained-section-block')) variant = 'compact';
  else if (!element.matches('.c-hp-media-content')) variant = 'offset';
  else if (element.closest('.experiencefragment')) variant = 'large';

  const name = variant ? `Promo (${variant})` : 'Promo';
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
