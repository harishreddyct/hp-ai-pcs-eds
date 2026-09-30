/**
 * Shared capture helpers used by validate.js — navigates a page at a given
 * viewport width, waits out EDS's hidden-until-decorated body, and pulls
 * screenshots + computed-style measurements. Kept separate from validate.js
 * so it can be reused for reference-only or implementation-only runs.
 */
const fs = require('fs');
const path = require('path');

// The implementation is an EDS page, so content lives under a real <main>.
// The reference (a non-EDS site) may have no <main> landmark at all, so its
// scope falls back to <body> — which will also sweep in header/nav/footer
// chrome. That's expected: this project intentionally simplifies that
// chrome (see docs/measurements-next-gen-ai-pcs.md), so the diff output
// labels chrome-related mismatches rather than treating every one as a defect.
function selectorsFor(scope) {
  return {
    heading: `${scope} h1, ${scope} h2, ${scope} h3`,
    text: `${scope} p`,
    button: `${scope} a.button, ${scope} .button`,
    image: `${scope} img`,
  };
}

async function waitForDecoration(page) {
  // EDS starts `body { display: none }` and reveals it once scripts.js
  // finishes decoration and adds `.appear` — a screenshot taken before that
  // is reliably blank. Fall back to a fixed wait if `.appear` never lands
  // (e.g. when navigating to an external reference site that has no EDS
  // pipeline at all).
  try {
    await page.waitForSelector('body.appear', { timeout: 8000 });
  } catch {
    await page.waitForTimeout(3000);
  }
  // let lazy-loaded images/fonts settle
  await page.waitForTimeout(500);
}

function extractElements(selector, extraStyles = []) {
  return ([sel, extra]) => [...document.querySelectorAll(sel)]
    .filter((el) => el.getBoundingClientRect().width > 0 && el.textContent.trim().length > 0)
    .map((el) => {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const styles = {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        color: cs.color,
        marginTop: cs.marginTop,
        marginBottom: cs.marginBottom,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
      };
      extra.forEach((prop) => { styles[prop] = cs[prop]; });
      return {
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim().slice(0, 80),
        rect: {
          x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height),
        },
        styles,
      };
    });
}

async function measure(page, scope) {
  const sel = selectorsFor(scope);
  const headings = await page.evaluate(extractElements(), [sel.heading, []]);
  const paragraphs = await page.evaluate(extractElements(), [sel.text, []]);
  const buttons = await page.evaluate(
    extractElements(),
    [sel.button, ['backgroundColor', 'borderRadius']],
  );
  const images = await page.evaluate(([s]) => [...document.querySelectorAll(s)]
    .filter((el) => el.getBoundingClientRect().width > 0)
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        alt: el.alt,
        src: el.currentSrc || el.src,
        rect: {
          width: Math.round(rect.width), height: Math.round(rect.height),
        },
        natural: { width: el.naturalWidth, height: el.naturalHeight },
      };
    }), [sel.image]);

  const consoleErrors = page.__consoleErrors || [];

  return {
    headingOutline: headings.map((h) => `${h.tag}: ${h.text}`),
    headings,
    paragraphs,
    buttons,
    images,
    consoleErrors,
  };
}

async function capturePage(browser, {
  url, width, height, label, outDir, blockSelectors, scope = 'main',
}) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.__consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') page.__consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => page.__consoleErrors.push(err.message));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForDecoration(page);

  const actualWidth = await page.evaluate(() => window.innerWidth);

  fs.mkdirSync(path.join(outDir, 'screenshots'), { recursive: true });
  const screenshotPath = path.join(outDir, 'screenshots', `${label}-${width}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const blockShots = {};
  if (blockSelectors) {
    const blockDir = path.join(outDir, 'screenshots', `${label}-${width}-blocks`);
    fs.mkdirSync(blockDir, { recursive: true });
    for (const sel of blockSelectors) {
      const locator = page.locator(sel).first();
      // eslint-disable-next-line no-await-in-loop
      const count = await page.locator(sel).count();
      if (count === 0) continue;
      const file = path.join(blockDir, `${sel.replace(/[^a-z0-9-]/gi, '_')}.png`);
      try {
        // eslint-disable-next-line no-await-in-loop
        await locator.screenshot({ path: file });
        blockShots[sel] = file;
      } catch {
        blockShots[sel] = null;
      }
    }
  }

  const data = await measure(page, scope);
  await page.close();

  return {
    label, width, requestedWidth: width, actualWidth, screenshotPath, blockShots, ...data,
  };
}

module.exports = { capturePage, waitForDecoration };
