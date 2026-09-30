# EDS performance, SEO, and Core Web Vitals

This file is the second half of what "done" means for this skill. Reproducing the reference's appearance (`visual-validation.md`) is necessary but not sufficient — the output must also be a production-quality Adobe Edge Delivery Services implementation: fast, crawlable, accessible, lightweight, and stable under real Core Web Vitals measurement. A page that looks pixel-identical to the reference but ships a bloated bundle, shifts layout on load, or has no meta description is not finished.

**The goal is not "make Lighthouse say 100."** The goal is a visually accurate, accessible, SEO-friendly, lightweight EDS implementation that *naturally* scores well because it's genuinely well-built — not one that's been contorted to please the audit. Never sacrifice accessibility, maintainability, semantic HTML, correct functionality, or responsive behavior just to move a number. See "Lighthouse validation" below for what to do when the two pull in different directions.

## EDS architecture — the default, not one option among many

This skill targets Edge Delivery Services specifically. Unless the existing target project already requires something else, prefer:

- EDS blocks (`{name}.js` + `{name}.css` per block, `decorate(block)` convention)
- Vanilla JavaScript and CSS — no build step assumed
- Semantic HTML
- Document-driven content (the block reads its config from authored content, not from a hardcoded data structure)
- The project's existing EDS conventions (its own `aem.js`, `scripts.js`, block patterns) over inventing a new pattern

Do **not** introduce React, Next.js, another JS framework, a large client-side runtime, or a new dependency to solve something EDS's own primitives already solve — unless the existing project has already adopted that dependency and removing it isn't in scope. A framework brought in "to make this block easier" is almost always a performance regression relative to the vanilla block it replaces, and it breaks the "no build step" assumption most EDS projects are built on. If Phase 0 discovery turns up a genuinely non-EDS target project, none of this section overrides that project's own real architecture — `discovery-process.md`'s Phase 0 still governs which architecture to build against; this section describes what to default to when the target *is* (or is being scaffolded as) EDS.

## JavaScript performance

Before adding any JavaScript to a block, ask: **"Can this be done with semantic HTML and CSS instead?"** If yes, do that instead — a `:hover`/`:focus-within` rule, a `<details>`/`<summary>` pair, a CSS-only accordion or tab pattern, `scroll-behavior: smooth`, etc. almost always beats an equivalent JS implementation on both weight and reliability.

When JavaScript is genuinely required:

