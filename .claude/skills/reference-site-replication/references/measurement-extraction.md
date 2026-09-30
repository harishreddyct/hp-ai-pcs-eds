# Measurement extraction (measure before you build)

This is Phase 3.5, and it is the single highest-leverage step for accuracy. The
most common reason a replicated page "looks off" — wrong spacing, wrong type,
padding/margins that are close-but-not-right, missing content — is that it was
built from a screenshot and a sense of what looks reasonable, then only checked
against real values later (if at all). **You cannot match a value you never
measured.** Extract the reference's actual computed values first, record them,
and build against that record as a spec.

Discovery (Phase 1) answers *what exists* — the components, regions, and
interactions. This phase answers *how they are sized, spaced, and styled* — the
concrete numbers. Don't conflate the two: a component inventory with no measured
values is not a build spec.

## When this happens

After naming/reuse decisions (Phase 3) and before writing any component code
(Phase 4). If you find yourself in Phase 4 choosing a "reasonable-looking"
padding, gap, font-size, or margin, you skipped this phase — stop and measure.

## Tools

Measure the *live* reference with real computed values, never eyeball a
screenshot:

- **`getComputedStyle(el)`** — the actual resolved `font-size`, `font-weight`,
  `line-height`, `letter-spacing`, `text-transform`, `color`, `padding`,
  `margin`, `gap`, `background`, etc. This is ground truth; a screenshot is not.
- **`el.getBoundingClientRect()`** — the actual rendered box (x, y, width,
  height), for layout skeleton and region/seam measurement.
- **Browser automation** (Playwright, or the environment's browser tools) to
  set each viewport width and run the extraction script at each breakpoint.
  Confirm the viewport actually resized (read `window.innerWidth`) before
  trusting any measurement taken after a resize.

## What to measure (five categories)

For every component identified in Phase 1, at every required breakpoint
(375 / 768 / 960 / 1200, plus wide spot-checks at 1440 / 1920 for anything
"fluid" or "full-bleed"):

1. **Layout dimensions** — `getBoundingClientRect()` of the container and its
   children. Card widths, image boxes, grid track widths, max-widths.
2. **Typography** — per heading/paragraph/label/button: `font-size`,
   `font-weight`, `font-family`, `line-height`, `letter-spacing`,
   `text-transform`, and `color` (real rgb/hex, not eyeballed).
3. **Spacing** — `padding` (all four sides) on every container; `margin`
   (especially heading `margin-top`) on every text element; `gap` on every
   grid/flex container. Plus the **seams**: vertical gap between sections,
   header→content, and content→footer.
4. **Layout skeleton** — every top-level region in document order with its
   bounding box and its left/right content inset (gutter), per breakpoint. This
   captures column/sidebar structure and section order that a per-component pass
   misses.
5. **Content inventory** — the ordered text outline: every heading and paragraph
   inside `main`, in document order, verbatim. This is what catches missing,
   renamed, or misplaced content before it ships.

## Reusable extraction script

Run this in the reference page's console (or via a browser-automation
`evaluate`) at each breakpoint. Adapt the selector set to the page.

