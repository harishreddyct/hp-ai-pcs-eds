/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: HP section breaks + Section Metadata (Id / Style).
 * Section selectors come from payload.template.sections (page-templates.json),
 * verified against migration-work/cleaned.html.
 *
 * Marker strategy: section boundary <hr>s are PREPENDED inside each section's
 * wrapper element (e.g. .backgroundContainer.aem-GridColumn) rather than inserted
 * before it. Several section and parser selectors rely on sibling adjacency
 * (`.spacing:has(#benefits) + .backgroundContainer`, `.experiencefragment + .backgroundContainer`,
 * `.mediaContent + .backgroundContainer`) which an <hr> sibling would break.
 * Parsers target inner components (c-hp-bg-container, .c-hp-row, ...), so the
 * prepended markers survive parsing.
 *
 * Section Metadata is placed at the END of each section (immediately before the
 * next section's <hr>, or before an end marker for the last section), matching
 * content/index.plain.html. Rows: Id (anchor id used by section-nav) then Style.
 */

// From migration-work/section-anchor-ids.json
const SECTION_ANCHOR_IDS = {
  rc4: 'benefits',
  rc6: 'portfolio',
  rc7: 'products',
  rc8: 'roi-calculator',
  rc15: 'faqs',
};

const MARKER_ATTR = 'data-excat-section-id';
const END_MARKER_ATTR = 'data-excat-section-end';

function querySection(root, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector in this environment — try the next one
    }
  }
  return null;
}

// photo-bg sections: hoist the background image into its own <p> as the first
// default-content element of the section (CSS: .photo-bg .default-content-wrapper > p:first-child img).
function hoistBackgroundImage(sectionEl, marker) {
  const img = sectionEl.querySelector('.c-hp-bg-container__media-wrapper img');
  if (!img) return;
  const wrapper = img.closest('.c-hp-bg-container__media-wrapper');
  const p = document.createElement('p');
  p.append(img);
  marker.after(p);
  if (wrapper) wrapper.remove();
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;

  if (hookName === 'beforeTransform') {
    let endMarkerPlaced = false;
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue;

      const hr = document.createElement('hr');
      hr.setAttribute(MARKER_ATTR, section.id);
      sectionEl.prepend(hr);

      if (!endMarkerPlaced) {
        const end = document.createElement('hr');
        end.setAttribute(END_MARKER_ATTR, 'true');
        sectionEl.append(end);
        endMarkerPlaced = true;
      }

      if (section.style && /(^|,\s*)photo-bg(\s*,|$)/.test(section.style)) {
        hoistBackgroundImage(sectionEl, hr);
      }
    }
  }

  if (hookName === 'afterTransform') {
    const markers = sections.map((s) => element.querySelector(`hr[${MARKER_ATTR}="${s.id}"]`));
    const endMarker = element.querySelector(`hr[${END_MARKER_ATTR}]`);

    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!markers[i]) continue; // section not found on this page

      const cells = {};
      const anchorId = SECTION_ANCHOR_IDS[section.id];
      if (anchorId) cells.Id = anchorId;
      if (section.style) cells.Style = section.style;
      if (!Object.keys(cells).length) continue;

      // insertion point: next present section marker, else end marker
      let next = null;
      for (let j = i + 1; j < markers.length; j += 1) {
        if (markers[j]) { next = markers[j]; break; }
      }
      if (!next) next = endMarker;

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells,
      });
      if (next) next.before(metadataBlock);
      else markers[i].parentElement.append(metadataBlock);
    }

    // Finalize markers: first section gets no leading break; others become plain <hr>
    markers.forEach((m, i) => {
      if (!m) return;
      if (m === markers.find(Boolean)) m.remove();
      else m.removeAttribute(MARKER_ATTR);
    });
    if (endMarker) endMarker.remove();
  }
}
