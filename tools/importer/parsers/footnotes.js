/* eslint-disable */
/* global WebImporter */
/**
 * Parser for footnotes. Base block: footnotes (new blocks/footnotes).
 * Source: https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html
 * Instance selector: c-hp-footnotes
 *
 * Output (matches blocks/footnotes/README.md): 1 column, 2 rows
 *   Row 1: title ("Footnotes and Disclaimers")
 *   Row 2: body - disclaimer <p>s (source text split on <br>&nbsp;<br>) and the
 *          numbered <ol> footnotes (links kept), then the dynamic list if populated.
 *
 * Selectors validated against migration-work/block-context/footnotes/source.html:
 *   .c-hp-footnotes__title, .c-hp-footnotes__list--static .c-hp-footnotes__item-content,
 *   .c-hp-footnotes__list--dynamic > li
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

function cleanInline(document, node) {
  const frag = document.createDocumentFragment();
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) { frag.append(document.createTextNode(child.textContent)); return; }
    if (child.nodeType !== 1) return;
    const tag = child.tagName.toLowerCase();
    if (['style', 'script', 'svg', 'button'].includes(tag)) return;
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

function isBlank(n) {
  return (n.nodeType === 1 && (n.tagName === 'BR' || (n.tagName === 'SPAN' && !n.textContent.trim())))
    || (n.nodeType === 3 && !n.textContent.trim());
}

function trimP(p) {
  while (p.firstChild && isBlank(p.firstChild)) p.firstChild.remove();
  while (p.lastChild && isBlank(p.lastChild)) p.lastChild.remove();
  if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, '');
  if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, '');
  return p.textContent.trim() ? p : null;
}

function buildList(document, srcList) {
  const list = document.createElement(srcList.tagName.toLowerCase() === 'ul' ? 'ul' : 'ol');
  srcList.querySelectorAll(':scope > li').forEach((li) => {
    const nli = document.createElement('li');
    nli.append(cleanInline(document, li));
    const t = trimP(nli);
    if (t) list.append(t);
  });
  return list.children.length ? list : null;
}

// Mixed inline content + lists -> <p>s (split on <br><br> / line-break spans) and lists
function toBody(document, src, out) {
  let cur = document.createElement('p');
  const flush = () => {
    const p = trimP(cur);
    if (p) out.push(p);
    cur = document.createElement('p');
  };
  const nodes = [...src.childNodes];
  for (let i = 0; i < nodes.length; i += 1) {
    const n = nodes[i];
    if (n.nodeType === 1) {
      const tag = n.tagName;
      if (tag === 'OL' || tag === 'UL') { flush(); const l = buildList(document, n); if (l) out.push(l); continue; }
      if (tag === 'P' || tag === 'DIV') { flush(); toBody(document, n, out); continue; }
      if (tag === 'SPAN' && n.classList.contains('line-break')) { flush(); continue; }
      if (tag === 'BR') {
        let j = i + 1;
        while (j < nodes.length && nodes[j].nodeType === 3 && !nodes[j].textContent.trim()) j += 1;
        if (j < nodes.length && nodes[j].nodeType === 1 && nodes[j].tagName === 'BR') { flush(); i = j; continue; }
        cur.append(document.createElement('br'));
        continue;
      }
      const holder = document.createElement('span');
      holder.append(n.cloneNode(true));
      cur.append(cleanInline(document, holder));
      continue;
    }
    if (n.nodeType === 3) cur.append(document.createTextNode(n.textContent));
  }
  flush();
}

export default function parse(element, { document }) {
  const titleEl = element.querySelector('.c-hp-footnotes__title')
    || element.querySelector('.c-hp-footnotes__header');
  const title = (titleEl && titleEl.textContent.replace(/\s+/g, ' ').trim()) || 'Footnotes and Disclaimers';

  const body = [];
  // Static list: each item holds disclaimer text (+ nested numbered <ol>)
  let staticItems = [...element.querySelectorAll('.c-hp-footnotes__list--static > li')];
  if (!staticItems.length) staticItems = [...element.querySelectorAll('.c-hp-footnotes__item')];
  staticItems.forEach((li) => {
    const content = li.querySelector('.c-hp-footnotes__item-content') || li;
    toBody(document, content, body);
  });

  // Dynamic list (numbered footnotes injected at runtime), only if populated
  const dyn = element.querySelector('.c-hp-footnotes__list--dynamic');
  if (dyn) {
    const list = buildList(document, dyn);
    if (list) body.push(list);
  }

  if (!body.length) {
    const content = element.querySelector('.c-hp-footnotes__content');
    if (content) toBody(document, content, body);
  }
  if (!body.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[title], [body]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Footnotes', cells });
  element.replaceWith(block);
}
