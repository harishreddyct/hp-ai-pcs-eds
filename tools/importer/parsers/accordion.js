/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion. Base block: accordion (existing blocks/accordion).
 * Source: https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html
 * Instance selector: .backgroundContainer:has(#faqs) .c-hp-collapsible-section
 *   -> matches 10 SIBLING components (each wrapped in its own .collapsibleSection,
 *      all inside one .c-hp-grid-cell).
 *
 * Output (matches content/index.plain.html): ONE accordion block, one row per item:
 *   [ question text | answer <p>(s) (+ any CTA links) ]
 * The first matched sibling builds the block from every sibling in its group and
 * removes the others; later invocations on already-consumed (detached) siblings
 * are no-ops, so only one block is emitted.
 *
 * Selectors validated against migration-work/block-context/accordion/source.html:
 *   .c-hp-collapsible-section__title (h2), .c-hp-collapsible-section__copy (inline text),
 *   .c-hp-collapsible-section__cta a
 */
const ORIGIN = 'https://www.hp.com';
const CONSUMED = 'data-excat-accordion-consumed';

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

function trimP(p) {
  const isBlank = (n) => (n.nodeType === 1 && n.tagName === 'BR') || (n.nodeType === 3 && !n.textContent.trim());
  while (p.firstChild && isBlank(p.firstChild)) p.firstChild.remove();
  while (p.lastChild && isBlank(p.lastChild)) p.lastChild.remove();
  if (p.firstChild && p.firstChild.nodeType === 3) p.firstChild.textContent = p.firstChild.textContent.replace(/^\s+/, '');
  if (p.lastChild && p.lastChild.nodeType === 3) p.lastChild.textContent = p.lastChild.textContent.replace(/\s+$/, '');
  return p.textContent.trim() ? p : null;
}

// Inline content -> <p>s split on <br><br>
function inlineToParagraphs(document, src) {
  const tmp = document.createElement('div');
  tmp.append(cleanInline(document, src));
  const out = [];
  let cur = document.createElement('p');
  const nodes = [...tmp.childNodes];
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

function answerContent(document, copy) {
  if (!copy) return [];
  const blocks = [...copy.querySelectorAll(':scope > p, :scope > ul, :scope > ol')];
  if (!blocks.length) return inlineToParagraphs(document, copy);
  const out = [];
  [...copy.childNodes].forEach((n) => {
    if (n.nodeType === 1 && n.tagName === 'P') out.push(...inlineToParagraphs(document, n));
    else if (n.nodeType === 1 && (n.tagName === 'UL' || n.tagName === 'OL')) {
      const list = document.createElement(n.tagName.toLowerCase());
      n.querySelectorAll(':scope > li').forEach((li) => {
        const nli = document.createElement('li');
        nli.append(cleanInline(document, li));
        list.append(nli);
      });
      out.push(list);
    } else if ((n.nodeType === 3 && n.textContent.trim()) || n.nodeType === 1) {
      const holder = document.createElement('div');
      holder.append(n.cloneNode(true));
      out.push(...inlineToParagraphs(document, holder));
    }
  });
  return out;
}

function buildRow(document, section) {
  const titleEl = section.querySelector('.c-hp-collapsible-section__title')
    || section.querySelector('h2, h3, h4, [class*="__title"]');
  const question = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';
  const copy = section.querySelector('.c-hp-collapsible-section__copy')
    || section.querySelector('.c-hp-collapsible-section__description-content');
  const answer = answerContent(document, copy);
  section.querySelectorAll('.c-hp-collapsible-section__cta a[href]').forEach((a) => {
    const link = document.createElement('a');
    link.href = absUrl(a.getAttribute('href'));
    link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    if (!link.textContent) return;
    const isSecondary = /c-hp-button--(secondary|tertiary)/.test(a.className || '');
    const wrap = document.createElement(isSecondary ? 'em' : 'strong');
    wrap.append(link);
    const p = document.createElement('p');
    p.append(wrap);
    answer.push(p);
  });
  if (!question && !answer.length) return null;
  return [question, answer];
}

export default function parse(element, { document }) {
  // Already folded into the block built by the first sibling
  if (!element.parentNode || element.hasAttribute(CONSUMED)) return;

  const scope = element.closest('.c-hp-grid-cell')
    || (element.parentElement && element.parentElement.parentElement)
    || element.parentElement;
  let group = [...scope.querySelectorAll('.c-hp-collapsible-section')]
    .filter((s) => !s.parentElement.closest('.c-hp-collapsible-section') && !s.hasAttribute(CONSUMED));
  if (!group.includes(element)) group = [element];

  const cells = group.map((s) => buildRow(document, s)).filter(Boolean);
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Remove the other siblings (and their now-empty AEM wrappers)
  group.forEach((s) => {
    if (s === element) return;
    s.setAttribute(CONSUMED, 'true');
    const wrapper = s.parentElement;
    s.remove();
    if (wrapper && wrapper !== scope && wrapper.classList.contains('collapsibleSection')
      && !wrapper.textContent.trim() && !wrapper.querySelector('img')) {
      wrapper.remove();
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Accordion', cells });
  element.replaceWith(block);
}