```javascript
(() => {
  const round = (n) => Math.round(n * 10) / 10;
  const pick = (s) => ({
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    textTransform: s.textTransform,
    color: s.color,
    margin: `${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`,
    padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
  });

  // typography + spacing on every meaningful text/interactive element
  const typo = [...document.querySelectorAll('main h1, main h2, main h3, main h4, main p, main a, main button, main li')]
    .filter((el) => el.offsetParent !== null && el.textContent.trim())
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim().slice(0, 60),
        box: { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) },
        ...pick(getComputedStyle(el)),
      };
    });

  // layout skeleton: top-level regions in document order, with gutter
  const main = document.querySelector('main');
  const skeleton = main ? [...main.children].map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      cls: el.className,
      box: { x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height) },
      gutterL: cs.paddingLeft,
      gutterR: cs.paddingRight,
      gap: cs.gap,
    };
  }) : [];

  // ordered content inventory
  const content = [...document.querySelectorAll('main h1, main h2, main h3, main h4, main p')]
    .filter((el) => el.offsetParent !== null && el.textContent.trim())
    .map((el) => `${el.tagName.toLowerCase()}: ${el.textContent.trim()}`);

  return { viewport: window.innerWidth, typo, skeleton, content };
})();
```

For chrome (header/footer), run a second pass that also measures the
**scrolled** state (`window.scrollTo(0, 600)` then re-measure) — see the chrome
rule below.

## How to record

Write the extracted values into a per-page measurements document in the target
project's docs (e.g. `docs/measurements-{page}.md`). This is the spec Phase 4
builds against and Phase 6 diffs against. A table per breakpoint is enough:

```
## Home — 1200px

### Typography
| Element | font-size | weight | line-height | letter-spacing | transform | color |
|---|---|---|---|---|---|---|
| h1 (hero) | 44px | 700 | 52.8px | normal | none | rgb(0,62,126) |
| p (body)  | 16px | 400 | 24px | normal | none | rgb(45,45,45) |

### Spacing / seams
| Region | padding | margin-top | gap | notes |
|---|---|---|---|---|
| section (generic) | 0 | — | — | vertical rhythm from heading margins only |
| content→footer | — | 48px | — | footer margin-top |

### Layout skeleton (document order)
| Region | x | y | w | h | gutter L/R |
|---|---|---|---|---|---|
| hero | 0 | 108 | 1200 | 560 | 0 / 0 |
| section-1 | 0 | 668 | 1200 | 420 | 32 / 32 |

### Content inventory (ordered)
1. h1: Industrial AI Designed for Optimizing Operations
2. p:  Connect the imaginations of people…
```

Record real measured values only — never estimated or invented ones. A value
you didn't measure is "not measured," not a guess dressed up as a fact.

## Critical extraction rules

These are the mistakes that most often survive into a shipped build. They are
covered in more depth (with the confirmed real-world failures behind each) in
`visual-validation.md`; the point here is to catch them *while extracting*, so
the build spec is right from the start rather than corrected after the fact.

- **Measure mobile first.** Take the *first* measurement of any element at the
  narrowest required width, then record wider breakpoints as explicit deltas. A
  value measured once at desktop and assumed to hold at mobile is a frequent,
  high-impact miss (a card body that's 14px mobile / 18px desktop, etc.).
- **A value confirmed at one breakpoint is not confirmed at another.** Read the
  computed value at each tier — don't interpolate a trend from one or two
  samples. A property can be entirely off below one breakpoint and on above it.
- **Never inherit a spacing/sizing value from an earlier phase without
  measuring it.** Any padding/margin set during scaffolding, a mock-content
  pass, or copied from a template is a placeholder, not a fact — including
  shared `.section`/container padding. Measure the reference's real value (it is
  often zero, with all rhythm coming from heading/paragraph margins).
- **Measure chrome in its scrolled state too, not just at scroll 0.** Sticky/
  fixed headers commonly shrink/collapse on scroll; measure at the top *and*
  after scrolling, and note `position: sticky` vs `fixed`.
- **Sweep chrome across all breakpoints like any other component** — header
  height, logo size, nav padding, utility-bar height can each have their own
  second breakpoint state.
- **Measure seams, not just regions** — the content→footer gap and header→
  content gap belong to neither block; no per-block pass will catch them.
- **Measure each region's left/right gutter at every breakpoint** — a fixed
  gutter that matches at one wide width will hug the edges at narrower widths if
  the reference's gutter scales.
- **Don't infer a grid variant from item count** — measure a card's width
  against the base grid track before inventing a "3-column" variant; three items
  in a 4-column grid with an empty cell is not a new component.
- **Measure per instance, not just per component** — the same shared component
  can carry different authored properties (an eyebrow, a badge, an icon) on
  different pages; confirm on every instance, not just the first.
- **`letter-spacing` on uppercase/label text is usually `normal`** — don't add a
  reflexive `0.02em`; measure it (it is very often `normal` on the reference).
- **Pull `min-height` on overlapping cards/captions** — a caption card can match
  on width/position/overlap and still be wrong because it has a load-bearing
  `min-height` you didn't measure.
- **A matching `getComputedStyle().fontFamily`/`fontWeight` string does not
  mean the intended font actually rendered.** `font-family` reports the
  *declared* stack, not which font in it the browser resolved to — if the
  target project's `@font-face` is missing, broken, or 404s (an empty
  `fonts/` folder, a typo'd `src` path), the computed value still echoes the
  declared family unchanged while the browser silently renders a fallback.
  Same blind spot for weight: a declared `600` can render as a
  browser-synthesized fake-bold if that exact cut was never loaded. A
  computed-style diff that only compares these strings can report a false
  match on a real visual defect. Confirm the font actually loaded, on both
  sides, with the Font Loading API:
  ```javascript
  await document.fonts.ready;
  document.fonts.check('600 16px "Source Sans Pro"'); // false if never loaded
  ```
  Run this on the *reference* too (not just the implementation) to learn
  which weights are genuinely available there versus synthesized — measuring
  a synthesized weight as if it were a real design token propagates the bug.
  On the implementation, also confirm the vendored font file backing that
  `@font-face` actually exists and its `src` request didn't 404.

## Handing off to Phase 4

The measurements document is the contract. In Phase 4, every declared CSS value
should trace back to a measured value in this document — not to intuition about
what looks right. If a needed value isn't in the document, that's a gap to go
measure, not a number to invent.

At validation time (Phase 6, `visual-validation.md`), you diff the
implementation against this same document. If validation surfaces a value you
never extracted, that's a Phase 3.5 gap to close (add the measurement), not just
a one-off fix — it means the spec was incomplete.
