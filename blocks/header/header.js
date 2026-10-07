// desktop layout from 960px (project breakpoint scale 768 / 960 / 1200)
const isDesktop = window.matchMedia('(min-width: 960px)');

/**
 * Fetches the nav fragment. Local preview serves content under /content,
 * DA/EDS serves it at the site root — try both, in that order (the local
 * copy only on the dev server).
 * @returns {Promise<{html: string, base: string}|null>}
 */
async function fetchNav() {
  // the /content copy only exists on the local dev server; elsewhere it
  // would be a guaranteed 404 (logged as a console error)
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  let path = '/content/nav.plain.html';
  let resp = isLocal ? await fetch('/content/nav.plain.html') : null;
  if (!resp?.ok) {
    path = '/nav.plain.html';
    resp = await fetch('/nav.plain.html');
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
 * Replaces an authored icon <img> with a masked span so the icon can be
 * recolored with currentColor (hover states).
 * @param {HTMLImageElement} img icon image
 * @returns {HTMLSpanElement}
 */
function toMaskIcon(img) {
  const icon = document.createElement('span');
  icon.className = 'nav-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.style.setProperty('--icon', `url("${img.src}")`);
  (img.closest('picture') || img).replaceWith(icon);
  return icon;
}

/**
 * A list item's own label: its text outside nested lists and links (works
 * whether the text is a bare text node or wrapped in a <p>).
 * @param {HTMLLIElement} li list item
 * @returns {string}
 */
function ownText(li) {
  const clone = li.cloneNode(true);
  clone.querySelectorAll('ul, ol, a, picture, img').forEach((el) => el.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

/**
 * A list item's direct link (bare, or wrapped in a <p>).
 * @param {HTMLLIElement} li list item
 * @returns {HTMLAnchorElement|null}
 */
function directLink(li) {
  return li.querySelector(':scope > a, :scope > p > a');
}

/**
 * Builds a drawer (megamenu panel) from an authored list:
 * - item with an icon (svg) link      -> lead link (e.g. deals)
 * - item with a nested list           -> titled link group
 * - item with a picture link          -> image tile
 * - item with a plain link            -> group link
 * @param {HTMLUListElement} list authored sub list
 * @param {string} id drawer id
 * @returns {HTMLDivElement}
 */
function buildDrawer(list, id) {
  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  drawer.id = id;
  const inner = document.createElement('div');
  inner.className = 'nav-drawer-inner';
  const column = document.createElement('div');
  column.className = 'nav-drawer-column';
  const tiles = document.createElement('ul');
  tiles.className = 'nav-drawer-tiles';
  const loose = document.createElement('ul');
  loose.className = 'nav-drawer-links';

  [...list.children].forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    const link = directLink(li);
    const img = link && link.querySelector('img');
    if (sub) {
      const heading = document.createElement('p');
      heading.className = 'nav-drawer-heading';
      heading.textContent = ownText(li);
      sub.className = 'nav-drawer-links';
      column.append(heading, sub);
    } else if (img && /\.svg(\?|$)/i.test(img.src)) {
      link.className = 'nav-drawer-lead';
      toMaskIcon(img);
      const lead = document.createElement('div');
      lead.className = 'nav-drawer-lead-wrap';
      lead.append(link);
      column.prepend(lead);
    } else if (img) {
      link.className = 'nav-tile';
      const media = document.createElement('span');
      media.className = 'nav-tile-media';
      media.append(img.closest('picture') || img);
      const title = document.createElement('span');
      title.className = 'nav-tile-title';
      title.textContent = link.textContent.trim();
      link.replaceChildren(title, media);
      const item = document.createElement('li');
      item.append(link);
      tiles.append(item);
    } else if (link) {
      loose.append(li);
    }
  });
  if (loose.children.length) column.append(loose);
  inner.append(column);
  if (tiles.children.length) inner.append(tiles);
  drawer.append(inner);
  return drawer;
}

/**
 * Builds the account popup from an authored list: text items become the
 * greeting / note, plain links become buttons, icon links become a list.
 * @param {HTMLUListElement} list authored list
 * @param {string} id popup id
 * @returns {HTMLDivElement}
 */
function buildPopup(list, id) {
  const popup = document.createElement('div');
  popup.className = 'nav-popup';
  popup.id = id;
  const iconLinks = document.createElement('ul');
  iconLinks.className = 'nav-popup-links';
  let buttons = 0;
  [...list.children].forEach((li) => {
    const link = li.querySelector('a');
    const img = link && link.querySelector('img');
    if (!link) {
      const text = document.createElement('p');
      text.className = popup.querySelector('.nav-popup-title') ? 'nav-popup-note' : 'nav-popup-title';
      text.textContent = li.textContent.trim();
      popup.append(text);
    } else if (img) {
      toMaskIcon(img);
      link.className = 'nav-popup-link';
      iconLinks.append(li);
    } else {
      link.className = `nav-popup-button ${buttons === 0 ? 'primary' : 'secondary'}`;
      buttons += 1;
      popup.append(link);
    }
  });
  if (iconLinks.children.length) {
    const divider = document.createElement('hr');
    popup.append(divider, iconLinks);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-close';
  close.setAttribute('aria-label', 'Close');
  popup.prepend(close);
  return popup;
}

/**
 * Builds the search bar from the authored search link: the link's query
 * key is the parameter name, the item text is the placeholder.
 * @param {HTMLAnchorElement} link authored search link
 * @param {string} placeholder placeholder text
 * @returns {HTMLDivElement}
 */
function buildSearch(link, placeholder) {
  const url = new URL(link.href);
  const [param] = [...url.searchParams.keys()];
  const bar = document.createElement('div');
  bar.className = 'nav-search';
  const form = document.createElement('form');
  form.action = `${url.origin}${url.pathname}`;
  form.method = 'get';
  form.setAttribute('role', 'search');
  const input = document.createElement('input');
  input.type = 'search';
  input.name = param || 'q';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder || 'Search');
  input.autocomplete = 'off';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.setAttribute('aria-label', 'Search');
  const icon = link.querySelector('.nav-icon');
  if (icon) submit.append(icon.cloneNode());
  form.append(input, submit);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-close';
  close.setAttribute('aria-label', 'Close search');
  bar.append(form, close);
  return bar;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navData = await fetchNav();
  if (!navData) return;
  const fragment = document.createElement('div');
  fragment.innerHTML = navData.html;
  resolveImages(fragment, navData.base);
  const [brandSection, menuSection, toolsSection] = [...fragment.children];

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');

  // brand
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSection) {
    const logo = brandSection.querySelector('a');
    if (logo) {
      logo.setAttribute('aria-label', logo.querySelector('img')?.alt || logo.textContent.trim());
      brand.append(logo);
    }
  }

  // primary menu: each item with a sub list becomes a drawer trigger
  const sections = document.createElement('div');
  sections.className = 'nav-sections';
  const menu = menuSection && menuSection.querySelector('ul');
  const drops = [];
  if (menu) {
    menu.className = 'nav-menu';
    [...menu.children].forEach((li, i) => {
      const sub = li.querySelector(':scope > ul');
      if (!sub) return;
      li.className = 'nav-drop';
      const label = ownText(li);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-trigger';
      button.textContent = label;
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', `nav-drawer-${i}`);
      const drawer = buildDrawer(sub, `nav-drawer-${i}`);
      li.replaceChildren(button, drawer);
      drops.push(li);
    });
    sections.append(menu);
  }

  // tools: CTA link, icon links / buttons (search, popup)
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  let searchBar = null;
  const popups = [];
  if (toolsSection) {
    const cta = toolsSection.querySelector(':scope > p > a');
    if (cta) {
      cta.className = 'nav-cta';
      const ctaWrap = document.createElement('div');
      ctaWrap.className = 'nav-cta-wrap';
      ctaWrap.append(cta);
      sections.append(ctaWrap);
    }
    const toolList = toolsSection.querySelector(':scope > ul');
    if (toolList) {
      toolList.className = 'nav-tool-list';
      [...toolList.children].forEach((li, i) => {
        const link = directLink(li);
        if (!link) return;
        const img = link.querySelector('img');
        const label = img?.alt || link.textContent.trim();
        if (img) toMaskIcon(img);
        link.setAttribute('aria-label', label);
        link.className = 'nav-tool';
        const sub = li.querySelector(':scope > ul');
        const text = ownText(li);
        if (sub) {
          // popup trigger
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'nav-tool';
          button.setAttribute('aria-label', label);
          button.setAttribute('aria-expanded', 'false');
          button.setAttribute('aria-controls', `nav-popup-${i}`);
          button.append(...link.childNodes);
          const popup = buildPopup(sub, `nav-popup-${i}`);
          li.replaceChildren(button, popup);
          popups.push(li);
        } else if (text && new URL(link.href).search) {
          // search trigger: opens the search bar instead of navigating
          searchBar = buildSearch(link, text);
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'nav-tool';
          button.setAttribute('aria-label', label);
          button.setAttribute('aria-expanded', 'false');
          button.append(...link.childNodes);
          li.replaceChildren(button);
          li.classList.add('nav-tool-search');
        }
      });
      tools.append(toolList);
    }
  }

  // hamburger (mobile)
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = '<button type="button" aria-controls="nav" aria-label="Open navigation"><span class="nav-hamburger-icon"></span></button>';

  nav.append(hamburger, brand, sections, tools);
  if (searchBar) nav.append(searchBar);

  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';

  // --- state helpers ---
  const setDrawer = (li, open) => {
    const button = li.querySelector('.nav-trigger');
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  const closeDrawers = () => drops.forEach((li) => setDrawer(li, false));
  // the bar shows only logo + close while an account panel is open (mobile)
  const setPopup = (li, open) => {
    li.querySelector(':scope > button').setAttribute('aria-expanded', open ? 'true' : 'false');
    const anyOpen = popups.some((p) => p.querySelector(':scope > button').getAttribute('aria-expanded') === 'true');
    nav.classList.toggle('is-popup-open', anyOpen);
    document.body.style.overflowY = anyOpen && !isDesktop.matches ? 'hidden' : '';
  };
  const closePopups = () => popups.forEach((li) => setPopup(li, false));
  const syncOverlay = () => {
    const anyOpen = drops.some((li) => li.querySelector('.nav-trigger').getAttribute('aria-expanded') === 'true');
    overlay.classList.toggle('is-active', isDesktop.matches && anyOpen);
  };
  const openSearch = (open) => {
    nav.classList.toggle('is-searching', open);
    const trigger = nav.querySelector('.nav-tool-search > button');
    if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      closeDrawers();
      closePopups();
      syncOverlay();
      searchBar.querySelector('input').focus();
    }
  };
  const toggleMenu = (force) => {
    const expanded = !isDesktop.matches
      && (typeof force === 'boolean' ? force : !nav.classList.contains('is-menu-open'));
    // the menu state lives on the hamburger button (the control), not the nav
    nav.classList.toggle('is-menu-open', expanded);
    const hamburgerButton = hamburger.querySelector('button');
    hamburgerButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    hamburgerButton.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
    document.body.style.overflowY = expanded && !isDesktop.matches ? 'hidden' : '';
    if (!expanded) closeDrawers();
  };

  // pointer-hover state (more reliable than :hover at click time)
  const hovered = new Set();

  // --- drawers: hover on desktop, click everywhere ---
  drops.forEach((li) => {
    const button = li.querySelector('.nav-trigger');
    li.addEventListener('mouseenter', () => {
      hovered.add(li);
      if (!isDesktop.matches || nav.classList.contains('is-searching')) return;
      closeDrawers();
      setDrawer(li, true);
      syncOverlay();
    });
    li.addEventListener('mouseleave', () => {
      hovered.delete(li);
      if (!isDesktop.matches) return;
      setDrawer(li, false);
      syncOverlay();
    });
    button.addEventListener('click', () => {
      // a drawer opened by hover stays open when its trigger is clicked
      const open = (isDesktop.matches && hovered.has(li)) || button.getAttribute('aria-expanded') !== 'true';
      closeDrawers();
      setDrawer(li, open);
      syncOverlay();
    });
  });

  // --- popups ---
  popups.forEach((li) => {
    const button = li.querySelector(':scope > button');
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = (isDesktop.matches && hovered.has(li)) || button.getAttribute('aria-expanded') !== 'true';
      closePopups();
      setPopup(li, open);
    });
    li.querySelector('.nav-close').addEventListener('click', () => setPopup(li, false));
    // desktop: the popup also opens on hover and closes when the pointer leaves
    li.addEventListener('mouseenter', () => {
      hovered.add(li);
      if (!isDesktop.matches) return;
      closePopups();
      setPopup(li, true);
    });
    li.addEventListener('mouseleave', () => {
      hovered.delete(li);
      if (isDesktop.matches) setPopup(li, false);
    });
  });
  document.addEventListener('click', (e) => {
    if (!popups.some((li) => li.contains(e.target))) closePopups();
  });

  // --- search ---
  if (searchBar) {
    nav.querySelector('.nav-tool-search > button').addEventListener('click', () => openSearch(true));
    searchBar.querySelector('.nav-close').addEventListener('click', () => openSearch(false));
  }

  overlay.addEventListener('click', () => {
    closeDrawers();
    syncOverlay();
  });
  hamburger.querySelector('button').addEventListener('click', () => toggleMenu());
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    closeDrawers();
    closePopups();
    syncOverlay();
    if (nav.classList.contains('is-searching')) openSearch(false);
    if (nav.classList.contains('is-menu-open')) toggleMenu(false);
  });

  // reset state when crossing the desktop breakpoint
  toggleMenu(false);
  isDesktop.addEventListener('change', () => {
    toggleMenu(false);
    closeDrawers();
    closePopups();
    syncOverlay();
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav, overlay);
  block.append(navWrapper);
}
