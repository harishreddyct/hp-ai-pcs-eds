/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import sectionNavParser from './parsers/section-nav.js';
import cardsBenefitsParser from './parsers/cards-benefits.js';
import cardsPortfolioParser from './parsers/cards-portfolio.js';
import cardsProductParser from './parsers/cards-product.js';
import promoParser from './parsers/promo.js';
import cardsFeatureParser from './parsers/cards-feature.js';
import promoDarkParser from './parsers/promo-dark.js';
import accordionParser from './parsers/accordion.js';
import footnotesParser from './parsers/footnotes.js';

// TRANSFORMER IMPORTS
import hpCleanupTransformer from './transformers/hp-cleanup.js';
import hpSectionsTransformer from './transformers/hp-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero': heroParser,
  'section-nav': sectionNavParser,
  'cards-benefits': cardsBenefitsParser,
  'cards-portfolio': cardsPortfolioParser,
  'cards-product': cardsProductParser,
  'promo': promoParser,
  'cards-feature': cardsFeatureParser,
  'promo-dark': promoDarkParser,
  'accordion': accordionParser,
  'footnotes': footnotesParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "ai-solutions",
  "description": "HP AI solutions landing page: split hero, sticky anchor nav, photo-bg benefits, card grids, split promo banners, FAQ accordion and footnotes",
  "urls": [
    "https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html"
  ],
  "blocks": [
    {
      "name": "hero",
      "instances": [
        ".c-hp-hero-banner"
      ]
    },
    {
      "name": "section-nav",
      "instances": [
        ".c-hp-anchor-nav"
      ]
    },
    {
      "name": "cards-benefits",
      "instances": [
        ".spacing:has(#benefits) + .backgroundContainer .c-hp-grid-cell .c-hp-row"
      ]
    },
    {
      "name": "cards-portfolio",
      "instances": [
        ".spacing:has(#portfolio) + .backgroundContainer .c-hp-row"
      ]
    },
    {
      "name": "cards-product",
      "instances": [
        ".backgroundContainer:has(#products) .c-hp-row"
      ]
    },
    {
      "name": "promo",
      "instances": [
        ".experiencefragment:has(#roi-calculator) .c-hp-media-content",
        ".mediaContent:not(.experiencefragment .mediaContent) .c-hp-media-content",
        ".mediaContent + .backgroundContainer c-hp-bg-container",
        ".c-hp-contained-section-block"
      ]
    },
    {
      "name": "cards-feature",
      "instances": [
        ".experiencefragment + .backgroundContainer .c-hp-row"
      ]
    },
    {
      "name": "promo-dark",
      "instances": [
        ".backgroundContainer:has(.c-hp-bg-container--align-left) c-hp-bg-container"
      ]
    },
    {
      "name": "accordion",
      "instances": [
        ".backgroundContainer:has(#faqs) .c-hp-collapsible-section"
      ]
    },
    {
      "name": "footnotes",
      "instances": [
        "c-hp-footnotes"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc1",
      "name": "Hero",
      "selector": [
        ".heroBanner"
      ],
      "style": "no-margin",
      "blocks": [
        "hero"
      ],
      "defaultContent": []
    },
    {
      "id": "rc2",
      "name": "Anchor navigation",
      "selector": [
        ".anchorNavigation"
      ],
      "style": "no-margin",
      "blocks": [
        "section-nav"
      ],
      "defaultContent": []
    },
    {
      "id": "rc4",
      "name": "Benefits",
      "selector": [
        ".spacing:has(#benefits) + .backgroundContainer"
      ],
      "style": "photo-bg",
      "blocks": [
        "cards-benefits"
      ],
      "defaultContent": [
        ".c-hp-bg-container__media-wrapper img",
        ".c-hp-tat__title.title-medium",
        ".c-hp-tat__subtitle"
      ]
    },
    {
      "id": "rc6",
      "name": "Portfolio",
      "selector": [
        ".spacing:has(#portfolio) + .backgroundContainer"
      ],
      "style": "light",
      "blocks": [
        "cards-portfolio"
      ],
      "defaultContent": [
        ".c-hp-tat__title.title-medium",
        ".c-hp-tat__subtitle"
      ]
    },
    {
      "id": "rc7",
      "name": "Featured products",
      "selector": [
        ".backgroundContainer:has(#products)"
      ],
      "style": "centered",
      "blocks": [
        "cards-product"
      ],
      "defaultContent": [
        ".c-hp-tat__title.title-medium",
        ".c-hp-tat__subtitle"
      ]
    },
    {
      "id": "rc8",
      "name": "ROI calculator",
      "selector": [
        ".experiencefragment:has(#roi-calculator)"
      ],
      "style": "no-margin",
      "blocks": [
        "promo"
      ],
      "defaultContent": []
    },
    {
      "id": "rc9",
      "name": "Keep business moving",
      "selector": [
        ".experiencefragment + .backgroundContainer"
      ],
      "style": "light",
      "blocks": [
        "cards-feature"
      ],
      "defaultContent": [
        ".c-hp-tat__title.title-medium"
      ]
    },
    {
      "id": "rc10",
      "name": "HP IQ",
      "selector": [
        ".backgroundContainer:has(.c-hp-bg-container--align-left)"
      ],
      "style": "no-margin",
      "blocks": [
        "promo-dark"
      ],
      "defaultContent": []
    },
    {
      "id": "rc12",
      "name": "Windows security",
      "selector": [
        ".mediaContent:not(.experiencefragment .mediaContent)"
      ],
      "style": "no-margin, gray",
      "blocks": [
        "promo"
      ],
      "defaultContent": []
    },
    {
      "id": "rc13",
      "name": "Business-ready AI",
      "selector": [
        ".mediaContent + .backgroundContainer"
      ],
      "style": "no-margin, gray",
      "blocks": [
        "promo"
      ],
      "defaultContent": []
    },
    {
      "id": "rc14",
      "name": "Other home laptops",
      "selector": [
        ".containedSectionBlock"
      ],
      "style": "no-margin, gray",
      "blocks": [
        "promo"
      ],
      "defaultContent": []
    },
    {
      "id": "rc15",
      "name": "FAQ",
      "selector": [
        ".backgroundContainer:has(#faqs)"
      ],
      "style": "dark",
      "blocks": [
        "accordion"
      ],
      "defaultContent": [
        ".c-hp-tat__title.title-medium"
      ]
    },
    {
      "id": "rc16",
      "name": "Footnotes and disclaimers",
      "selector": [
        ".footnotes.aem-GridColumn"
      ],
      "style": "small-print, gray",
      "blocks": [
        "footnotes"
      ],
      "defaultContent": []
    }
  ]
};

// TRANSFORMER REGISTRY - cleanup first, then sections (section metadata runs in afterTransform)
const transformers = [
  hpCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [hpSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for block "${blockDef.name}": ${selector}`);
      }
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Initial cleanup + section markers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section breaks / section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root URL maps to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