- Keep it isolated to the block that needs it — a block's `.js` file should not leak behavior into other blocks, and other blocks shouldn't need to know it exists.
- Load it only when required — EDS's own lazy block-loading (`decorateBlocks`/`loadBlock`) already defers a block's JS/CSS until that block is about to render; don't undo that by eagerly importing everything from `scripts.js`.
- Don't build a large global bundle. If two blocks happen to need similar logic, factor it into a small shared utility both import, rather than duplicating it — but don't reach for a shared utility so eagerly that it becomes a dumping ground every block ends up depending on.
- Avoid unnecessary DOM manipulation — batch reads and writes, don't thrash layout by reading `offsetHeight` in a loop that also writes styles.
- Avoid unnecessary event listeners — attach at the narrowest useful scope (a block's root, not `document`, unless the interaction genuinely needs document-level delegation), and remove listeners a block no longer needs (e.g. a closed accordion that will never reopen via that listener again).
- Don't duplicate JavaScript logic across blocks that could share one small helper (but see the bundle-size caution above — this is about avoiding copy-pasted bugs, not about maximizing abstraction).
- Prefer document-generated/server-rendered HTML over client-side rendering wherever the content is knowable at authoring time. Don't fetch-and-render something in JS that could have just been authored content decorated on load.
- Remove dependencies that a block doesn't actually need — an unused import still costs a network request and parse time.

## Core Web Vitals

Treat LCP, INP, CLS, and TTFB as first-class requirements to check for every page, not just something Lighthouse happens to report afterward.

### LCP (Largest Contentful Paint)

Identify the likely LCP element before writing code, not after: usually the hero image, the hero heading, or the first substantial content block above the fold. Once identified:

- Never lazy-load the LCP image. `loading="lazy"` on the one image the browser needs to paint first directly delays LCP — this is a common, easy-to-miss mistake when a block's default image-handling code applies `loading="lazy"` uniformly. Set `loading="eager"` (or omit the attribute) on that specific image.
- Don't gate the LCP element behind unnecessary JavaScript before it can render — if a block builds its DOM entirely in JS before anything is visible, that's JS execution time sitting directly in the LCP critical path.
- Don't oversize the LCP image — serve it at (or close to) its real display size, not the original upload resolution (see "Image optimization" below).
- Don't put a blocking resource (a synchronous script, a render-blocking stylesheet not needed for first paint, an unnecessary font weight) ahead of the LCP element in the load order.
- Don't route the LCP element through a third-party script or embed if it can be avoided — third-party latency is outside your control and sits directly on the critical path.

### CLS (Cumulative Layout Shift)

- Every image needs its intrinsic dimensions available to the browser before it loads — either explicit `width`/`height` attributes (matching the image's real aspect ratio) or a CSS `aspect-ratio` on its container. Without one of these, the browser can't reserve space, and the layout jumps when the image finishes loading. This applies to every image a block renders, including ones built dynamically in JS — if a block's `decorate()` creates a fresh `<img>` element, it must carry real `width`/`height`, not just `src`/`alt`.
- Don't inject content above (or that reflows) already-rendered content after load — a banner, a cookie notice, or a lazily-measured widget that pushes everything down once it resolves is a real CLS hit.
- Don't make layout-affecting changes after initial render as a side effect of "polish" JS (e.g. re-measuring and resizing something once fonts or images have loaded, when the CSS could have reserved the right space from the start).
- Watch for shift caused by web font loading: a fallback font with different metrics than the real font causes visible reflow when the real font swaps in. Where the project vendors matching fallback-metric `@font-face` declarations (`size-adjust`, `ascent-override`, etc. tuned to approximate the real font), that's the standard EDS mitigation — don't skip it, and don't introduce a new font family without the same treatment. `font-display: swap` avoids invisible text but does not by itself avoid layout shift; the metric-matched fallback is what actually prevents the shift.
- Give components with dynamic content (a card whose text length varies, a badge whose text changes) a stable minimum footprint where the design allows it, so content variation doesn't visibly reflow the page around it.

### INP (Interaction to Next Paint)

- Minimize JavaScript on the interaction path — the less code that has to run between a click/tap and the next paint, the better this metric is by construction.
- Avoid long-running synchronous tasks (heavy loops, large synchronous DOM rewrites) triggered directly by user interaction; break up unavoidable heavy work rather than blocking the main thread for one long stretch.
- Avoid expensive event handlers — a `scroll` or `resize` handler doing non-trivial work on every event fire, with no throttling/debouncing, is a common INP (and janky-scrolling) culprit.
- Avoid unnecessary DOM updates in response to an interaction — update only the nodes that actually need to change, not a whole subtree.
- Keep interactions (menu open/close, accordion expand/collapse, tab switch) as close to a pure CSS state toggle (a class flip driving `:is()`/attribute-selector CSS) as possible, with JS doing the minimum work of flipping that state.

### TTFB (Time to First Byte)

Largely outside block-level control, but still worth checking:

- Follow the platform's own caching/delivery conventions rather than working around them (e.g. don't disable caching on a resource that should be cacheable).
- Avoid unnecessary origin requests — if content can be resolved from already-fetched data or from the initial document, don't issue a second round-trip for it.
- Avoid client-side data fetching for content that's knowable at authoring time — that's exactly the class of problem EDS's document-driven model exists to avoid; falling back to a client-side fetch reintroduces the round-trip EDS is designed to skip.
- Keep the initial HTML document itself lightweight — don't inline large blocks of data or markup into the document that could instead be deferred/lazy-loaded.

## Image optimization

Images are usually the single largest controllable cost on a page — treat every image as a real performance decision, not an afterthought.

- Serve images at (close to) their real display size, not their original upload resolution. A photo displayed in a 120px circular avatar does not need to ship at 1500px wide — resize it down (with real headroom for retina displays, roughly 2–2.5×, not blindly at full original size).
- Use responsive image techniques where the platform supports them (`<picture>`/`srcset`, or the platform's own image-resizing query parameters) so different viewports request appropriately-sized variants rather than all downloading the same large file.
- Prefer modern formats (WebP/AVIF) where the platform can serve them, falling back to JPEG/PNG only where a browser or requirement needs it. Use JPEG (not PNG) for photographic content that doesn't need transparency — PNG is dramatically larger for photos and should be reserved for images that genuinely need an alpha channel or need to stay lossless (logos, icons, screenshots with text).
- Always provide meaningful `alt` text — empty `alt=""` only for genuinely decorative images, real descriptive text for content-carrying images (see "Accessibility" below; this is also an SEO signal, not just an accessibility one).
- Lazy-load images below the fold (`loading="lazy"`); do **not** lazy-load the LCP image or anything else above the fold (see "LCP" above).
- Preserve the image's correct aspect ratio at every size it's displayed — don't stretch or squash it to fit a container; crop or letterbox deliberately if the container's ratio doesn't match the source.
- When the reference's exact image can't be obtained, use the closest already-authorized project asset (see the main `SKILL.md` Assets rule) rather than substituting an unnecessarily large placeholder "to be safe" — an oversized placeholder is itself a performance regression that then has to be fixed later.

## Fonts

- Check how many font families and how many weights/styles of each are actually loaded — every additional family or weight is a separate network request and, often, layout-shift risk. Don't add a font family or weight the reference doesn't actually use.
- Reuse fonts the project already loads rather than introducing a new one for a single block.
- Use `font-display: swap` (or the platform's default, if it already does this) so text isn't invisible while a webfont loads.
- Preload a font only when it's genuinely needed for the LCP text and isn't already covered by the platform's own font-loading strategy — an unnecessary preload competes for bandwidth with resources that matter more.
- Pair every real webfont with a metrics-matched fallback (`size-adjust`, `ascent-override`/`descent-override`, `line-gap-override`) so the fallback-to-real-font swap doesn't shift layout — see "CLS" above. This is standard practice on EDS sites already built this way (check whether the target project already has this pattern before inventing a new one).

## Third-party scripts

Third-party resources (analytics, ads, social embeds, video players, chat widgets, tracking pixels, external UI libraries) are a common, easy-to-miss source of real performance regressions, since their cost is often invisible in the authored markup.

- Identify every third-party resource the reference site loads during discovery (Phase 1) — don't just port the ones that are visually obvious (a video embed) and miss the ones that aren't (an analytics snippet, a chat-widget loader).
- Don't add a third-party script unless the reference's actual functionality or an explicit project requirement needs it. Reproducing a page's *appearance* rarely requires reproducing its analytics/marketing tags.
- When a third-party resource genuinely is required: load it as late as the functionality allows (after first paint / on interaction, not blocking initial render), scope it to only the pages that actually need it (don't load a video-embed script globally because one page has a video), and make sure it isn't being loaded more than once (e.g. once per block instance instead of once per page).
- Record any significant third-party performance cost in the component or page registry so a future pass knows it's there and why — a heavy embed that's "supposed to be heavy" (an interactive third-party tool the client actually wants) shouldn't repeatedly get "fixed" by someone unaware it was intentional.

## CSS performance

- Reuse existing styles and tokens (colors, spacing, type scale) rather than redefining equivalent values under a new name.
- Avoid unnecessary global CSS — scope a block's styles to that block's class rather than adding broad selectors that could affect unrelated markup.
- Avoid duplicated rules across files; if the same declaration block shows up in two places, that's a signal to share it (a CSS custom property, a shared class) rather than copy it a third time.
- Avoid excessive selector specificity — deeply nested or `!important`-laden selectors make the cascade harder to reason about and are usually a sign something should have been a class instead of a descendant-selector chain.
- Avoid unnecessary animations, and make any animation that exists respect `prefers-reduced-motion`.
- Prefer CSS over JavaScript for presentation, per "JavaScript performance" above.
- Keep responsive styles organized mobile-first per `responsive-rules.md` — scattered, out-of-order media queries are both a maintenance and a performance-reasoning problem.
- Remove obsolete styles when it's safe to (confirmed unused, not just apparently unused — see `visual-validation.md`'s note on not assuming a selector is dead without checking what's supposed to generate the element it targets).
- Don't create a separate stylesheet per tiny sub-component unless the existing project's architecture already does this — an EDS block's CSS file is normally the right unit of granularity; splitting further usually just adds more render-blocking requests for no benefit.

## SEO implementation

A high Lighthouse SEO score is a floor, not a ceiling — it does not mean a page is fully optimized for real search engines. Check all of the following per page, not just whatever Lighthouse happens to flag:

- **`<title>`** — present, descriptive, and unique per page (matches the reference's real title where known).
- **Meta description** — present, and copied/adapted from the reference's real content where available rather than left blank or genericized.
- **Canonical URL** — present where the platform/project convention calls for it, especially if the same content is reachable at more than one URL.
- **Robots directives** — `robots.txt` and any per-page `<meta name="robots">` reproduced or adapted correctly; don't accidentally block indexing of pages that should be indexed, and don't accidentally allow indexing of pages the reference deliberately excludes.
- **Heading hierarchy** — see "Heading structure" below.
- **Semantic HTML** — see below.
- **Internal links** — real, crawlable, and pointing at the correct routes in the target project (not broken, not pointing back at the reference site by accident).
- **Crawlable navigation** — primary navigation must be real `<a href>` links a crawler can follow, not JS-only navigation with no underlying href (see "Links and crawlability" below).
- **Descriptive link text** — see "Links and crawlability" below.
- **Image alt text** — see "Image optimization" above.
- **Clean URLs** — routes that make sense and match the project's routing convention, not query-string-driven pseudo-routes where a real path would do.
- **Sitemap** and **robots.txt** — present where the project convention expects them and where the site has enough pages for one to matter.
- **Open Graph metadata** — reproduced where the reference has it (`og:title`, `og:description`, `og:image`, etc.), since this affects how the page renders when shared, not just search ranking.
- **Structured data** (JSON-LD or equivalent) — reproduced where the reference has it and where it's genuinely applicable (an event page, an article, a product) — don't invent structured data the reference doesn't have, but don't drop it either if it does.

## Heading structure

- Each page should have a logical heading hierarchy: normally one primary heading, with `h2`/`h3` etc. nesting sensibly under it and describing the content that actually follows.
- Don't skip heading levels without a real reason grounded in the reference's own structure (see `visual-validation.md`'s accessibility section — this isn't new guidance, just restated here because it's also an SEO signal).
- Headings should describe the content they introduce, not be chosen purely for their visual size. If the reference uses (say) an `h3` somewhere for a font-size reason rather than a genuine hierarchy reason, that's a call to make deliberately (see `visual-validation.md`'s heading-hierarchy accessibility rule) — but don't casually promote/demote heading levels elsewhere just because a bigger or smaller one would look better; use CSS to adjust the visual size while keeping the semantically correct level.
- Don't change the visual design to force a "cleaner" heading hierarchy — the reference's actual visual hierarchy is what's being reproduced; use CSS overrides on the heading level to hit the right look without picking the wrong element.

## Links and crawlability

- Prefer real, crawlable `<a href="...">` links for navigation and any important content link. A `<button>` with a JS `onclick` that changes `window.location` is invisible to a crawler and unusable without JavaScript — don't use one where a real link works.
- Every link needs descriptive text (or an accessible name via `aria-label` — see the note on this in `visual-validation.md`/`SKILL.md`'s discussion of the reference's own "learn more"/"click here" style links: matching the reference's exact visible copy is a legitimate choice, but pair it with a descriptive `aria-label` for real accessibility even where the SEO audit still flags the visible text).
- Check for broken internal links as part of validation — a link that pointed at a reference URL that doesn't exist as a route in the target project should be fixed or intentionally left as an external link, not left silently broken.
- Verify the URL structure matches the project's actual routing convention rather than reproducing the reference's URL scheme wholesale when the two projects' routing differs.

## Accessibility (as a performance/SEO concern, not a separate checklist)

Accessibility isn't a separate late-stage pass — treat it as part of the same implementation and validation loop as performance and SEO, since a real portion of both overlaps with it (semantic HTML, real links, meaningful alt text, heading hierarchy). In addition to everything already covered in `visual-validation.md`'s Accessibility section, specifically check:

- Semantic landmark elements are used where they fit — `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` — instead of an unnecessary stack of generic `<div>`s. Not every wrapper needs to be a landmark, but the page's major regions should be.
- Keyboard navigation works for every interactive element (menus, accordions, dialogs, forms, buttons, links) without a mouse.
- Focus states are visible, not suppressed (`outline: none` with nothing substituted is a common, easy accessibility regression introduced while "cleaning up" default browser styling).
- Color contrast meets WCAG AA at minimum for text and meaningful UI elements.
- Forms have real `<label>` associations, not placeholder text standing in for a label.
- Don't add ARIA roles/attributes where native HTML semantics already express the same thing (an ARIA `role="button"` on something that could just be a `<button>` is a common over-application) — ARIA is for the cases semantic HTML genuinely can't express, not a default reflex.

## Responsive performance validation

Validate both the *visual* result and the *performance* characteristics at each of these checkpoints — this is a superset of, not a replacement for, this project's fixed CSS authoring scale (`768px` / `960px` / `1200px` — see `responsive-rules.md`). The CSS is authored against that three-tier scale; these additional widths are spot-checks against real, common device viewports to catch anything the three-tier scale's boundaries don't happen to expose:

- **375px** and **390px** — common small/modern phone widths.
- **768px** — tablet portrait (also a CSS tier boundary).
- **1024px** — tablet landscape / small laptop.
- **1440px** — common laptop/desktop width.
- **1920px** — common full desktop width.

At each width, check both:

**Visual**: layout, spacing, typography, images, navigation, cards/grids, content stacking — per `visual-validation.md`'s comparison list.

**Performance**: image sizes actually being requested at that viewport (not a desktop-sized image being downloaded on a 375px viewport), any resources loaded unnecessarily at that width, layout shifts specific to that width, any mobile-specific script that shouldn't also be running on desktop (or vice versa), content-visibility/viewport-specific behavior working as intended.

Don't optimize the desktop experience in a way that regresses mobile performance (e.g. a background-image or asset chosen for how it looks at 1920px that's needlessly heavy for a 375px viewport that will never show it at that size) — mobile is usually the more performance-constrained target, not an afterthought once desktop looks right.

## Lighthouse validation

Lighthouse (or the environment's closest equivalent browser performance audit) is a **required, separate step** from visual validation — not an alternative to it, and not optional once visual validation passes. Neither one alone is sufficient; both are required before a page is considered complete (see `SKILL.md`'s workflow and the closing philosophy at the top of this file).

The loop:

```
DISCOVER → PLAN → BUILD → RUN → BROWSER VALIDATION → VISUAL COMPARISON → LIGHTHOUSE → IDENTIFY ISSUES → FIX → RECHECK
```

When Lighthouse reports an issue:

1. **Identify the root cause** — don't patch the symptom. A CLS warning might be an unsized `<img>`, a late-injected banner, or a font swap; find out which before touching anything.
2. **Determine where it actually comes from**: the EDS platform/core scripts (rarely — these are usually not to be modified), block code, a specific image, CSS, JavaScript, a font, a third-party resource, or the content itself.
3. **Fix the root cause**, not a cosmetic workaround. If the honest fix would compromise accessibility, correctness, or fidelity to the reference, don't make that trade silently — say so and explain the tension (see the "Important" note at the top of this file).
4. **Re-run the audit** after the fix to confirm it actually moved the number and didn't regress something else.
5. **Record meaningful remaining issues** rather than hiding them — a real known limitation (e.g. "compression/cache headers unavailable because the local dev server doesn't set them; a real EDS deployment sets both automatically") belongs in the report, explicitly labeled as an environment limitation rather than a code defect.

**Never artificially manipulate the implementation just to raise a score** — don't strip real content to shrink page weight, don't remove a legitimately-needed third-party integration, don't fake an audit result. If a specific audit's heuristic doesn't actually align with a real user or business need (e.g. it wants generic link text changed but the reference's exact copy is a deliberate fidelity requirement), that's a genuine tension to raise with the user, not something to resolve unilaterally in either direction — see the "registry note is not a substitute for telling the user" rule in `SKILL.md`.

**Reporting scores**: only report Lighthouse numbers you actually measured by running it. Never invent or estimate a score. If Lighthouse wasn't run (no tooling available in the environment, time constraints, etc.), say so explicitly — "Lighthouse validation not performed" — rather than omitting the section or implying it was checked.

**Same tooling-ownership rule as `visual-validation.md`**: however Lighthouse (or its equivalent) gets run — the `lighthouse` CLI, a Playwright+Lighthouse integration, whatever fits the project — install it as a real `devDependency` of the project being built, not something invoked from a global install or borrowed from a different project's `node_modules`. Every project this skill is used on ends up independently able to re-run its own validation.

## Performance budget

Where practical, keep a lightweight running sense of a page's cost rather than only discovering it's heavy after the fact:

- JavaScript size (per block and total)
- CSS size (per block and total)
- Image sizes (individually and total page weight from images)
- Number of network requests
- Number and weight of third-party requests
- Font resources (count of families/weights, total font payload)
- Blocking resources (anything delaying first paint)

If a change significantly increases any of these, ask whether it's actually necessary before shipping it — prefer the smallest implementation that satisfies the actual requirement, not the most convenient one.

## Block-level performance evaluation

Evaluate every block independently, the same way `naming-rules.md`/`component-registry.md` already track it structurally — performance is one more dimension of what a block "is," not a separate afterthought pass. For each block, work out:

- Does it need JavaScript at all, or can CSS cover the behavior (see "JavaScript performance" above)?
- Does it load images? If so, is it likely to contain the page's LCP element?
- Does it embed third-party content?
- Can it cause CLS (dynamic content, late-loading images/fonts, animation)?
- Does it add network requests beyond its own `.js`/`.css` (fetching data, loading a fragment, loading a third-party script)?
- Is it reused across multiple pages (meaning a performance issue here has multiplied impact)?

Worked examples of the kind of block-specific reasoning this produces:

- **Hero** — usually carries the LCP element. Prioritize its critical image (eager-load, sized correctly, not gated behind JS), avoid unnecessary JS for what's usually a mostly-static, above-the-fold region.
- **Cards** — should be lightweight HTML/CSS; use responsive image sizing; lazy-load any card images that are below the fold, but not the first row if it's above the fold.
- **Accordion** — prefer a semantic HTML/CSS-only implementation (`<details>`/`<summary>`, or a CSS `:checked`/`:has()` pattern) where the design allows it; fall back to minimal block JS only where the interaction genuinely needs it (e.g. syncing open/close state with URL hash, or an animation CSS alone can't express).
- **Video** — don't load the actual video resource before it's needed (a poster image plus click-to-play, or a deferred/lazy-loading strategy for the player itself); a video embed that auto-loads its full player and resource on every page load is a common, large, avoidable cost.

Record the performance-relevant facts about each block in the component registry alongside its existing fields — see the extended table format in `component-registry.md`.

## Final quality gate (performance/SEO-specific — see `visual-validation.md` for the visual/accessibility half)

Before marking a page complete, in addition to `visual-validation.md`'s checklist:

- [ ] Likely LCP element identified and not unnecessarily delayed (not lazy-loaded, not gated behind JS, not oversized)
- [ ] Every image has real `width`/`height` or a CSS `aspect-ratio` reserving its space
- [ ] Below-the-fold images lazy-loaded; above-the-fold images (especially the LCP element) are not
- [ ] Fonts checked: no unnecessary families/weights, metrics-matched fallback in place where a real webfont is used
- [ ] JavaScript minimized: nothing added that semantic HTML/CSS could have done instead, no unnecessary global bundle growth
- [ ] Third-party resources identified, justified, deferred/scoped appropriately, and not loaded more than once
- [ ] CLS risks checked (dynamic content, late-loading assets, font swap, injected content)
- [ ] INP risks checked (expensive handlers, long synchronous tasks, unnecessary DOM updates on interaction)
- [ ] TTFB considerations checked (no unnecessary origin round-trips, no avoidable client-side fetch for knowable-at-authoring-time content)
- [ ] `<title>`, meta description, canonical, robots directives, Open Graph, and structured data checked per page (not just assumed from the Lighthouse SEO score)
- [ ] Heading hierarchy checked
- [ ] Internal links checked (crawlable, not broken, descriptive text or a descriptive `aria-label`)
- [ ] Responsive performance validated at 375 / 390 / 768 / 1024 / 1440 / 1920, not just the three CSS authoring tiers
- [ ] Lighthouse (or the environment's equivalent) actually run, with real measured scores reported — never invented
- [ ] Any Lighthouse finding traced to a root cause and fixed there, not patched cosmetically
- [ ] Remaining known issues (including environment limitations distinct from code defects) explicitly recorded
