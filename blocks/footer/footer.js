/**
 * Fetches the footer fragment. Local preview serves content under /content,
 * DA/EDS serves it at the site root — try both, in that order (the local
 * copy only on the dev server).
 * @returns {Promise<{html: string, base: string}|null>}
 */
async function fetchFooter() {
  // the /content copy only exists on the local dev server; elsewhere it
  // would be a guaranteed 404 (logged as a console error)
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  let path = '/content/footer.plain.html';
  let resp = isLocal ? await fetch('/content/footer.plain.html') : null;
  if (!resp?.ok) {
    path = '/footer.plain.html';
    resp = await fetch('/footer.plain.html');
  }
  if (!resp.ok) return null;
  return { html: await resp.text(), base: new URL(path, window.location).href };
}

/**
 * Resolves relative image paths (img src and picture source srcset) against
 * the fragment URL, not the page URL.
 * @param {Element} root fragment root
 * @param {string} base fragment URL
 */
function resolveImages(root, base) {
  const absolute = (url) => (url && !/^(https?:|data:|\/)/.test(url) ? new URL(url, base).href : url);
  root.querySelectorAll('img').forEach((img) => {
    img.setAttribute('src', absolute(img.getAttribute('src')));
    img.loading = 'lazy';
  });
  root.querySelectorAll('source[srcset]').forEach((source) => {
    source.setAttribute('srcset', source.getAttribute('srcset').split(',').map((part) => {
      const [url, ...rest] = part.trim().split(/\s+/);
      return [absolute(url), ...rest].join(' ');
    }).join(', '));
  });
}

/**
 * Locale selector: the paragraph is the trigger (label, flag, current
 * locale), the heading + list form the panel it opens.
 * @param {Element} section authored section
 * @param {number} index section index (for ids)
 * @returns {HTMLDivElement}
 */
function buildLocale(section, index) {
  const wrap = document.createElement('div');
  wrap.className = 'footer-locale';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'footer-locale-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', `footer-locale-${index}`);
  const label = section.querySelector(':scope > p');
  // split "Label [img] Current" into spans around the flag
  [...label.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (!text) return;
      const span = document.createElement('span');
      span.textContent = text;
      trigger.append(span);
    } else if (node.tagName === 'IMG' || node.tagName === 'PICTURE') {
      const img = node.tagName === 'IMG' ? node : node.querySelector('img');
      if (!img) return;
      img.className = 'footer-locale-flag';
      trigger.append(img);
    }
  });

  const panel = document.createElement('div');
  panel.className = 'footer-locale-panel';
  panel.id = `footer-locale-${index}`;
  panel.hidden = true;
  const heading = section.querySelector(':scope > h2, :scope > h3');
  if (heading) {
    heading.className = 'footer-locale-title';
    panel.append(heading);
  }
  const list = section.querySelector(':scope > ul');
  if (list) {
    list.className = 'footer-locale-list';
    panel.append(list);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'footer-close';
  close.setAttribute('aria-label', 'Close');
  panel.append(close);

  const setOpen = (open) => {
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
    // point the panel's pointer at the flag (or the trigger's start)
    const anchor = trigger.querySelector('.footer-locale-flag') || trigger;
    const a = anchor.getBoundingClientRect();
    panel.style.setProperty('--pointer-left', `${Math.round(a.left + a.width / 2 - panel.getBoundingClientRect().left - 8)}px`);
  };
  trigger.addEventListener('click', () => setOpen(trigger.getAttribute('aria-expanded') !== 'true'));
  close.addEventListener('click', () => {
    setOpen(false);
    trigger.focus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !panel.hidden) setOpen(false);
  });
  wrap.append(trigger, panel);
  return wrap;
}

/**
 * Link columns: each heading + following list becomes a column; a list of
 * icon-only links becomes a social row.
 * @param {Element} section authored section
 * @returns {HTMLDivElement}
 */
function buildColumns(section) {
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  let column = null;
  [...section.children].forEach((el) => {
    if (/^H[2-6]$/.test(el.tagName)) {
      column = document.createElement('div');
      column.className = 'footer-column';
      el.className = 'footer-heading';
      column.append(el);
      columns.append(column);
    } else if (el.tagName === 'UL' && column) {
      const links = [...el.querySelectorAll('a')];
      const iconsOnly = links.length && links.every((a) => a.querySelector('img') && !a.textContent.trim());
      el.className = iconsOnly ? 'footer-social' : 'footer-links';
      if (iconsOnly) {
        column.classList.add('footer-column-social');
        links.forEach((a) => a.setAttribute('aria-label', a.querySelector('img').alt));
      } else {
        // mobile accordion: the heading becomes a toggle; a linked heading
        // is repeated as the first link of its list
        const heading = column.querySelector('.footer-heading');
        el.id = `footer-links-${columns.children.length}`;
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'footer-toggle';
        toggle.textContent = heading.textContent.trim();
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', el.id);
        const headingLink = heading.querySelector('a');
        if (headingLink) {
          const item = document.createElement('li');
          item.className = 'footer-links-heading';
          item.append(headingLink.cloneNode(true));
          el.prepend(item);
        }
        column.append(toggle);
      }
      column.append(el);
    }
  });
  // single-expand accordion (mobile only; CSS keeps lists open on desktop)
  const toggles = [...columns.querySelectorAll('.footer-toggle')];
  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggles.forEach((t) => t.setAttribute('aria-expanded', 'false'));
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  return columns;
}

/**
 * Legal row (link list) + copyright paragraph.
 * @param {Element} section authored section
 * @returns {HTMLDivElement}
 */
function buildLegal(section) {
  const legal = document.createElement('div');
  legal.className = 'footer-legal';
  const list = section.querySelector(':scope > ul');
  if (list) {
    list.className = 'footer-legal-links';
    legal.append(list);
  }
  section.querySelectorAll(':scope > p').forEach((p) => {
    p.className = 'footer-copyright';
    legal.append(p);
  });
  return legal;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const data = await fetchFooter();
  if (!data) return;
  const fragment = document.createElement('div');
  fragment.innerHTML = data.html;
  resolveImages(fragment, data.base);

  const footer = document.createElement('div');
  footer.className = 'footer-container';
  [...fragment.children].forEach((section, i) => {
    if (section.querySelector(':scope > p') && section.querySelector(':scope > ul') && section.querySelector(':scope > h2, :scope > h3') && !section.querySelector(':scope > h3 + ul + h3')) {
      footer.append(buildLocale(section, i));
    } else if (section.querySelector(':scope > h2, :scope > h3, :scope > h4')) {
      footer.append(buildColumns(section));
    } else {
      footer.append(buildLegal(section));
    }
  });

  block.textContent = '';
  block.append(footer);
}
