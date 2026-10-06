/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: HP (hp.com) site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html
 * (https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html).
 *
 * NOTE: `.spacing.aem-GridColumn` elements are intentionally NOT removed in
 * beforeTransform — section selectors and block parser selectors depend on
 * `.spacing:has(#benefits) + .backgroundContainer` and
 * `.spacing:has(#portfolio) + .backgroundContainer` adjacency.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

function normalize(text) {
  return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, [
      // Global header: first <section> inside #content (skip links, digitnav, #data-sso, templates)
      '#content > section:first-child',
      '.digitnav-a11y-nav',
      '#data-sso',
      'template',
      // Global footer: <digitnav-footer id="footer"> and its wrapping <section>
      '#content > section:has(#footer)',
      '#footer',
      // OneTrust cookie consent
      '#onetrust-consent-sdk',
      // Video modal grid column (c-hp-modal#video-1) + global iframe modal
      '.modal.aem-GridColumn',
      'c-hp-modal',
      // Global overlays / translation strings
      '.digitnav__overlay',
      '#hp-translations-map',
      // Anchor-nav mobile "Overview" dropdown title + hidden measuring helper list
      '.c-hp-anchor-nav__dropdown',
      '.c-hp-anchor-nav__mode-helper',
      // Non-authorable UI controls (accordion expand icons, video play/pause triggers)
      '.c-hp-collapsible-section__expand-btn',
      '.c-video-triggers',
    ]);

    // Hidden visually-duplicated text: title-and-text subtitles that repeat the heading
    // (e.g. Featured products: hidden <p> duplicating "Meet the fast, intelligent Windows PCs").
    element.querySelectorAll('.c-hp-tat').forEach((tat) => {
      const title = tat.querySelector('.c-hp-tat__title');
      if (!title) return;
      const titleText = normalize(title.textContent);
      if (!titleText) return;
      tat.querySelectorAll('.c-hp-tat__subtitle p').forEach((p) => {
        if (normalize(p.textContent) === titleText) p.remove();
      });
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Empty spacing grid columns (only now, after sections/parsers have run)
    WebImporter.DOMUtils.remove(element, [
      '.spacing.aem-GridColumn',
      // Scripts, styles, tracking, embeds
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
      'source',
      'img[width="1"][height="1"]',
    ]);

    // Tracking pixels injected at runtime (no size attrs): drop any image not
    // served from HP, along with a wrapper left empty by the removal.
    element.querySelectorAll('img').forEach((img) => {
      const src = (img.getAttribute('src') || '').trim();
      // absolute or protocol-relative only; relative paths are same-origin (HP)
      if (!/^(https?:)?\/\//i.test(src)) return;
      let host = '';
      try { host = new URL(src, 'https://www.hp.com').hostname; } catch (e) { return; }
      if (/(^|\.)hp\.com$/i.test(host)) return;
      const wrapper = img.closest('p, picture') || img;
      wrapper.remove();
    });

    // Headings wrapping a single <p> (e.g. <h2 class="title-medium"><p>..</p></h2>) -> unwrap
    element.querySelectorAll('h1 > p, h2 > p, h3 > p, h4 > p, h5 > p, h6 > p').forEach((p) => {
      p.replaceWith(...p.childNodes);
    });

    // Empty paragraphs left by the source CMS
    element.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, picture, a, br + *')) p.remove();
    });

    // Tracking / behavior attributes
    element.querySelectorAll('[onclick], [data-gtm-category], [data-gtm-id], [data-track]').forEach((el) => {
      el.removeAttribute('onclick');
      el.removeAttribute('data-gtm-category');
      el.removeAttribute('data-gtm-id');
      el.removeAttribute('data-track');
    });
  }
}
