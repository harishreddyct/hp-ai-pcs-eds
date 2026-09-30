#!/usr/bin/env node
/**
 * Visual/measurement validation loop for this project, per
 * .claude/skills/reference-site-replication/references/visual-validation.md.
 *
 * Runs the implementation (and, optionally, the reference) through Chromium
 * at each required breakpoint: full-page + per-block screenshots, computed
 * -style measurements for headings/paragraphs/buttons/images, and console
 * error capture. When both are captured, prints a heading-outline diff and
 * flags any console errors.
 *
 * Usage:
 *   node tools/playwright/validate.js [--breakpoints=375,768,960,1200,1440]
 *     [--url=<implementation-url>] [--reference=<reference-url>] [--no-reference]
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { capturePage } = require('./capture');

const DEFAULT_URL = 'https://main--hp-ai-pcs-eds--harishreddyct.aem.live/';
const DEFAULT_REFERENCE = 'https://www.hp.com/us-en/ai-solutions/next-gen-ai-pcs.html';

const BLOCK_SELECTORS = [
  'header .header',
  '.hero',
  '.section-nav',
  '.cards.benefits',
  '.cards.portfolio',
  '.cards.product',
  '.columns.alternating',
  '.promo:not(.dark)',
  '.promo.dark',
  '.accordion',
  'footer .footer',
];

function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2)
      .filter((a) => a.startsWith('--'))
      .map((a) => a.replace(/^--/, '').split('=')),
  );
  return {
    url: args.url || DEFAULT_URL,
    reference: 'no-reference' in args ? null : (args.reference || DEFAULT_REFERENCE),
    breakpoints: (args.breakpoints || '375,768,960,1200,1440').split(',').map(Number),
    outDir: args.out || path.join(__dirname, '..', '..', 'reports'),
  };
}

function diffHeadingOutlines(implOutline, refOutline) {
  const max = Math.max(implOutline.length, refOutline.length);
  const diffs = [];
  for (let i = 0; i < max; i += 1) {
    if (implOutline[i] !== refOutline[i]) {
      diffs.push({ index: i, implementation: implOutline[i] || '(missing)', reference: refOutline[i] || '(missing)' });
    }
  }
  return diffs;
}

async function run() {
  const {
    url, reference, breakpoints, outDir,
  } = parseArgs();
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = { implementation: {}, reference: {} };

  try {
    for (const width of breakpoints) {
      console.log(`\n=== ${width}px ===`);

      const impl = await capturePage(browser, {
        url, width, height: 1000, label: 'impl', outDir, blockSelectors: BLOCK_SELECTORS,
      });
      results.implementation[width] = impl;
      console.log(`implementation: viewport confirmed ${impl.actualWidth}px, ${impl.headings.length} headings, ${impl.images.length} images, ${impl.buttons.length} buttons, ${impl.consoleErrors.length} console errors`);
      if (impl.consoleErrors.length) impl.consoleErrors.forEach((e) => console.log(`  [console error] ${e}`));

      if (reference) {
        const ref = await capturePage(browser, {
          url: reference, width, height: 1000, label: 'ref', outDir, blockSelectors: null, scope: 'body',
        });
        results.reference[width] = ref;
        console.log(`reference:      viewport confirmed ${ref.actualWidth}px, ${ref.headings.length} headings, ${ref.images.length} images, ${ref.buttons.length} buttons, ${ref.consoleErrors.length} console errors`);

        const headingDiffs = diffHeadingOutlines(impl.headingOutline, ref.headingOutline);
        if (headingDiffs.length) {
          console.log(`  heading-outline diff (${headingDiffs.length} position(s) differ; reference includes site chrome this project intentionally simplified, e.g. cart/global-nav headings — not all diffs are defects):`);
          headingDiffs.slice(0, 15).forEach((d) => console.log(`    [${d.index}] impl="${d.implementation}"  ref="${d.reference}"`));
        } else {
          console.log('  heading outline matches exactly.');
        }
      }
    }
  } finally {
    await browser.close();
  }

  const jsonPath = path.join(outDir, 'playwright-validation.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\nFull measurements + screenshots written under ${outDir}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
